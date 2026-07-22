// IT 제품 현황(npi_product_status) 필터/집계 순수함수.
// flatRows = [{ status, colorClass, stage, row }] (row = 원본 12컬럼 레코드)
// filter = { stage, region, locale, search }

function npiPsFilterRows(flatRows, filter) {
  var f = filter || {};
  var q = (f.search || '').toLowerCase().trim();
  return (flatRows || []).filter(function (item) {
    var row = item.row || {};
    // Stage를 명시적으로 'live'로 고른 경우엔 라이브 제외를 적용하지 않음 (드롭다운 Live(N) 선택 시 실제 표시)
    if (f.excludeLive && f.stage !== 'live' && item.stage === 'live') return false;
    // 대분류(NPI/MOD) 필터 — category 미기재 행은 NPI로 간주 (2026-07-16)
    if (f.category && (row.category || 'NPI') !== f.category) return false;
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
