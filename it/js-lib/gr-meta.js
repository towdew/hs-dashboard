// GR(Global Request) 탭 전용 메타 헬퍼 — 순수함수만 포함(DOM 접근 없음).
// 용도: (1) 워크북 Country 셀 원문(예: "CA-en", "RU : RU (ru)")을
//          data/gr-changes.json·data/gr-urls.json의 countryCode(예: "CA_EN","RU")로 정규화
//       (2) 시트 displayTitle(예: "W17 - GNB Structure")을 두 JSON의 task 키("GNB Structure")로 정규화
//       (3) "task|code" 키로 두 JSON을 조회(별칭 매핑 포함)

// ── 국가 코드 DUAL 규칙 ──────────────────────────────────────
// 워크북 Country 셀이 "XX-yy"(대문자 베이스 + 소문자 언어접미사) 형태일 때,
// 같은 베이스 국가라도 언어에 따라 서로 다른 countryCode를 쓰는 예외들.
// ca/hk/sa/ae는 계획서에 명시된 예외, ch/eg는 gr-changes.json·gr-urls.json 실 데이터
// (예: "GNB Structure|CH_DE", "GNB Structure|EG_AR")로 확인된 예외.
var GR_DUAL_LOCALE_MAP = {
  'ca-en': 'CA_EN', 'ca-fr': 'CA_FR',
  'hk-en': 'HK_EN', 'hk-zh': 'HK',
  'sa-en': 'SA_EN', 'sa-ar': 'SA',
  'ae-ar': 'AE_AR', 'ae-en': 'AE',
  'ch-de': 'CH_DE', 'ch-fr': 'CH_FR',
  'eg-ar': 'EG_AR', 'eg-en': 'EG_EN',
};

// ── 작업명 별칭 매핑 ─────────────────────────────────────────
// 분석리포트(gr-changes/gr-urls 원천)와 Global Request 워크북의 작업명 표기가
// 어긋나는 경우의 예외 테이블. grLookup이 1차 조회 실패 시 여기서 대체 키를 시도한다.
var GR_TASK_KEY_ALIASES = {
  'UL인증 feature 삭제 1차': 'UL인증 feature 삭제',
};

// ── 국가 풀네임 역매핑 ───────────────────────────────────────
// sheet-loader.js의 COUNTRY_FULLNAME_MAP(코드→풀네임)을 렌더 시점에 이미 거쳐
// DATA[key].tableRows의 Country 셀 값이 "United Arab Emirates (ar)"처럼 코드가 아닌
// 풀네임(+언어 힌트)으로 저장되어 있는 경우가 많다. grNormalizeCountryCode가 이를
// 다시 코드로 되돌리기 위한 역매핑(코드가 두 개인 UK/GB는 gr-changes/gr-urls가 실제
// 사용하는 "UK"를 채택). sheet-loader.js의 맵과 항상 동기화할 것.
var GR_COUNTRY_NAME_TO_CODE = {
  AFRICA: 'AFRICA', LEVANT: 'LEVANT',
  'UNITED ARAB EMIRATES': 'AE', AFGHANISTAN: 'AF', ANGOLA: 'AO', ARGENTINA: 'AR', AUSTRIA: 'AT', AUSTRALIA: 'AU',
  BANGLADESH: 'BD', BELGIUM: 'BE', BULGARIA: 'BG', BAHRAIN: 'BH', BOLIVIA: 'BO', BRAZIL: 'BR', CANADA: 'CA',
  SWITZERLAND: 'CH', CHILE: 'CL', CHINA: 'CN', COLOMBIA: 'CO', 'COSTA RICA': 'CR', CYPRUS: 'CY', 'CZECH REPUBLIC': 'CZ',
  GERMANY: 'DE', DENMARK: 'DK', 'DOMINICAN REPUBLIC': 'DO', ALGERIA: 'DZ', ECUADOR: 'EC', ESTONIA: 'EE', EGYPT: 'EG',
  SPAIN: 'ES', FINLAND: 'FI', FRANCE: 'FR', GHANA: 'GH', GREECE: 'GR', GUATEMALA: 'GT',
  'HONG KONG': 'HK', HONDURAS: 'HN', CROATIA: 'HR', HUNGARY: 'HU', INDONESIA: 'ID', IRELAND: 'IE', ISRAEL: 'IL',
  INDIA: 'IN', IRAN: 'IR', IRAQ: 'IQ', ITALY: 'IT', JORDAN: 'JO', JAPAN: 'JP', KENYA: 'KE', CAMBODIA: 'KH',
  'SOUTH KOREA': 'KR', KUWAIT: 'KW', KAZAKHSTAN: 'KZ', LEBANON: 'LB', 'SRI LANKA': 'LK', LITHUANIA: 'LT', LATVIA: 'LV',
  MOROCCO: 'MA', MYANMAR: 'MM', MEXICO: 'MX', MALAYSIA: 'MY', NIGERIA: 'NG', NICARAGUA: 'NI', NETHERLANDS: 'NL',
  NORWAY: 'NO', NEPAL: 'NP', 'NEW ZEALAND': 'NZ', OMAN: 'OM', PANAMA: 'PA', PERU: 'PE', PHILIPPINES: 'PH',
  PAKISTAN: 'PK', POLAND: 'PL', 'PUERTO RICO': 'PR', PORTUGAL: 'PT', PARAGUAY: 'PY', QATAR: 'QA', ROMANIA: 'RO',
  SERBIA: 'RS', 'SAUDI ARABIA': 'SA', SWEDEN: 'SE', SINGAPORE: 'SG', SLOVENIA: 'SI', SLOVAKIA: 'SK', 'EL SALVADOR': 'SV',
  THAILAND: 'TH', TUNISIA: 'TN', TURKEY: 'TR', TAIWAN: 'TW', TANZANIA: 'TZ', UKRAINE: 'UA',
  'UNITED KINGDOM': 'UK',
  'UNITED STATES': 'US', URUGUAY: 'UY', VENEZUELA: 'VE', VIETNAM: 'VN', 'SOUTH AFRICA': 'ZA',
};

