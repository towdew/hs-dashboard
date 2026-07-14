// IT 제품 현황(npi_product_status) 필터/집계 순수함수.
// flatRows = [{ status, colorClass, stage, row }] (row = 원본 12컬럼 레코드)
// filter = { stage, region, locale, search }

function npiPsFilterRows(flatRows, filter) {
  var f = filter || {};
  var q = (f.search || '').toLowerCase().trim();
  return (flatRows || []).filter(function (item) {
    var row = item.row || {};
    if (f.excludeLive && item.stage === 'live') return false;
    if (f.stage && item.stage !== f.stage) return false;
    if (f.region && row.region !== f.region) return false;
    if (f.locale && row.locale !== f.locale) return false;
    if (q) {
      var haystack = [row.model, row.salesModelKey, row.pttId]
        .map(function (v) { return (v || '').toLowerCase(); })
        .join(' ');
      if (haystack.indexOf(q) === -1) return false;
    }
    return true;
  });
}

function npiPsStageCounts(flatRows) {
  var counts = {};
  (flatRows || []).forEach(function (item) {
    var key = item.stage || 'etc';
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    npiPsFilterRows: npiPsFilterRows,
    npiPsStageCounts: npiPsStageCounts,
  };
}
