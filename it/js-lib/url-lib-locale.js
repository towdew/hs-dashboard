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

function urlLibFilterModels(allModels, filter) {
  var q = (filter.search || '').toLowerCase().trim();
  return (allModels || []).filter(function (m) {
    if (q && !m.modelName.toLowerCase().includes(q) && !m.salesModelCode.toLowerCase().includes(q)) return false;
    if (filter.category && m.category !== filter.category) return false;
    if (filter.status && !m.locales.some(function (l) { return l.status === filter.status; })) return false;
    return true;
  });
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
    urlLibFilterModels: urlLibFilterModels,
    urlLibPaginate: urlLibPaginate,
    URL_LIB_COUNTRY_NAMES: URL_LIB_COUNTRY_NAMES,
  };
}