function grNormalizeCountryCode(rawCountry) {
  var s = String(rawCountry == null ? '' : rawCountry).trim();
  if (!s) return '';

  // 언어 힌트: 원문 어디에 있든 마지막 "(xx)" 괄호에서 추출.
  // "CA : CA (en)", "CA (en)", "CN (zh)", "United Arab Emirates (ar)" 처럼
  // 콜론/풀네임 유무와 무관하게 붙는 형태를 포괄한다.
  var langHint = '';
  var parenMatch = s.match(/\(([a-zA-Z]{2})\)\s*$/);
  if (parenMatch) langHint = parenMatch[1].toLowerCase();

  // 베이스 토큰: " : " 앞부분(있으면 그것), 없으면 원문 전체에서 괄호 힌트만 제거.
  var base = s;
  var colonIdx = base.indexOf(' : ');
  if (colonIdx >= 0) base = base.slice(0, colonIdx);
  base = base.replace(/\s*\([a-zA-Z]+\)\s*$/, '').trim();
  if (!base) return '';

  // "XX-yy" 형태(대문자 베이스 + 소문자 2자리 언어 접미사)면 접미사를 언어 힌트로 채택.
  var dashMatch = base.match(/^([A-Za-z]+)-([a-zA-Z]{2})$/);
  if (dashMatch) {
    base = dashMatch[1];
    langHint = dashMatch[2].toLowerCase();
  }
  base = base.toUpperCase();

  // 렌더 파이프라인이 이미 코드를 풀네임으로 바꿔둔 경우("United Arab Emirates") 역매핑.
  if (Object.prototype.hasOwnProperty.call(GR_COUNTRY_NAME_TO_CODE, base)) {
    base = GR_COUNTRY_NAME_TO_CODE[base];
  }

  // DUAL 규칙: 언어 힌트가 있고 (베이스+언어) 조합이 예외 테이블에 있으면 대체 코드 사용.
  if (langHint) {
    var dualKey = base.toLowerCase() + '-' + langHint;
    if (Object.prototype.hasOwnProperty.call(GR_DUAL_LOCALE_MAP, dualKey)) {
      return GR_DUAL_LOCALE_MAP[dualKey];
    }
  }
  return base;
}

// GR 타이틀 문자열(예: "GR26-W16-MS-IT-PC PDP Gallery Card Addition for JS Global")을
// 정규화해 window._grTitleToTask(displayTitle→task 역매핑)의 조회 키로 쓴다.
// 공백 정리 + casefold — grNormalizeCountryCode 등 파일 내 다른 정규화 스타일과 통일.
function grNormTitleKey(s) {
  return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().toLowerCase();
}

