function urlLibLocaleToken(rawLocale) {
  var raw = rawLocale || '';
  var idx = raw.indexOf(' : ');
  return idx >= 0 ? raw.slice(0, idx) : raw;
}

// ── 로케일 표기 기준 (2026-08-07 사용자 지시로 정리) ─────────────
// 문제: AE는 "United Arab Emirates", AE_AR은 "UAE (Arabic)"처럼 같은 국가인데 국가명이
// 다르고, 언어 병기 여부도 들쭉날쭉했다. 아래 두 규칙으로 통일한다.
//   ① 국가명은 **베이스 국가 코드 하나**로 통일 (AE_AR → AE의 이름을 쓴다)
//   ② 같은 국가에 로케일이 **2개 이상일 때만** 언어를 병기하고, 그 경우 **전부** 병기한다
//      (AE/AE_AR → 'United Arab Emirates (English)' / '... (Arabic)',
//       DE 하나뿐 → 'Germany')
// 언어는 하드코딩하지 않고 원본 locale 문자열의 괄호 코드에서 읽는다("AE : AE (en)").
var URL_LIB_COUNTRY_NAMES = {
  AE: 'United Arab Emirates', AFRICA: 'Africa', AR: 'Argentina', AT: 'Austria',
  AU: 'Australia', BD: 'Bangladesh', BE: 'Belgium', BG: 'Bulgaria', BR: 'Brazil',
  CA: 'Canada', CAC: 'Central America', CH: 'Switzerland', CL: 'Chile', CN: 'China',
  CO: 'Colombia', CZ: 'Czech Republic', DE: 'Germany', DK: 'Denmark', DZ: 'Algeria',
  EASTAFRICA: 'East Africa', EC: 'Ecuador', EE: 'Estonia', EG: 'Egypt', ES: 'Spain',
  FI: 'Finland', FR: 'France', GB: 'United Kingdom', GLOBAL: 'Global', GR: 'Greece',
  HK: 'Hong Kong', HR: 'Croatia', HU: 'Hungary', ID: 'Indonesia', IE: 'Ireland',
  IL: 'Israel', IN: 'India', IR: 'Iran', IT: 'Italy', JP: 'Japan', KR: 'South Korea',
  KZ: 'Kazakhstan', LEVANT: 'Levant', LK: 'Sri Lanka', LT: 'Lithuania', LV: 'Latvia',
  MX: 'Mexico', MY: 'Malaysia', NL: 'Netherlands', NO: 'Norway', NP: 'Nepal',
  NZ: 'New Zealand', PA: 'Panama', PE: 'Peru', PH: 'Philippines', PL: 'Poland',
  PT: 'Portugal', RO: 'Romania', RS: 'Serbia', RU: 'Russia', SA: 'Saudi Arabia',
  SE: 'Sweden', SG: 'Singapore', SK: 'Slovakia', TH: 'Thailand', TN: 'Tunisia',
  TR: 'Turkey', TW: 'Taiwan', UA: 'Ukraine', UK: 'United Kingdom', US: 'United States',
  UZ: 'Uzbekistan', VN: 'Vietnam', ZA: 'South Africa',
};

// 원본 locale 괄호 코드 → 언어명. 'in'(인도네시아)·'iw'(히브리)는 구 ISO 코드라 함께 매핑.
var URL_LIB_LANG_NAMES = {
  ar: 'Arabic', bg: 'Bulgarian', cs: 'Czech', da: 'Danish', de: 'German', el: 'Greek',
  en: 'English', es: 'Spanish', et: 'Estonian', fa: 'Persian', fi: 'Finnish',
  fr: 'French', he: 'Hebrew', hr: 'Croatian', hu: 'Hungarian', id: 'Indonesian',
  'in': 'Indonesian', it: 'Italian', iw: 'Hebrew', ja: 'Japanese', kk: 'Kazakh',
  ko: 'Korean', lt: 'Lithuanian', lv: 'Latvian', nl: 'Dutch', no: 'Norwegian',
  pl: 'Polish', pt: 'Portuguese', ro: 'Romanian', ru: 'Russian', sk: 'Slovak',
  sr: 'Serbian', sv: 'Swedish', th: 'Thai', tr: 'Turkish', uk: 'Ukrainian',
  uz: 'Uzbek', vi: 'Vietnamese', zh: 'Chinese',
};

