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
      // PTT ID는 검색 대상에서 제외 (2026-08-07 사용자 지시) — 화면 컬럼에도 없고
      // 엑셀 다운로드에만 포함되는 값이라 검색어와 우연히 겹치면 혼란만 준다.
      var haystack = [row.model, row.salesModelKey]
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

function npiPsEscapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function npiPsSelectA11y(label) {
  return ' aria-label="' + npiPsEscapeHtml(label) + '"';
}

function npiPsStageChipMarkup(stage, label, count, color, active, background, textColor) {
  var styles = ['--npi-stage-color:' + npiPsEscapeHtml(color)];
  if (background) styles.push('background:' + npiPsEscapeHtml(background));
  if (textColor) styles.push('color:' + npiPsEscapeHtml(textColor));
  return '<button type="button" class="npi-ps-stage-chip' + (active ? ' npi-ps-stage-chip-active' : '') +
    '" data-stage="' + npiPsEscapeHtml(stage) + '" aria-pressed="' + (active ? 'true' : 'false') +
    '" style="' + styles.join(';') +
    '" onclick="npiPsToggleStageChip(this.getAttribute(\'data-stage\'))">' +
    npiPsEscapeHtml(label) + ' <span>' + npiPsEscapeHtml(count == null ? 0 : count) + '</span></button>';
}

function npiPsEmptyStateMarkup(message) {
  return '<div class="npi-ps-empty" role="status"><p>' + npiPsEscapeHtml(message) +
    '</p><button type="button" class="url-lib-page-btn" onclick="npiPsResetFilter()">필터 초기화</button></div>';
}

function npiPsDialogA11y(labelledBy) {
  return ' role="dialog" aria-modal="true" aria-labelledby="' +
    npiPsEscapeHtml(labelledBy) + '"';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    npiPsFilterRows: npiPsFilterRows,
    npiPsStageCounts: npiPsStageCounts,
    npiPsSelectA11y: npiPsSelectA11y,
    npiPsStageChipMarkup: npiPsStageChipMarkup,
    npiPsEmptyStateMarkup: npiPsEmptyStateMarkup,
    npiPsDialogA11y: npiPsDialogA11y,
  };
}
