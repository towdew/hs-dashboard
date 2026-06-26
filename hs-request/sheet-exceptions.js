// Temporary sheet-specific exceptions.
// Delete this file and remove its <script> tag when these exception sheets are fully completed.
(function () {
  'use strict';

  var EXCEPTION_CATEGORY = 'Category Page / Buying Guide / Installation Guide';
  var EXCEPTION_ARTICLE = 'LG Experience Articles';

  function normalizeTitle(value) {
    return String(value || '')
      .replace(/&amp;/g, '&')
      .replace(/[\u00A0\s]+/g, ' ')
      .replace(/\s*\/\s*/g, ' / ')
      .trim()
      .toLowerCase();
  }

  function compactTitle(value) {
    return normalizeTitle(value).replace(/[^a-z0-9가-힣]+/g, '');
  }

  function getSheetTitle(sheet) {
    return String(sheet && (
      sheet.displayTitle ||
      sheet.sheetTitle ||
      sheet.title ||
      sheet.sheetTabName ||
      sheet.name ||
      ''
    ) || '').trim();
  }

  function isCategorySheet(sheet) {
    var title = compactTitle(getSheetTitle(sheet));
    var target = compactTitle(EXCEPTION_CATEGORY);
    return title === target ||
      (title.indexOf('categorypage') >= 0 && title.indexOf('buyingguide') >= 0) ||
      (title.indexOf('buyingguide') >= 0 && title.indexOf('installationguide') >= 0);
  }

  function isArticleSheet(sheet) {
    var title = compactTitle(getSheetTitle(sheet));
    var target = compactTitle(EXCEPTION_ARTICLE);
    return title === target ||
      title.indexOf('lgexperiencearticles') >= 0 ||
      (title.indexOf('experience') >= 0 && title.indexOf('article') >= 0);
  }

  function isExceptionSheet(sheet) {
    return isCategorySheet(sheet) || isArticleSheet(sheet);
  }

  function normalizeHeader(value) {
    return String(value || '').toLowerCase().replace(/[\s_\-/.]+/g, '');
  }

  function isUrl(value) {
    return /^https?:\/\//i.test(String(value || '').trim());
  }

  function isDamHeader(header) {
    var h = normalizeHeader(header);
    return h === 'dam' || h.indexOf('dampath') >= 0 || h.indexOf('damurl') >= 0 || h.indexOf('damlink') >= 0;
  }

  function isTitleHeader(header) {
    var h = normalizeHeader(header);
    return h === 'title' || h === 'articletitle' || h === 'cmrarticle' || h === 'cmrtitle';
  }

  function isUrlHeader(header) {
    var h = normalizeHeader(header);
    return h === 'url' || h === 'pageurl' || h === 'liveurl' || h === 'link' || h.indexOf('url') >= 0;
  }

  function esc(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getDonePill(url) {
    var cfg = (window.SC && window.SC.Done) || { bg: '#ECFDF5', tc: '#047857', dot: '#10B981', label: '완료' };
    return '<a class="sheet-status-pill sheet-status-pill-link" ' +
      'href="' + esc(url) + '" target="_blank" rel="noopener" ' +
      'style="background:' + esc(cfg.bg) + ';color:' + esc(cfg.tc) + ';text-decoration:none" title="Open URL">' +
      '<span style="background:' + esc(cfg.dot) + '"></span>' + esc(cfg.label || '완료') +
      '</a>';
  }

  function getDamButton(value) {
    var text = String(value || '').trim();
    if (!text) return '<span class="sheet-empty">—</span>';
    return '<div class="sheet-dam-actions">' +
      '<button type="button" class="sheet-dam-icon-btn" data-value="' + esc(text) + '" onclick="copySheetExceptionValue(this)" title="Copy DAM path">' +
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>' +
      '</button></div>';
  }

  window.copySheetExceptionValue = function (el) {
    var text = el && el.getAttribute ? el.getAttribute('data-value') : String(el || '');
    if (typeof copyToClipboard === 'function') copyToClipboard(text);
    else if (navigator.clipboard) navigator.clipboard.writeText(text);
    if (typeof showToast === 'function') showToast('복사되었습니다.');
  };

  function replaceRenderedUrlLinks(area, sheet) {
    if (!area || !isExceptionSheet(sheet)) return;
    var links = area.querySelectorAll('a.sheet-link[href]');
    links.forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (!isUrl(href)) return;
      var wrap = document.createElement('span');
      wrap.innerHTML = getDonePill(href);
      var pill = wrap.firstElementChild;
      if (pill) a.replaceWith(pill);
    });
  }


  function isUkHeader(value) {
    var h = normalizeHeader(value);
    return h === 'uk' || h === 'uken' || h === 'ukenus' || /^uk[a-z]{0,3}$/.test(h);
  }

  function isLvHeader(value) {
    var h = normalizeHeader(value);
    return h === 'lv' || h === 'lven' || h === 'lvru' || h === 'lvlv' || /^lv[a-z]{0,3}$/.test(h);
  }

  function getCellText(cell) {
    if (cell == null) return '';
    if (typeof cell === 'object') return String(cell.text || cell.label || cell.value || '').trim();
    return String(cell || '').trim();
  }

  function getRowSiteCountFromUkToLv(row) {
    row = Array.isArray(row) ? row : [];
    if (!row.length) return null;

    // 요청 기준: LG Experience Articles는 4열(0-based 3)의 UK부터 LV까지가 국가 컬럼입니다.
    // 다만 XLSX 헤더 병합/보정으로 앞 열이 달라질 수 있어 UK를 먼저 찾고, 못 찾으면 4열부터 시작합니다.
    var start = -1;
    for (var i = 0; i < row.length; i++) {
      if (isUkHeader(getCellText(row[i]))) { start = i; break; }
    }
    if (start < 0 && row.length > 3 && isUkHeader(getCellText(row[3]))) start = 3;
    if (start < 0) return null;

    var end = -1;
    for (var j = start; j < row.length; j++) {
      if (isLvHeader(getCellText(row[j]))) end = j;
    }
    if (end < start) return null;

    // 빈칸/병합 보정 때문에 일부 셀이 비어도 실제 열 수 기준으로 계산합니다.
    return Math.max(0, end - start + 1);
  }

  function expandDisplayHeaderRow(row) {
    var out = [];
    (row || []).forEach(function(cell) {
      var text = getCellText(cell);
      var colspan = 1;
      if (cell && typeof cell === 'object' && cell.colspan) colspan = Math.max(1, Number(cell.colspan) || 1);
      for (var i = 0; i < colspan; i++) out.push(text);
    });
    return out;
  }

  function getArticleHeaderSiteCount(sheet) {
    if (!isArticleSheet(sheet)) return null;

    var candidates = [];
    if (sheet && Array.isArray(sheet.headerRows)) {
      sheet.headerRows.forEach(function(row) { candidates.push(row); });
    }
    if (sheet && Array.isArray(sheet.tableHeaderRows)) {
      sheet.tableHeaderRows.forEach(function(row) { candidates.push(expandDisplayHeaderRow(row)); });
    }
    if (sheet && Array.isArray(sheet.tableHeaders)) {
      candidates.push(sheet.tableHeaders);
    }

    for (var r = 0; r < candidates.length; r++) {
      var count = getRowSiteCountFromUkToLv(candidates[r]);
      if (count != null) return count;
    }

    return 0;
  }


  function postNormalizeCountryLocaleLabels(area) {
    if (!area || typeof window.displayCountryFullName !== 'function') return;
    var nodes = area.querySelectorAll('th.sheet-country-col, td.sheet-country-col, th');
    nodes.forEach(function(node) {
      if (!node || node.children.length) return;
      var raw = String(node.textContent || '').trim();
      if (!raw) return;
      // 변환 대상: SA_ar, EG-en, Saudi Arabia-ar, Egypt_en, Levant-en 등 locale suffix가 있는 값
      if (!/^.+[-_]\s*[A-Za-z]{2}\s*$/i.test(raw)) return;
      var converted = window.displayCountryFullName(raw);
      if (converted && converted !== raw) node.textContent = converted;
      if (node.tagName === 'TH') node.classList.add('sheet-country-col');
    });
  }

  window.SHEET_EXCEPTION_RULES = {
    isExceptionSheet: isExceptionSheet,
    isCategorySheet: isCategorySheet,
    isArticleSheet: isArticleSheet,
    isUrlHeader: isUrlHeader,
    isDamHeader: isDamHeader,
    getSiteCount: getArticleHeaderSiteCount,
    skipCountryLocaleDisplay: function (sheet) { return isArticleSheet(sheet); },
    renderDonePill: getDonePill,

    shouldDisableRegionColumn: function (sheet) {
      return isArticleSheet(sheet);
    },

    getCellClass: function (ctx) {
      var sheet = ctx && ctx.sheet;
      var header = ctx && ctx.header;
      if (isArticleSheet(sheet) && isTitleHeader(header)) return 'sheet-title-wide-col';
      if (isArticleSheet(sheet) && isDamHeader(header)) return 'sheet-dam-col';
      return '';
    },

    renderCell: function (ctx) {
      var sheet = ctx && ctx.sheet;
      var header = ctx && ctx.header;
      var text = String((ctx && ctx.value) || '').trim();

      if (!isExceptionSheet(sheet)) return null;

      // 예외시트 2: LG Experience Articles의 DAM 컬럼은 복사 버튼만 표시합니다.
      // Open/new-window 버튼은 만들지 않습니다.
      if (isArticleSheet(sheet) && isDamHeader(header)) {
        return getDamButton(text);
      }

      // 예외시트 1, 2에서 URL 값은 raw URL 링크가 아니라 완료 pill 링크로 표시합니다.
      if (text && isUrl(text) && isUrlHeader(header)) {
        return getDonePill(text);
      }

      return null;
    },

    // 안전장치: 기존 렌더러가 URL을 먼저 <a class="sheet-link">로 만든 경우에도
    // 예외시트에서만 완료 pill 링크로 후처리합니다.
    afterRender: function (ctx) {
      replaceRenderedUrlLinks(ctx && ctx.area, ctx && ctx.sheet);
      if (!isArticleSheet(ctx && ctx.sheet)) {
        postNormalizeCountryLocaleLabels(ctx && ctx.area);
      }
    }
  };
})();
