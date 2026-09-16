// 딥링크(`?task=…`) 헬퍼 — 순수함수만 포함(DOM·history 접근 없음).
//
// 왜 필요한가: 대시보드는 사이드바 클릭으로만 시트를 바꾸는 SPA라 특정 태스크를 남에게
// 보내 줄 방법이 없었다. 첫 진입은 "In Progress 중 최신"으로 고정돼, Done으로 넘어간 건은
// 매번 사이드바에서 찾아야 했다.
//
// 식별자 규칙: 내부 키(`sheet_N`)는 xlsx 탭 순서라 시트가 하나 끼면 전부 밀린다. URL에는
// 제목에서 만든 슬러그를 쓰고, 들어올 때는 제목과 **부분 일치**로 찾는다. 그래서
// `?task=W31-Smart-Monitor-Multi-AI`도, `?task=GR26-W31-MS-IT Smart Monitor Multi AI 에셋 수정`도,
// 손으로 줄여 친 `?task=smart monitor multi`도 같은 시트로 간다.

var GR_DEEPLINK_PARAM = 'task';

// 비교용 정규화: 소문자·NFC, 영숫자와 한글(완성형+호환 자모)만 남긴다.
// 공백·하이픈·괄호·슬래시 등은 전부 지워 표기 흔들림(`W31 - `, `W31-`, `W31 `)을 흡수한다.
function grDeepLinkNormalize(value) {
  var s = String(value == null ? '' : value);
  if (typeof s.normalize === 'function') s = s.normalize('NFC');
  return s.toLowerCase().replace(/[^a-z0-9\uac00-\ud7a3\u3131-\u318e]+/g, '');
}

// URL용 슬러그: 소문자, 구분자는 하이픈 하나로. asciiOnly면 한글을 버린다(공유 링크가
// %EC%97%90… 로 지저분해지지 않게). 한글만 있는 제목은 빈 문자열이 될 수 있으니 호출자가 폴백한다.
function grDeepLinkSlug(title, asciiOnly) {
  var s = String(title == null ? '' : title);
  if (typeof s.normalize === 'function') s = s.normalize('NFC');
  var sep = asciiOnly ? /[^a-z0-9]+/g : /[^a-z0-9\uac00-\ud7a3\u3131-\u318e]+/g;
  return s.toLowerCase().replace(sep, '-').replace(/^-+|-+$/g, '');
}

var GR_DEEPLINK_HANGUL = /[\uac00-\ud7a3\u3131-\u318e]/;

// 파라미터에 한글이 없으면 제목의 한글도 지운 채 비교한다. ASCII 슬러그(`w23-39gx950b-2`)는
// 한글을 버리고 만들어져 "…950b·이미지 수정·2차"의 2가 한글 뒤에 떨어져 있기 때문 —
// 양쪽을 같은 잣대로 깎아야 슬러그가 자기 제목에 되돌아온다.
function grDeepLinkComparable(value, asciiOnly) {
  var norm = grDeepLinkNormalize(value);
  return asciiOnly ? norm.replace(/[\uac00-\ud7a3\u3131-\u318e]+/g, '') : norm;
}

function grDeepLinkEntryTitles(entry) {
  var out = [];
  if (!entry) return out;
  if (entry.shortTitle) out.push(entry.shortTitle);
  if (entry.title && entry.title !== entry.shortTitle) out.push(entry.title);
  // xlsx 탭 이름("W18 - FAQ Request (UltraGear PL")도 받는다 — 사람들이 시트를 부를 때 쓰는 이름이다.
  if (entry.tabName && out.indexOf(entry.tabName) < 0) out.push(entry.tabName);
  // 커스텀 탭 별칭(npi_product_status 등)도 부분 일치 대상 — `?task=npi`로 들어올 수 있게.
  (entry.aliases || []).forEach(function (a) { if (a && out.indexOf(a) < 0) out.push(a); });
  return out;
}

/**
 * 현재 키의 URL 파라미터 값을 만든다.
 * entries: [{ key, title, shortTitle?, aliases? }]. 커스텀 탭(제품현황·URL Library)은
 * aliases[0]을 고정 id로 쓴다. GR 시트는 ASCII 슬러그가 다른 시트와 겹치지 않으면 그것을,
 * 겹치면(예: 같은 주차의 한글 전용 제목들) 한글을 살린 슬러그를, 그것도 비면 키를 쓴다.
 */
