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
    for (var i = 0; i < matrix.length; i++) {
      var normalized = (matrix[i] || []).map(normalizeHeader);
      var hasProject = normalized.indexOf('projectname') >= 0 || normalized.indexOf('locale') >= 0 || normalized.indexOf('country') >= 0;
      var hasStatus = normalized.indexOf('taskstatusinptt') >= 0 || normalized.indexOf('status') >= 0;
      var hasPage = normalized.indexOf('pg') >= 0 || normalized.indexOf('page') >= 0;
      var hasModel = normalized.indexOf('modelname') >= 0 || normalized.indexOf('title') >= 0;
      if (hasProject && hasStatus && hasPage && hasModel) return i;
    }
    return -1;
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
    var all = [];
    workbook.SheetNames.forEach(function (sheetName) {
      var matrix = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
        header: 1,
        defval: '',
        raw: false,
        dateNF: 'yyyy-mm-dd hh:mm:ss'
      });
      var headerIndex = findHeaderRow(matrix);
      if (headerIndex < 0) return;

      var headers = uniqueHeaders(matrix[headerIndex] || []);
      var projectHeader = findHeader(headers, ['Project Name', 'Locale', 'Country', '국가']);
      var regionHeader = findHeader(headers, ['Region', '지역']);
      var statusHeader = findHeader(headers, ['Task Status in PTT', 'Status', '상태']);
      var pageHeader = findHeader(headers, ['Pg#', 'Page#', 'Pages', 'Page']);
      var modelHeader = findHeader(headers, ['Model Name', 'Title', 'Model']);
      var liveUrlHeader = findHeader(headers, ['Live URL', 'URL']);

      for (var r = headerIndex + 1; r < matrix.length; r++) {
        var sourceRow = matrix[r] || [];
        if (!sourceRow.some(function (v) { return cleanText(v) !== ''; })) continue;

        var row = {};
        headers.forEach(function (header, c) {
          row[header] = cleanText(sourceRow[c]);
        });

        var projectName = projectHeader ? row[projectHeader] : '';
        var modelName = modelHeader ? row[modelHeader] : '';
        var rawStatus = statusHeader ? row[statusHeader] : '';
        if (!projectName && !modelName && !rawStatus) continue;

        row.Region = normalizeRegion(regionHeader ? row[regionHeader] : '', projectName);
        all.push({
          sheetName: sheetName,
          headers: headers,
          row: row,
          projectName: projectName,
          modelName: modelName || sheetName,
          rawStatus: rawStatus,
          mappedStatus: normalizeStatus(rawStatus, false),
          pages: pageHeader ? toPageCount(row[pageHeader]) : 1,
          liveUrl: liveUrlHeader ? row[liveUrlHeader] : ''
        });
      }
    });
    return all;
  }

  function buildDashboardData(records) {
    var grouped = {};
    var groupOrder = [];

    records.forEach(function (record) {
      var title = cleanText(record.modelName) || 'Untitled';
      if (!grouped[title]) {
        grouped[title] = [];
        groupOrder.push(title);
      }
      grouped[title].push(record);
    });

    var data = {};
    var keys = [];

    groupOrder.forEach(function (title, index) {
      var recordsForModel = grouped[title];
      var headers = recordsForModel[0].headers.slice();
      var tableRows = [];
      var items = [];
      var stats = { Done:0, 'Corp. Review':0, 'In Progress':0, 'Pre-Review':0, Cancel:0, Total:0 };

      recordsForModel.forEach(function (record) {
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
          modelName: title
        });
        stats[record.mappedStatus] = (stats[record.mappedStatus] || 0) + record.pages;
        stats.Total += record.pages;
      });

      var key = 'es_model_' + String(index + 1).padStart(2, '0');
      data[key] = {
        key: key,
        title: title,
        displayTitle: title,
        sheetName: recordsForModel[0].sheetName,
        requestWeek: '',
        tableHeaders: headers,
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
      html += '<div class="nav-item' + (index === 0 ? ' active' : '') + '" data-key="' + key + '" onclick="switchMenu(this)" title="' + escapeHtml(d.displayTitle) + '">' +
        '<span class="ni-text" data-abbr="' + String(index + 1).padStart(2, '0') + '">' + escapeHtml(d.displayTitle) + '</span>' +
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
        var workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
        var records = readWorkbookRows(workbook);
        var result = buildDashboardData(records);

        if (!result.keys.length) {
          throw new Error('Region / Project Name / Task Status in PTT / Model Name / Pg# 형식의 데이터를 찾지 못했습니다.');
        }

        installGlobals(result.data, result.keys);
        renderNavigation(result.keys, result.data);
        return result.data;
      });
  }

  window.loadDashboardFromPublishedHtml = loadDashboardFromPublishedHtml;
})();
