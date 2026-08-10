// 상단바 통합 검색 — GR 태스크 / IT 제품 현황 / URL Library를 한 번에 훑는다.
// 세 화면이 각자 검색을 갖고 있지만 "이 모델이 어디에 있나"를 알려면 탭을 옮겨 다녀야 했다.
// DOM 접근 없는 순수 함수라 node:test로 검증한다(js-lib 관례).

var DASH_SEARCH_MIN_LEN = 2;      // 1글자는 결과가 수천 건이라 의미가 없다
var DASH_SEARCH_GROUP_LIMIT = 5;  // 그룹별 표시 개수(전체 건수는 별도로 알려준다)

function dashSearchNorm(v) {
  return String(v == null ? '' : v).toLowerCase().trim();
}

// 여러 필드 중 하나라도 부분일치하면 true
function dashSearchHit(fields, q) {
  for (var i = 0; i < fields.length; i++) {
    if (dashSearchNorm(fields[i]).indexOf(q) !== -1) return true;
  }
  return false;
}

/**
 * @param {string} query 사용자 입력
 * @param {object} sources
 *   - grTasks:   [{ key, title }]                      사이드바 GR 시트
 *   - products:  [{ model, locale, salesModelKey, pttId, stage, status }]  IT 제품 현황 행
 *   - urlModels: [{ modelName, salesModelCode, category, locales:[{prodUrl}] }]
 * @param {number} [limit] 그룹별 최대 표시 수
 * @returns {{gr:Array, products:Array, urls:Array, counts:object, total:number, tooShort:boolean}}
 */
function dashGlobalSearch(query, sources, limit) {
  var q = dashSearchNorm(query);
  var cap = limit || DASH_SEARCH_GROUP_LIMIT;
  var empty = { gr: [], products: [], urls: [], counts: { gr: 0, products: 0, urls: 0 }, total: 0, tooShort: q.length < DASH_SEARCH_MIN_LEN };
  if (q.length < DASH_SEARCH_MIN_LEN) return empty;

  var s = sources || {};
  var grAll = (s.grTasks || []).filter(function (t) {
    return dashSearchHit([t.title, t.key], q);
  });
  var prodAll = (s.products || []).filter(function (p) {
    return dashSearchHit([p.model, p.locale, p.salesModelKey], q);
  });
  // URL은 건수가 많아(2만+) 모델 단위로만 집계한다 — 개별 URL까지 나열하면 드롭다운이 무너진다
  var urlAll = (s.urlModels || []).filter(function (m) {
    if (dashSearchHit([m.modelName, m.salesModelCode], q)) return true;
    var locs = m.locales || [];
    for (var i = 0; i < locs.length; i++) {
      if (dashSearchNorm(locs[i].prodUrl).indexOf(q) !== -1) return true;
    }
    return false;
  });

  return {
    gr: grAll.slice(0, cap),
    products: prodAll.slice(0, cap),
    urls: urlAll.slice(0, cap),
    counts: { gr: grAll.length, products: prodAll.length, urls: urlAll.length },
    total: grAll.length + prodAll.length + urlAll.length,
    tooShort: false,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    dashGlobalSearch: dashGlobalSearch,
    dashSearchNorm: dashSearchNorm,
    dashSearchHit: dashSearchHit,
    DASH_SEARCH_MIN_LEN: DASH_SEARCH_MIN_LEN,
    DASH_SEARCH_GROUP_LIMIT: DASH_SEARCH_GROUP_LIMIT,
  };
}