function grBuildTaskParam(entries, key) {
  var list = entries || [];
  var entry = null;
  for (var i = 0; i < list.length; i++) if (list[i] && list[i].key === key) { entry = list[i]; break; }
  if (!entry) return '';
  if (entry.aliases && entry.aliases.length) return String(entry.aliases[0]);

  var base = entry.shortTitle || entry.title || '';
  var ascii = grDeepLinkSlug(base, true);
  if (ascii) {
    var clash = false;
    for (var j = 0; j < list.length; j++) {
      var other = list[j];
      if (!other || other.key === key || (other.aliases && other.aliases.length)) continue;
      if (grDeepLinkSlug(other.shortTitle || other.title || '', true) === ascii) { clash = true; break; }
    }
    if (!clash) return ascii;
  }
  return grDeepLinkSlug(base, false) || String(entry.key);
}

/**
 * `?task=` 값으로 시트 키를 찾는다. 반환: { key, exact, ambiguous, candidates } 또는 null.
 * 1) 키·별칭 정확 일치 → 2) 제목 정규화 정확 일치 → 3) 제목 부분 일치(유일하면 확정,
 * 여럿이면 짧은 제목이 그 값으로 시작하는 것을 우선, 그래도 여럿이면 첫 번째 + ambiguous).
 */
function grResolveTaskParam(param, entries) {
  var raw = String(param == null ? '' : param).trim();
  if (!raw) return null;
  var norm = grDeepLinkNormalize(raw);
  if (!norm) return null;
  var asciiOnly = !GR_DEEPLINK_HANGUL.test(norm);
  var cmp = function (value) { return grDeepLinkComparable(value, asciiOnly); };
  var list = (entries || []).filter(function (e) { return e && e.key; });

  for (var i = 0; i < list.length; i++) {
    var e = list[i];
    if (e.key === raw) return { key: e.key, exact: true, ambiguous: false, candidates: [e.key] };
    var aliases = e.aliases || [];
    for (var a = 0; a < aliases.length; a++) {
      if (cmp(aliases[a]) === norm) return { key: e.key, exact: true, ambiguous: false, candidates: [e.key] };
    }
  }

  for (var k = 0; k < list.length; k++) {
    var titles = grDeepLinkEntryTitles(list[k]);
    for (var t = 0; t < titles.length; t++) {
      if (cmp(titles[t]) === norm) return { key: list[k].key, exact: true, ambiguous: false, candidates: [list[k].key] };
    }
  }

  var hits = list.filter(function (entry) {
    return grDeepLinkEntryTitles(entry).some(function (title) {
      return cmp(title).indexOf(norm) >= 0;
    });
  });
  if (!hits.length) return null;
  if (hits.length === 1) return { key: hits[0].key, exact: false, ambiguous: false, candidates: [hits[0].key] };

  var starts = hits.filter(function (entry) {
    return cmp(entry.shortTitle || entry.title || '').indexOf(norm) === 0;
  });
  var pick = starts.length === 1 ? starts[0] : hits[0];
  return {
    key: pick.key,
    exact: false,
    ambiguous: starts.length !== 1,
    candidates: hits.map(function (h) { return h.key; }),
  };
}

/** 기존 쿼리스트링에 task 값을 넣거나(빈 값이면 제거) 다른 파라미터는 그대로 둔 새 search 문자열. */
function grWithTaskParam(search, value) {
  var params = new URLSearchParams(String(search == null ? '' : search).replace(/^\?/, ''));
  if (value) params.set(GR_DEEPLINK_PARAM, value);
  else params.delete(GR_DEEPLINK_PARAM);
  var s = params.toString();
  return s ? '?' + s : '';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GR_DEEPLINK_PARAM: GR_DEEPLINK_PARAM,
    grDeepLinkNormalize: grDeepLinkNormalize,
    grDeepLinkSlug: grDeepLinkSlug,
    grBuildTaskParam: grBuildTaskParam,
    grResolveTaskParam: grResolveTaskParam,
    grWithTaskParam: grWithTaskParam,
  };
}