// 'AE_AR' → 'AE', 'CA_EN' → 'CA'. 언더스코어 뒤가 언어/지역 접미사인 경우만 잘라내고,
// 'EASTAFRICA'처럼 접미사가 없는 토큰은 그대로 둔다.
function urlLibBaseCountry(token) {
  var key = String(token || '').toUpperCase().replace(/-/g, '_');
  if (Object.prototype.hasOwnProperty.call(URL_LIB_COUNTRY_NAMES, key)) return key;
  var head = key.split('_')[0];
  return Object.prototype.hasOwnProperty.call(URL_LIB_COUNTRY_NAMES, head) ? head : key;
}

// 원본 locale 문자열("AE_AR : AE (ar)")에서 언어 코드만 뽑는다.
function urlLibLocaleLang(rawLocale) {
  var m = String(rawLocale || '').match(/\(([A-Za-z]{2})\)\s*$/);
  return m ? m[1].toLowerCase() : '';
}

function urlLibLangName(code) {
  var c = String(code || '').toLowerCase();
  return URL_LIB_LANG_NAMES[c] || (c ? c.toUpperCase() : '');
}

function urlLibCountryName(token) {
  var base = urlLibBaseCountry(token);
  return URL_LIB_COUNTRY_NAMES[base] || token;
}

// 셀렉트/목록 표시용 라벨. withLang이면 '국가명 (언어)' — 같은 국가에 로케일이
// 둘 이상일 때만 호출부가 true를 준다(위 표기 기준 ②).
function urlLibLocaleDisplayName(token, langCode, withLang) {
  var name = urlLibCountryName(token);
  var lang = withLang ? urlLibLangName(langCode) : '';
  return lang ? name + ' (' + lang + ')' : name;
}

// models → { token: {lang, base, withLang} }. 언어는 데이터에서 읽고,
// 같은 베이스 국가에 토큰이 2개 이상이면 withLang=true.
function urlLibLocaleDisplayMap(models) {
  var meta = {};
  (models || []).forEach(function (m) {
    (m.locales || []).forEach(function (l) {
      var t = urlLibLocaleToken(l.locale);
      if (!t) return;
      if (!meta[t]) meta[t] = { lang: urlLibLocaleLang(l.locale), base: urlLibBaseCountry(t) };
      else if (!meta[t].lang) meta[t].lang = urlLibLocaleLang(l.locale);
    });
  });
  var baseCount = {};
  Object.keys(meta).forEach(function (t) { baseCount[meta[t].base] = (baseCount[meta[t].base] || 0) + 1; });
  Object.keys(meta).forEach(function (t) { meta[t].withLang = baseCount[meta[t].base] > 1; });
  return meta;
}

function urlLibLocaleMatchesQuery(token, query) {
  if (!query) return true;
  var q = query.toLowerCase();
  return token.toLowerCase().indexOf(q) !== -1 ||
    urlLibCountryName(token).toLowerCase().indexOf(q) !== -1;
}

function buildUrlLibLocaleIndex(models) {
  var index = {};
  (models || []).forEach(function (model) {
    (model.locales || []).forEach(function (loc) {
      var token = urlLibLocaleToken(loc.locale);
      if (!index[token]) index[token] = [];
      index[token].push({
        modelName: model.modelName,
        category: model.category,
        status: loc.status,
        prodUrl: loc.prodUrl,
      });
    });
  });
  return index;
}

