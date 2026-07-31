(function () {
  'use strict';

  var ES_WORKBOOK_FILE = './es-global-request.xlsx';

  var STATUS_CONFIG = {
    'Pre-Review':   { label:'사전검토', dot:'#94A3B8', bg:'#F1F5F9', tc:'#64748B' },
    'In Progress':  { label:'작업중',   dot:'#3B82F6', bg:'#EFF6FF', tc:'#1D4ED8' },
    'Corp. Review': { label:'법인리뷰', dot:'#F59E0B', bg:'#FFFBEB', tc:'#B45309' },
    'Done':         { label:'완료',     dot:'#10B981', bg:'#ECFDF5', tc:'#047857' },
    'Cancel':       { label:'취소',     dot:'#EF4444', bg:'#FEF2F2', tc:'#B91C1C' }
  };

  var REGION_ORDER_LIST = ['EU', 'ASIA', 'CIS', 'LATAM', 'MEA', 'INDIA', 'NA', 'ETC'];
  var REGION_COLORS = {
    EU:    { label:'EU',    bg:'#EEF2FF', tc:'#4338CA', border:'#C7D2FE' },
    ASIA:  { label:'ASIA',  bg:'#ECFEFF', tc:'#0E7490', border:'#A5F3FC' },
    CIS:   { label:'CIS',   bg:'#F5F3FF', tc:'#6D28D9', border:'#DDD6FE' },
    LATAM: { label:'LATAM', bg:'#FFF7ED', tc:'#C2410C', border:'#FED7AA' },
    MEA:   { label:'MEA',   bg:'#F0FDF4', tc:'#15803D', border:'#BBF7D0' },
    INDIA: { label:'INDIA', bg:'#FFF1F2', tc:'#BE123C', border:'#FECDD3' },
    NA:    { label:'NA',    bg:'#EFF6FF', tc:'#1D4ED8', border:'#BFDBFE' },
    ETC:   { label:'ETC',   bg:'#F8FAFC', tc:'#64748B', border:'#E2E8F0' }
  };

  var REGION_COUNTRIES = {
    EU: 'AT BE BG CH CY CZ DE DK EE ES FI FR GB UK GR HR HU IE IT LT LV NL NO PL PT RO RS SE SI SK TR UA'.split(' '),
    CIS: ['KZ'],
    ASIA: 'AU BD CN HK ID JP KR LK MY MM NZ PH SG TH TW VN PK KH NP'.split(' '),
    INDIA: ['IN'],
    NA: ['US', 'CA'],
    LATAM: 'AR BO BR CL CO CR DO EC GT HN MX NI PA PE PR PY SV UY VE CAC'.split(' '),
    MEA: 'AE AF AO BH DZ EG GH IL IR IQ JO KE KW LB MA NG OM QA SA TN TZ ZA AFRICA LEVANT'.split(' ')
  };

  function cleanText(value) {
    return String(value == null ? '' : value).replace(/\u00a0/g, ' ').trim();
  }

  // SheetJS는 General 형식의 숫자 5.0을 표시 문자열 5로 정리합니다.
  // Type 컬럼은 본부 구분값이므로 정수 숫자도 소수점 한 자리(5.0)로 유지합니다.
  function getCellDisplayValue(worksheet, rowIndex, colIndex, header, fallbackValue) {
    var address = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
    var cell = worksheet && worksheet[address];
    var value = fallbackValue;

    if (cell) {
      if (cell.w != null && cell.w !== '') value = cell.w;
      else if (cell.v != null) value = cell.v;
    }

    if (normalizeHeader(header) === 'type' && cell && cell.t === 'n') {
      var numberValue = Number(cell.v);
      if (!isNaN(numberValue)) {
        return Number.isInteger(numberValue) ? numberValue.toFixed(1) : String(numberValue);
      }
    }

    return cleanText(value);
  }

  function normalizeRgbColor(value) {
    var rgb = String(value == null ? '' : value).replace(/^#/, '').toUpperCase();
    if (/^[0-9A-F]{8}$/.test(rgb)) rgb = rgb.slice(2);
    return /^[0-9A-F]{6}$/.test(rgb) ? ('#' + rgb) : '';
  }

  // Excel의 solid fill 색상을 테이블 셀 배경색으로 전달합니다.
  function getCellFillColor(worksheet, rowIndex, colIndex) {
    var address = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
    var cell = worksheet && worksheet[address];
    var style = cell && cell.s;
    if (!style) return '';

    var patternType = String(style.patternType || (style.fill && style.fill.patternType) || '').toLowerCase();
    if (patternType && patternType !== 'solid') return '';

    var fg = style.fgColor || (style.fill && style.fill.fgColor) || {};
    var bg = style.bgColor || (style.fill && style.fill.bgColor) || {};
    return normalizeRgbColor(fg.rgb || bg.rgb || '');
  }

  function normalizeHeader(value) {
    return cleanText(value).toLowerCase().replace(/[\s_\-/.#]+/g, '');
  }

  function uniqueHeaders(row) {
    var used = {};
    return (row || []).map(function (value, index) {
      var base = cleanText(value) || ('Column ' + (index + 1));
      var key = base;
      var n = 2;
      while (used[key]) key = base + ' (' + (n++) + ')';
      used[key] = true;
      return key;
    });
  }

  function findHeaderRow(matrix) {
    var fallback = -1;

    for (var i = 0; i < matrix.length; i++) {
      var normalized = (matrix[i] || []).map(normalizeHeader);
      var nonEmptyCount = normalized.filter(function (value) { return !!value; }).length;
      var hasProject = normalized.indexOf('projectname') >= 0 ||
        normalized.indexOf('locale') >= 0 ||
        normalized.indexOf('country') >= 0 ||
        normalized.indexOf('국가') >= 0;
      var hasStatus = normalized.indexOf('taskstatusinptt') >= 0 ||
        normalized.indexOf('status') >= 0 ||
        normalized.indexOf('상태') >= 0;
      var hasPage = normalized.indexOf('pg') >= 0 ||
        normalized.indexOf('page') >= 0 ||
        normalized.indexOf('pages') >= 0;
      var hasUrl = normalized.indexOf('liveurl') >= 0 || normalized.indexOf('url') >= 0;

      // 본부별로 Title / Model Name / Sales Model Code 등의 컬럼 구성이 달라도
      // Country + Status를 공통 기준으로 헤더를 찾습니다.
      if (hasProject && hasStatus && nonEmptyCount >= 4) {
        if (hasPage || hasUrl) return i;
        if (fallback < 0) fallback = i;
      }
    }

    return fallback;
  }

  function findHeader(headers, candidates) {
    for (var i = 0; i < headers.length; i++) {
      var current = normalizeHeader(headers[i]);
      for (var j = 0; j < candidates.length; j++) {
        if (current === normalizeHeader(candidates[j])) return headers[i];
      }
    }
    return '';
  }

  function normalizeCountryKey(value) {
    var raw = cleanText(value);
    if (!raw) return '';
    if (raw.indexOf(':') >= 0) raw = raw.split(':')[0].trim();
    raw = raw.replace(/\s*\(OPR\)\s*$/i, '');
    raw = raw.replace(/^(LGE|LG)\s+[A-Z0-9.]+\s*-\s*/i, '');
    raw = raw.replace(/\s*\([^)]*\)\s*$/i, '');
    var match = raw.match(/^(.+?)[-_]([a-z]{2})$/i);
    if (match) raw = match[1];
    raw = raw.replace(/[^A-Za-z]/g, '').toUpperCase();
    return raw;
  }

  function normalizeRegion(value, countryValue) {
    var raw = cleanText(value).toUpperCase().replace(/[._-]+/g, ' ').replace(/\s+/g, ' ');
    if (['EU', 'EUROPE', 'EUR'].indexOf(raw) >= 0) return 'EU';
    if (['ASIA', 'APAC', 'SEA', 'AP'].indexOf(raw) >= 0) return 'ASIA';
    if (['CIS'].indexOf(raw) >= 0) return 'CIS';
    if (['LATAM', 'LATIN AMERICA', 'LAC', 'SOUTH AMERICA'].indexOf(raw) >= 0) return 'LATAM';
    if (['MEA', 'MIDDLE EAST', 'AFRICA', 'MIDDLE EAST AFRICA', 'LEVANT'].indexOf(raw) >= 0) return 'MEA';
    if (['INDIA', 'IN'].indexOf(raw) >= 0) return 'INDIA';
    if (['NA', 'NORTH AMERICA', 'NAC'].indexOf(raw) >= 0) return 'NA';
    return inferRegionFromCountry(countryValue);
  }

  function inferRegionFromCountry(value) {
    var key = normalizeCountryKey(value);
    var regions = Object.keys(REGION_COUNTRIES);
    for (var i = 0; i < regions.length; i++) {
      if (REGION_COUNTRIES[regions[i]].indexOf(key) >= 0) return regions[i];
    }
    return 'ETC';
  }

  function normalizeStatus(value, emptyIfUnknown) {
    var raw = cleanText(value)
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .toLowerCase();
    if (!raw) return emptyIfUnknown ? '' : 'Pre-Review';

    if (/cancelled|canceled|\bcancel\b|취소/.test(raw)) return 'Cancel';
    if (/\bclosed\b|completed|complete|\bdone\b|등록완료|완료/.test(raw)) return 'Done';
    if (/client\s*review|corp\.?\s*review|법인\s*리뷰/.test(raw)) return 'Corp. Review';

    if (/\[wpl\]\s*new\s*request/.test(raw) || /pre[\s-]*review|사전\s*검토/.test(raw)) return 'Pre-Review';
    if (/request\s*clarification|요건\s*정리/.test(raw)) return 'In Progress';
    if (/\[wb\]\s*new\s*request|create\s*request|wpl\s*review|qa\s*review|publishing|in\s*progress|\bwip\b|working|작업\s*중|진행\s*중/.test(raw)) return 'In Progress';

    return emptyIfUnknown ? '' : 'Pre-Review';
  }

  function toPageCount(value) {
    var match = cleanText(value).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
    var number = Number(match ? match[0] : '');
    return isNaN(number) ? 0 : number;
  }

  function readWorkbookRows(workbook) {
    var sheets = [];

    workbook.SheetNames.forEach(function (sheetName) {
      var worksheet = workbook.Sheets[sheetName];
      var matrix = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        raw: false,
        dateNF: 'yyyy-mm-dd hh:mm:ss'
      });
      var headerIndex = findHeaderRow(matrix);
      if (headerIndex < 0) return;

      var headers = uniqueHeaders(matrix[headerIndex] || []);
      var headerStyles = {};
      headers.forEach(function (header, c) {
        var headerBg = getCellFillColor(worksheet, headerIndex, c);
        if (headerBg) headerStyles[header] = headerBg;
      });
      var projectHeader = findHeader(headers, ['Project Name', 'Locale', 'Country', '국가']);
      var regionHeader = findHeader(headers, ['Region', '지역']);
      var statusHeader = findHeader(headers, ['Task Status in PTT', 'Status', '상태']);
      var pageHeader = findHeader(headers, ['Pg#', 'Page#', 'Pages', 'Page']);
      var modelHeader = findHeader(headers, [
        'Model Name', 'Title', 'Model', 'Sales Model Code', 'Model Code',
        'Product', 'Contents', 'Content'
      ]);
      var liveUrlHeader = findHeader(headers, ['Live URL', 'URL']);

      var metaCells = {
        B1: cleanText(matrix[0] && matrix[0][1]),
        B2: cleanText(matrix[1] && matrix[1][1]),
        B3: cleanText(matrix[2] && matrix[2][1]),
        B4: cleanText(matrix[3] && matrix[3][1])
      };
      var records = [];

      for (var r = headerIndex + 1; r < matrix.length; r++) {
        var sourceRow = matrix[r] || [];
        if (!sourceRow.some(function (v) { return cleanText(v) !== ''; })) continue;

        var row = {};
        var rowStyles = {};
        headers.forEach(function (header, c) {
          row[header] = getCellDisplayValue(worksheet, r, c, header, sourceRow[c]);
          var bg = getCellFillColor(worksheet, r, c);
          if (bg) rowStyles[header] = bg;
        });
        if (Object.keys(rowStyles).length) row.__styles = rowStyles;

        var projectName = projectHeader ? row[projectHeader] : '';
        var modelName = modelHeader ? row[modelHeader] : '';
        var rawStatus = statusHeader ? row[statusHeader] : '';

        // 시트별 표는 원본 행을 그대로 유지합니다.
        // Country/Status가 비어 있는 보조 행도 실제 데이터가 있으면 표에서 제외하지 않습니다.
        row.Region = normalizeRegion(regionHeader ? row[regionHeader] : '', projectName);
        records.push({
          sheetName: sheetName,
          headers: headers,
          row: row,
          projectName: projectName,
          modelName: modelName,
          rawStatus: rawStatus,
          mappedStatus: normalizeStatus(rawStatus, false),
          pages: pageHeader ? toPageCount(row[pageHeader]) : 1,
          liveUrl: liveUrlHeader ? row[liveUrlHeader] : ''
        });
      }

      if (!records.length) return;

      sheets.push({
        sheetName: sheetName,
        headers: headers,
        records: records,
        headerIndex: headerIndex,
        metaCells: metaCells,
        headerStyles: headerStyles,
        displayTitle: metaCells.B1 || sheetName,
        weeklyUpdateText: metaCells.B2,
        dam: metaCells.B3,
        requestWeek: metaCells.B4
      });
    });

    return sheets;
  }

  function buildDashboardData(sheets) {
    var data = {};
    var keys = [];

    (sheets || []).forEach(function (sheetInfo, index) {
      var records = sheetInfo.records || [];
      var headers = (sheetInfo.headers || []).slice();
      var tableRows = [];
      var items = [];
      var stats = { Done:0, 'Corp. Review':0, 'In Progress':0, 'Pre-Review':0, Cancel:0, Total:0 };

      records.forEach(function (record) {
        tableRows.push(record.row);
        items.push({
          locale: record.projectName,
          country: record.projectName,
          region: record.row.Region,
          status: record.mappedStatus,
          overall: record.mappedStatus,
          pages: record.pages,
          url: record.liveUrl,
          rawStatus: record.rawStatus,
          modelName: cleanText(record.modelName) || sheetInfo.displayTitle || sheetInfo.sheetName
        });
        stats[record.mappedStatus] = (stats[record.mappedStatus] || 0) + record.pages;
        stats.Total += record.pages;
      });

      var key = 'es_sheet_' + String(index + 1).padStart(2, '0');
      data[key] = {
        key: key,
        title: sheetInfo.displayTitle || sheetInfo.sheetName,
        displayTitle: sheetInfo.displayTitle || sheetInfo.sheetName,
        navTitle: sheetInfo.sheetName,
        sheetName: sheetInfo.sheetName,
        requestWeek: sheetInfo.requestWeek || '',
        requestWeekB4: sheetInfo.requestWeek || '',
        weeklyUpdateB2: sheetInfo.weeklyUpdateText || '',
        weeklyUpdateText: sheetInfo.weeklyUpdateText || '',
        dam: sheetInfo.dam || '',
        metaCells: sheetInfo.metaCells || {},
        tableHeaders: headers,
        tableHeaderStyles: sheetInfo.headerStyles || {},
        tableRows: tableRows,
        items: items,
        stats: stats,
        regions: REGION_ORDER_LIST.filter(function (region) {
          return tableRows.some(function (row) { return row.Region === region; });
        })
      };
      keys.push(key);
    });

    return { data: data, keys: keys };
  }

  function escapeHtml(value) {
    return cleanText(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderNavigation(keys, data) {
    var nav = document.getElementById('sheetNavList');
    if (!nav) return;
    var html = '<div class="sb-section-label">Contents</div>';
    keys.forEach(function (key, index) {
      var d = data[key];
      var navTitle = d.navTitle || d.sheetName || d.displayTitle;
      html += '<div class="nav-item' + (index === 0 ? ' active' : '') + '" data-key="' + key + '" onclick="switchMenu(this)" title="' + escapeHtml(navTitle) + '">' +
        '<span class="ni-text" data-abbr="' + String(index + 1).padStart(2, '0') + '">' + escapeHtml(navTitle) + '</span>' +
        '<span class="ni-badge" style="background:rgba(148,163,184,.2);color:#94A3B8">0%</span>' +
      '</div>';
    });
    nav.innerHTML = html;
  }

  function installGlobals(data, keys) {
    window.DATA = data;
    window.__DASHBOARD_KEYS = keys;
    window.__SHEET_DRIVEN_NAV = true;
    window.__SHEET_SOURCE_MAP = {};
    window.SHEET_EXCEPTION_RULES = null;

    window.SC = STATUS_CONFIG;
    window.REGION_CFG = REGION_COLORS;
    window.REGION_ORDER = REGION_ORDER_LIST;
    window.LOCALE_MAP = {};
    window.COL_FULL = {};
    window.ART_ABBR = {};
    window.STALLED_DAYS = {};
    window.REPORT_KEYS = keys.slice();

    window.BG_WEEKS = {};
    window.ARTICLE_WEEKS = {};
    window.ICE_WEEKS = {};
    window.MICROSITE_WEEKS = {};
    window.WASHTOWER_WEEKS = {};
    window.ALTTEXT_WEEKS = {};
    window.FAQ_WEEKS = {};
    window.PDP_WEEKS = {};
    window.VACUUM_WEEKS = {};
    window.WMO_FAQ_WEEKS = {};
    window.NEW_CONTENT_WEEKS = {};

    window.normalizeStatus = normalizeStatus;
    window.inferRegionFromCountry = inferRegionFromCountry;
  }

  function loadDashboardFromPublishedHtml() {
    if (typeof XLSX === 'undefined') {
      return Promise.reject(new Error('XLSX 라이브러리를 불러오지 못했습니다.'));
    }

    return fetch(ES_WORKBOOK_FILE, { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) throw new Error(ES_WORKBOOK_FILE + ' 파일을 찾을 수 없습니다.');
        return response.arrayBuffer();
      })
      .then(function (buffer) {
        var workbook = XLSX.read(buffer, { type: 'array', cellDates: true, cellStyles: true });
        var sheets = readWorkbookRows(workbook);
        var result = buildDashboardData(sheets);

        if (!result.keys.length) {
          throw new Error('Country / Status 기준의 시트 데이터를 찾지 못했습니다.');
        }

        installGlobals(result.data, result.keys);
        renderNavigation(result.keys, result.data);
        return result.data;
      });
  }

  window.loadDashboardFromPublishedHtml = loadDashboardFromPublishedHtml;
})();