function grTaskKeyOf(displayTitle) {
  var s = String(displayTitle == null ? '' : displayTitle).trim();
  // 1순위: GR 타이틀 → 태스크명 역매핑(ensureGrDataLoaded가 로드하는 data/gr-titles.json 기반).
  // GR 타이틀은 태스크명을 문자열로 포함하지 않는 경우가 있어(예: "GR26-W16-MS-IT-PC PDP
  // Gallery Card Addition for JS Global" ↔ "Microsoft PDP Gallery Card") 정규식 폴백만으로는
  // 복원 불가 — 반드시 역매핑 테이블을 우선 조회한다.
  var hasWindow = typeof window !== 'undefined';
  var titleToTask = hasWindow ? window._grTitleToTask : null;
  if (titleToTask) {
    var normKey = grNormTitleKey(s);
    if (Object.prototype.hasOwnProperty.call(titleToTask, normKey)) {
      return titleToTask[normKey];
    }
  }
  // 2순위(폴백): 기존 "W<n> - 태스크명" 프리픽스 제거.
  return s.replace(/^W\d+\s*-\s*/, '').trim();
}

function grLookup(dict, taskKey, code) {
  if (!dict || !taskKey || !code) return null;
  var key = taskKey + '|' + code;
  if (Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
  var alias = GR_TASK_KEY_ALIASES[taskKey];
  if (alias) {
    var aliasKey = alias + '|' + code;
    if (Object.prototype.hasOwnProperty.call(dict, aliasKey)) return dict[aliasKey];
  }
  return null;
}

// 사이드바 GR 탭을 In Progress / Done 두 그룹으로 나눈다.
// pct는 완료율(취소 제외 분모, contentStats 기준). override는 data/gr-task-state.json의
// 수동 지정('done' | 'in_progress')으로 자동 판정보다 우선한다.
// 국가행이 없는 신규 태스크는 pct=0 → in_progress (완료로 오분류되지 않게).
function grTaskGroupOf(pct, override) {
  if (override === 'done' || override === 'in_progress') return override;
  var n = Number(pct);
  return (isFinite(n) && n >= 100) ? 'done' : 'in_progress';
}

// gr-changes.json의 changes에서 해당 태스크의 실제 변경 건수를 센다.
// taskSummary를 그대로 쓰지 않는 이유: 수동 재작성된 gr-changes에서 taskSummary에만
// 신규가 집계되고 changes에는 대응 엔트리가 없는 상태가 실제로 발생했다(2026-08-04 실측 —
// Copilot+ Hero Banner·UltraGear 1000Hz FAQ·Windows 11 Landing·PDP Gallery Win11 Pro 4건).
// 그 경우 카드에는 "금주 변경 1건 (신규 1)"이 뜨는데 정작 어느 국가행에도 NEW 배지가
// 붙지 않아, 사용자는 무엇이 바뀌었는지 찾을 수 없다. 배지의 출처를 changes 한 곳으로
// 통일해 요약과 행 배지가 항상 일치하게 한다.
// 조회 키는 grLookup과 동일한 "taskKey|code" 규약 + GR_TASK_KEY_ALIASES 폴백.
function grCountTaskChanges(changes, taskKey) {
  var out = { changed: 0, added: 0, total: 0 };
  if (!changes || !taskKey) return out;
  var prefixes = [taskKey + '|'];
  var alias = GR_TASK_KEY_ALIASES[taskKey];
  if (alias) prefixes.push(alias + '|');
  Object.keys(changes).forEach(function(key) {
    var matched = prefixes.some(function(p) { return key.lastIndexOf(p, 0) === 0; });
    if (!matched) return;
    var type = (changes[key] || {}).type;
    if (type === 'new_task' || type === 'new_country') out.added++;
    else out.changed++;
    out.total++;
  });
  return out;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    grNormalizeCountryCode: grNormalizeCountryCode,
    grTaskGroupOf: grTaskGroupOf,
    grTaskKeyOf: grTaskKeyOf,
    grLookup: grLookup,
    grCountTaskChanges: grCountTaskChanges,
    grNormTitleKey: grNormTitleKey,
    GR_DUAL_LOCALE_MAP: GR_DUAL_LOCALE_MAP,
    GR_COUNTRY_NAME_TO_CODE: GR_COUNTRY_NAME_TO_CODE,
    GR_TASK_KEY_ALIASES: GR_TASK_KEY_ALIASES,
  };
}