function urlLibDisplayUrl(prodUrl) {
  var displayUrl = (prodUrl || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (displayUrl.length > 60) displayUrl = displayUrl.slice(0, 58) + '…';
  return displayUrl;
}

// 같은 국가의 언어별 사이트(CA-en/CA-fr 등)는 1개국으로 집계 — 사이트 수(locales.length)와 구분.
function urlLibCountryCount(model) {
  var seen = {};
  var n = 0;
  ((model && model.locales) || []).forEach(function (l) {
    var cc = String(l.locale || '').split(':')[0].trim().split(/[-_]/)[0].toUpperCase();
    if (cc && !seen[cc]) { seen[cc] = 1; n++; }
  });
  return n;
}

// status·locale 조건을 **같은 로케일 항목에서** 함께 만족하는 것만 반환한다.
// 두 조건을 따로 평가하면 "DE 로케일이 있고" AND "어딘가 ACTIVE가 있는" 모델이 통과해
// 정작 DE는 DISCONTINUED인 모델까지 잡힌다(2026-08-07 사용자 지적).
// 목록 필터와 상세 테이블이 이 함수를 공유해야 "걸러놓고 펼치면 다 보이는" 불일치가 없다.
function urlLibMatchedLocales(model, filter) {
  var f = filter || {};
  return ((model && model.locales) || []).filter(function (l) {
    if (f.status && l.status !== f.status) return false;
    if (f.locale && urlLibLocaleToken(l.locale) !== f.locale) return false;
    return true;
  });
}

function urlLibFilterModels(allModels, filter) {
  var q = (filter.search || '').toLowerCase().trim();
  var localeTok = filter.locale || '';
  return (allModels || []).filter(function (m) {
    if (q) {
      var nameHit = m.modelName.toLowerCase().includes(q);
      var codeHit = m.salesModelCode.toLowerCase().includes(q);
      var urlHit = (m.locales || []).some(function (l) {
        return (l.prodUrl || '').toLowerCase().indexOf(q) !== -1;
      });
      if (!nameHit && !codeHit && !urlHit) return false;
    }
    if (filter.category && m.category !== filter.category) return false;
    // status·locale은 교차(같은 항목) 평가 — 위 urlLibMatchedLocales 주석 참고
    if ((filter.status || localeTok) && urlLibMatchedLocales(m, filter).length === 0) return false;
    return true;
  });
}

function urlLibSortModels(models, sortKey) {
  var arr = (models || []).slice();
  if (sortKey === 'name') {
    arr.sort(function (a, b) { return a.modelName.localeCompare(b.modelName); });
  } else if (sortKey === 'locales_desc') {
    arr.sort(function (a, b) {
      var d = b.locales.length - a.locales.length;
      return d !== 0 ? d : a.modelName.localeCompare(b.modelName);
    });
  } else if (sortKey === 'locales_asc') {
    arr.sort(function (a, b) {
      var d = a.locales.length - b.locales.length;
      return d !== 0 ? d : a.modelName.localeCompare(b.modelName);
    });
  }
  return arr;
}

function urlLibPaginate(items, page, pageSize) {
  var totalPages = Math.ceil(items.length / pageSize);
  var clampedPage = Math.max(1, Math.min(page, totalPages || 1));
  var pageItems = items.slice((clampedPage - 1) * pageSize, clampedPage * pageSize);
  return { totalPages: totalPages, page: clampedPage, pageItems: pageItems };
}

function urlLibEscapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function urlLibSelectA11y(label) {
  return ' aria-label="' + urlLibEscapeHtml(label) + '"';
}

function urlLibEmptyStateMarkup(message) {
  return '<div class="url-lib-empty" role="status"><p>' + urlLibEscapeHtml(message) +
    '</p><button type="button" class="url-lib-page-btn" onclick="urlLibResetFilter()">필터 초기화</button></div>';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    urlLibLocaleToken: urlLibLocaleToken,
    urlLibCountryName: urlLibCountryName,
    urlLibBaseCountry: urlLibBaseCountry,
    urlLibLocaleLang: urlLibLocaleLang,
    urlLibLangName: urlLibLangName,
    urlLibLocaleDisplayName: urlLibLocaleDisplayName,
    urlLibLocaleDisplayMap: urlLibLocaleDisplayMap,
    urlLibLocaleMatchesQuery: urlLibLocaleMatchesQuery,
    buildUrlLibLocaleIndex: buildUrlLibLocaleIndex,
    urlLibDisplayUrl: urlLibDisplayUrl,
    urlLibCountryCount: urlLibCountryCount,
    urlLibMatchedLocales: urlLibMatchedLocales,
    urlLibFilterModels: urlLibFilterModels,
    urlLibSortModels: urlLibSortModels,
    urlLibPaginate: urlLibPaginate,
    urlLibSelectA11y: urlLibSelectA11y,
    urlLibEmptyStateMarkup: urlLibEmptyStateMarkup,
    URL_LIB_COUNTRY_NAMES: URL_LIB_COUNTRY_NAMES,
    URL_LIB_LANG_NAMES: URL_LIB_LANG_NAMES,
  };
}
