function urlLibLocaleToken(rawLocale) {
  var raw = rawLocale || '';
  var idx = raw.indexOf(' : ');
  return idx >= 0 ? raw.slice(0, idx) : raw;
}

var URL_LIB_COUNTRY_NAMES = {
  AE: 'United Arab Emirates', AE_AR: 'UAE (Arabic)', AT: 'Austria', AU: 'Australia',
  BE: 'Belgium', BE_FR: 'Belgium (French)', BG: 'Bulgaria', BR: 'Brazil',
  CA_EN: 'Canada (English)', CA_FR: 'Canada (French)', CAC: 'Central America',
  CH: 'Switzerland', CL: 'Chile', CN: 'China', CO: 'Colombia', CZ: 'Czech Republic',
  DE: 'Germany', DK: 'Denmark', EASTAFRICA: 'East Africa', AFRICA: 'Africa',
  EC: 'Ecuador', EE: 'Estonia', EG: 'Egypt', ES: 'Spain', FI: 'Finland', FR: 'France',
  GB: 'United Kingdom', UK: 'United Kingdom', GR: 'Greece', HK: 'Hong Kong',
  HR: 'Croatia', HU: 'Hungary', ID: 'Indonesia', IE: 'Ireland', IL: 'Israel',
  IN: 'India', IT: 'Italy', JP: 'Japan', KR: 'South Korea', KZ: 'Kazakhstan',
  LT: 'Lithuania', LV: 'Latvia', MX: 'Mexico', MY: 'Malaysia', NL: 'Netherlands',
  NO: 'Norway', NZ: 'New Zealand', PA: 'Panama', PE: 'Peru', PH: 'Philippines',
  PL: 'Poland', PT: 'Portugal', RO: 'Romania', RS: 'Serbia', RU: 'Russia',
  SA: 'Saudi Arabia', SE: 'Sweden', SG: 'Singapore', SK: 'Slovakia', TH: 'Thailand',
  TR: 'Turkey', TW: 'Taiwan', UA: 'Ukraine', US: 'United States', UZ: 'Uzbekistan',
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

function urlLibFilterModels(allModels, filter) {
  var q = (filter.search || '').toLowerCase().trim();
  var localeTok = filter.locale || '';
  var countRange = filter.countRange || '';
  return (allModels || []).filter(function (m) {
    // Active 모델만(기본 체크): ACTIVE 로케일이 하나도 없는 모델은 숨김 (2026-07-16 사용자 지시)
    if (filter.activeOnly && !m.locales.some(function (l) { return l.status === 'ACTIVE'; })) return false;
    if (q) {
      var nameHit = m.modelName.toLowerCase().includes(q);
      var codeHit = m.salesModelCode.toLowerCase().includes(q);
      var urlHit = (m.locales || []).some(function (l) {
        return (l.prodUrl || '').toLowerCase().indexOf(q) !== -1;
      });
      if (!nameHit && !codeHit && !urlHit) return false;
    }
    if (filter.category && m.category !== filter.category) return false;
    if (filter.status && !m.locales.some(function (l) { return l.status === filter.status; })) return false;
    if (localeTok && !m.locales.some(function (l) { return urlLibLocaleToken(l.locale) === localeTok; })) return false;
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
    urlLibFilterModels: urlLibFilterModels,
    urlLibSortModels: urlLibSortModels,
    urlLibPaginate: urlLibPaginate,
    URL_LIB_COUNTRY_NAMES: URL_LIB_COUNTRY_NAMES,
  };
}
