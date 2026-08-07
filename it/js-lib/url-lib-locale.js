function urlLibLocaleToken(rawLocale) {
  var raw = rawLocale || '';
  var idx = raw.indexOf(' : ');
  return idx >= 0 ? raw.slice(0, idx) : raw;
}

// 로케일 토큰 → 국가명. 여기 없는 토큰은 코드가 그대로 화면에 노출되므로
// (2026-08-07 사용자 지적: "AR — AR"처럼 코드만 보이면 안 된다) 데이터에 실재하는
// 토큰은 빠짐없이 채운다. 검증: url-library.json의 고유 토큰 전수를 훑어 미매핑 0건.
// 언어 변형은 기존 관례대로 '국가명 (언어)' — 기본 로케일은 언어 표기 없이 국가명만.
var URL_LIB_COUNTRY_NAMES = {
  AE: 'United Arab Emirates', AE_AR: 'UAE (Arabic)', AR: 'Argentina', AT: 'Austria',
  AU: 'Australia', BD: 'Bangladesh',
  BE: 'Belgium', BE_FR: 'Belgium (French)', BG: 'Bulgaria', BR: 'Brazil',
  CA_EN: 'Canada (English)', CA_FR: 'Canada (French)', CAC: 'Central America',
  CH: 'Switzerland', CH_DE: 'Switzerland (German)', CH_FR: 'Switzerland (French)',
  CL: 'Chile', CN: 'China', CO: 'Colombia', CZ: 'Czech Republic',
  DE: 'Germany', DK: 'Denmark', DZ: 'Algeria', EASTAFRICA: 'East Africa', AFRICA: 'Africa',
  EC: 'Ecuador', EE: 'Estonia', EG: 'Egypt', EG_AR: 'Egypt (Arabic)', EG_EN: 'Egypt (English)',
  ES: 'Spain', FI: 'Finland', FR: 'France',
  GB: 'United Kingdom', UK: 'United Kingdom', GLOBAL: 'Global', GR: 'Greece',
  HK: 'Hong Kong', HK_EN: 'Hong Kong (English)',
  HR: 'Croatia', HU: 'Hungary', ID: 'Indonesia', IE: 'Ireland', IL: 'Israel',
  IN: 'India', IR: 'Iran', IT: 'Italy', JP: 'Japan', KR: 'South Korea',
  KZ: 'Kazakhstan', KZ_KZ: 'Kazakhstan (Kazakh)',
  LEVANT_AR: 'Levant (Arabic)', LEVANT_EN: 'Levant (English)', LK: 'Sri Lanka',
  LT: 'Lithuania', LV: 'Latvia', MX: 'Mexico', MY: 'Malaysia', NL: 'Netherlands',
  NO: 'Norway', NP: 'Nepal', NZ: 'New Zealand', PA: 'Panama', PE: 'Peru', PH: 'Philippines',
  PL: 'Poland', PT: 'Portugal', RO: 'Romania', RS: 'Serbia', RU: 'Russia',
  SA: 'Saudi Arabia', SA_EN: 'Saudi Arabia (English)', SE: 'Sweden', SG: 'Singapore',
  SK: 'Slovakia', TH: 'Thailand', TN: 'Tunisia',
  TR: 'Turkey', TW: 'Taiwan', UA: 'Ukraine', US: 'United States',
  UZ: 'Uzbekistan', UZ_RU: 'Uzbekistan (Russian)',
  VN: 'Vietnam', ZA: 'South Africa',
};

function urlLibCountryName(token) {
  var key = (token || '').toUpperCase().replace(/-/g, '_');
  return URL_LIB_COUNTRY_NAMES[key] || token;
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
  var countRange = filter.countRange || '';
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
    if (countRange) {
      var n = urlLibCountryCount(m); // '개국' 필터는 국가 수 기준(사이트 수 아님)
      if (countRange === '1' && n !== 1) return false;
      if (countRange === '2-9' && (n < 2 || n > 9)) return false;
      if (countRange === '10+' && n < 10) return false;
    }
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    urlLibLocaleToken: urlLibLocaleToken,
    urlLibCountryName: urlLibCountryName,
    urlLibLocaleMatchesQuery: urlLibLocaleMatchesQuery,
    buildUrlLibLocaleIndex: buildUrlLibLocaleIndex,
    urlLibDisplayUrl: urlLibDisplayUrl,
    urlLibCountryCount: urlLibCountryCount,
    urlLibMatchedLocales: urlLibMatchedLocales,
    urlLibFilterModels: urlLibFilterModels,
    urlLibSortModels: urlLibSortModels,
    urlLibPaginate: urlLibPaginate,
    URL_LIB_COUNTRY_NAMES: URL_LIB_COUNTRY_NAMES,
  };
}
