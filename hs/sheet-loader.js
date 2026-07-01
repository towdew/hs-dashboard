// Google Sheet loader - Published XLSX + Head marker based table extraction
// - 사용자는 published xlsx URL을 관리합니다.
// - 전체 workbook(xlsx)을 읽어 모든 시트를 가져오며, 화면 시트명은 각 시트의 B1 값을 사용합니다.
// - A열에 "Head"라고 적힌 행을 헤더 행으로 사용하고, A열 Head 표시는 테이블에 표시하지 않습니다.

// Local workbook mode: the dashboard no longer loads data from Google Sheets.
// Put this file in the same folder as index.html on GitHub Pages / local server.
const LOCAL_DASHBOARD_XLSX_FILE = 'Global Request.xlsx';
const DEFAULT_XLSX_URL = getLocalWorkbookUrl(LOCAL_DASHBOARD_XLSX_FILE);
const DEFAULT_PUBLISHED_HTML_URL = '';
const DEFAULT_PUBLISHED_BASE_URL = '';
const DEFAULT_CSV_URL = '';

function getLocalWorkbookUrl(fileName) {
  try {
    return new URL(fileName, window.location.href).href;
  } catch (e) {
    return './' + encodeURIComponent(fileName);
  }
}

// 필요할 때만 수동 override로 사용합니다. 비워두면 pubhtml/xlsx에서 자동으로 모든 탭을 읽습니다.
const SHEET_CSV_URLS = {};

// Google Sheet 탭명은 화면 표시/내부 key에 사용하지 않습니다.
// 내부 key는 sheet_1, sheet_2처럼 생성하고, 화면 표시명은 각 시트의 B1 셀값만 사용합니다.
function getDisplaySheetName(_xlsxSheetName, idx, _publishedNames) {
  return 'Sheet ' + ((idx || 0) + 1);
}

function resolveDisplaySheetNameOverride(name, idx) {
  // 이전 탭명 보정 로직 제거: B1 값이 있으면 그대로, 없으면 Sheet N만 사용
  const raw = String(name || '').trim();
  return raw || ('Sheet ' + ((idx || 0) + 1));
}

async function getPublishedFullSheetNames() {
  try {
    const html = await fetchText(DEFAULT_PUBLISHED_HTML_URL);
    const tabs = parsePublishedSheetTabs(html);
    return (tabs || []).map(function(t) { return t && t.name; }).filter(Boolean);
  } catch (e) {
    console.warn('[sheet-loader] full sheet name lookup failed:', e);
    return [];
  }
}

function getDisplaySheetName(xlsxSheetName, idx, publishedNames) {
  const raw = String(xlsxSheetName || '').trim();
  const fromPub = publishedNames && publishedNames[idx] ? String(publishedNames[idx]).trim() : '';
  const candidate = (fromPub && !/^Sheet \d+$/i.test(fromPub)) ? fromPub : raw;
  return resolveDisplaySheetNameOverride(candidate, idx);
}

function getSheetTitleFromB1(matrix, fallbackTitle, idx) {
  // 화면에 표시되는 시트명은 Google Sheet 탭명이 아니라 각 시트의 1행 2열(B1) 값을 우선 사용합니다.
  // XLSX에서 A1이 비어 있으면 sheet_to_json 결과가 B1을 matrix[0][0]으로 당겨 담는 경우가 있어서
  // loadSheetsFromPublishedXlsx()에서는 ws['B1']을 먼저 직접 읽고, 이 함수는 fallback으로만 사용합니다.
  const b1 = cleanText(matrix && matrix[0] && matrix[0][1]);
  if (b1) return b1;
  return cleanText(fallbackTitle) || ('Sheet ' + ((idx || 0) + 1));
}

function getWorksheetCellDisplayText(ws, addr) {
  if (!ws || !addr) return '';
  const cell = ws[addr];
  if (!cell) return '';
  return cleanText(cell.w != null ? cell.w : (cell.v != null ? cell.v : ''));
}

// B1 셀이 병합 범위 안에 있거나, XLSX 파서가 빈 셀 때문에 값을 밀어 읽는 경우까지 보정합니다.
// 화면 제목은 Google Sheet 탭명이 아니라 '각 시트의 1행 2열(B1)' 값을 최우선으로 사용합니다.
function getWorksheetB1DisplayTitle(ws, matrix, fallbackTitle, idx) {
  if (!ws) return getSheetTitleFromB1(matrix, fallbackTitle, idx);

  // 1) 실제 B1 셀 값
  let title = getWorksheetCellDisplayText(ws, 'B1');
  if (title) return title;

  // 2) B1이 병합 셀의 일부인 경우: 병합 범위의 top-left 값을 사용
  try {
    const b1 = XLSX.utils.decode_cell('B1');
    const merges = ws['!merges'] || [];
    for (let i = 0; i < merges.length; i++) {
      const m = merges[i];
      if (b1.r >= m.s.r && b1.r <= m.e.r && b1.c >= m.s.c && b1.c <= m.e.c) {
        const topLeft = XLSX.utils.encode_cell({ r: m.s.r, c: m.s.c });
        title = getWorksheetCellDisplayText(ws, topLeft);
        if (title) return title;
      }
    }
  } catch(e) {}

  // 3) matrix 기준 B1
  title = cleanText(matrix && matrix[0] && matrix[0][1]);
  if (title) return title;

  // 4) Google export에서 A1이 빈칸이라 값이 matrix[0][0]으로 당겨진 경우 보정
  const first = matrix && matrix[0] ? matrix[0] : [];
  const firstNonEmpty = first.map(cleanText).filter(Boolean);
  if (firstNonEmpty.length === 1 && firstNonEmpty[0].toLowerCase() !== 'head') {
    return firstNonEmpty[0];
  }

  return cleanText(fallbackTitle) || ('Sheet ' + ((idx || 0) + 1));
}

function getPayloadDisplayTitle(payload, idx) {
  const title = payload && (payload.displayTitle || payload.sheetTitle);
  return cleanText(title) || ('Sheet ' + ((idx || 0) + 1));
}



function getWorksheetCellResolvedDisplayText(ws, addr) {
  // Read an exact worksheet cell first, then fall back to merged-range top-left.
  // This is used for fixed management cells like B2, which are outside the Head table.
  var direct = getWorksheetCellDisplayText(ws, addr);
  if (direct) return direct;
  if (!ws || !addr || !window.XLSX) return '';
  try {
    var target = XLSX.utils.decode_cell(addr);
    var merges = ws['!merges'] || [];
    for (var i = 0; i < merges.length; i++) {
      var m = merges[i];
      if (target.r >= m.s.r && target.r <= m.e.r && target.c >= m.s.c && target.c <= m.e.c) {
        var topLeft = XLSX.utils.encode_cell({ r: m.s.r, c: m.s.c });
        var v = getWorksheetCellDisplayText(ws, topLeft);
        if (v) return v;
      }
    }
  } catch (e) {}
  return '';
}

function getWorksheetCellPreserveLineText(ws, addr) {
  if (!ws || !addr) return '';
  var cell = ws[addr];
  if (!cell) return '';
  var value = cell.w != null ? cell.w : (cell.v != null ? cell.v : '');
  return String(value == null ? '' : value)
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
}

function getWorksheetCellResolvedPreserveLineText(ws, addr) {
  // B2 can contain multiple lines. Do not use cleanText(), because it collapses line breaks.
  var direct = getWorksheetCellPreserveLineText(ws, addr);
  if (direct) return direct;
  if (!ws || !addr || !window.XLSX) return '';
  try {
    var target = XLSX.utils.decode_cell(addr);
    var merges = ws['!merges'] || [];
    for (var i = 0; i < merges.length; i++) {
      var m = merges[i];
      if (target.r >= m.s.r && target.r <= m.e.r && target.c >= m.s.c && target.c <= m.e.c) {
        var topLeft = XLSX.utils.encode_cell({ r: m.s.r, c: m.s.c });
        var v = getWorksheetCellPreserveLineText(ws, topLeft);
        if (v) return v;
      }
    }
  } catch (e) {}
  return '';
}

function getWeeklyUpdateB2FromWorksheet(ws, matrix) {
  // User-managed notice cell: B2 only. Preserve every line inside B2.
  // Use the original worksheet, not the Head-normalized matrix.
  var value = getWorksheetCellResolvedPreserveLineText(ws, 'B2');
  if (!value && matrix && matrix[1]) {
    value = String(matrix[1][1] == null ? '' : matrix[1][1])
      .replace(/\u00a0/g, ' ')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();
  }
  return String(value == null ? '' : value).replace(/\u00a0/g, ' ').trim();
}

function extractWeeklyUpdateItemsFromMatrix(matrix) {
  const rows = Array.isArray(matrix) ? matrix : [];

  function isWeeklyNA(value) {
    const v = String(value == null ? '' : value).replace(/\u00a0/g, ' ').trim();
    return !v || /^N\/?A$/i.test(v) || /^NA$/i.test(v) || v === '-' || v === '—';
  }

  // 최우선 기준: B2 셀만 사용합니다.
  // B2가 N/A/빈값이면 이번주 업데이트를 만들지 않습니다.
  const b2 = rows[1] ? String(rows[1][1] == null ? '' : rows[1][1]).trim() : '';
  if (isWeeklyNA(b2)) return [];

  const out = parseWeeklyUpdateText(b2);
  if (!out.length && b2) out.push({ country: '신규 항목', url: '', text: b2 });

  const seen = {};
  return out.filter(function(item) {
    const text = item && (item.text || item.url) ? String(item.text || item.url).trim() : '';
    if (!text) return false;
    const key = String(item.country || '') + '|' + String(item.url || '') + '|' + text;
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function extractWeeklyUpdateItemsFromText(text) {
  const value = String(text == null ? '' : text).replace(/\u00a0/g, ' ').trim();
  if (!value || /^N\/?A$/i.test(value) || /^NA$/i.test(value) || value === '-' || value === '—') return [];
  const out = parseWeeklyUpdateText(value);
  if (!out.length && value) out.push({ country: '신규 항목', url: '', text: value });
  return out;
}

function parseWeeklyUpdateText(text) {
  const raw = String(text || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
  if (!raw) return [];
  const items = [];
  const source = splitWeeklyUpdateSingleLine(raw);
  source.forEach(function(part) {
    const parsed = parseWeeklyUpdateEntryList(part);
    parsed.forEach(function(item) { if (item) items.push(item); });
  });
  return items;
}

function splitWeeklyUpdateSingleLine(text) {
  const raw = String(text || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
  if (!raw) return [];

  const lines = raw.split(/\n+/).map(function(v){ return v.trim(); }).filter(Boolean);
  const chunks = [];
  lines.forEach(function(line) {
    // Google export 등으로 줄바꿈이 사라져도 "CA-en : url... CA-fr : url..." 단위로 재분리합니다.
    const markerRe = /(^|\s)([^:：\n]{1,40}?)\s*[：:]\s*(?=https?:\/\/)/ig;
    const markers = [];
    let m;
    while ((m = markerRe.exec(line))) {
      markers.push({ index: m.index + (m[1] ? m[1].length : 0) });
    }
    if (markers.length > 1) {
      for (let i = 0; i < markers.length; i++) {
        const part = line.slice(markers[i].index, i + 1 < markers.length ? markers[i + 1].index : line.length).trim();
        if (part) chunks.push(part);
      }
    } else {
      chunks.push(line);
    }
  });

  const out = [];
  chunks.forEach(function(chunk) {
    String(chunk || '').split(/\s*;\s*/).forEach(function(part) {
      part = part.trim();
      if (part) out.push(part);
    });
  });
  return out;
}

function parseWeeklyUpdateEntryList(part) {
  const text = String(part || '').trim();
  if (!text) return [];

  const kv = text.match(/^([^:：]{1,40})\s*[：:]\s*(.+)$/);
  if (kv) {
    const country = cleanText(kv[1]) || '신규 항목';
    const body = String(kv[2] || '').trim();
    const urls = [];
    const urlRe = /https?:\/\/[^\s,;]+/ig;
    let m;
    while ((m = urlRe.exec(body))) urls.push(m[0].replace(/[),.;]+$/g, ''));
    if (urls.length) {
      return urls.map(function(url) { return { country: country, url: url, text: url }; });
    }
    return [{ country: country, url: '', text: cleanText(body) || text }];
  }

  const item = parseWeeklyUpdateEntry(text);
  return item ? [item] : [];
}

function parseWeeklyUpdateEntry(part) {
  const text = String(part || '').trim();
  if (!text) return null;
  const urlMatch = text.match(/https?:\/\/\S+/i);
  if (urlMatch) {
    const url = urlMatch[0].replace(/[),.;]+$/g, '');
    const before = text.slice(0, urlMatch.index).replace(/[：:>-]+\s*$/g, '').trim();
    const country = cleanText(before) || '신규 항목';
    return { country: country, url: url, text: text };
  }

  // URL이 없는 B열 문구도 이번주 업데이트 공지로 표시합니다.
  // 예: 신규 항목: How to clean MWO, MWO buying guide
  const m = text.match(/^([^:：]{1,40})\s*[：:]\s*(.+)$/);
  if (m) return { country: cleanText(m[1]) || '신규 항목', url: '', text: cleanText(m[2]) || text };
  return { country: '신규 항목', url: '', text: text };
}

async function loadDashboardFromPublishedHtml() {
  let sheetPayloads = [];
  const errors = [];

  // Local XLSX only. This avoids the slow Google Sheet published XLSX request.
  try {
    sheetPayloads = await loadSheetsFromPublishedXlsx(DEFAULT_XLSX_URL);
    console.info('[sheet-loader] loaded sheets from local xlsx:', sheetPayloads.map(function(s){ return s.sheetName; }));
  } catch (e) {
    errors.push('LOCAL_XLSX: ' + (e && e.message ? e.message : e));
    console.error('[sheet-loader] local xlsx load failed:', e);
  }

  if (!sheetPayloads.length) {
    throw new Error(
      'Local XLSX 파일을 읽지 못했습니다.\n' +
      '확인 필요: index.html과 같은 폴더에 "' + LOCAL_DASHBOARD_XLSX_FILE + '" 파일이 있는지 확인해주세요.\n' +
      '또는 로컬에서는 VS Code Live Server처럼 http:// 서버로 실행해야 합니다.\n\n' +
      errors.join('\n')
    );
  }

  const validSheets = [];
  const loadErrors = [];

  sheetPayloads.forEach(function(payload, idx) {
    const displayTitle = getPayloadDisplayTitle(payload, idx);
    const key = 'sheet_' + (idx + 1);
    try {
      const table = extractHeadMarkedTable(payload.matrix, key, payload.styles || []);
      const dashboardData = buildSheetDashboardData(table, displayTitle || key);
      dashboardData.displayTitle = displayTitle || key;
      dashboardData.sheetTitle = displayTitle || key;
      dashboardData.sheetTabName = displayTitle || key;
      dashboardData.originalSheetName = key;
      dashboardData.sourceUrl = payload.sourceUrl || '';
      dashboardData.matrix = payload.matrix || [];
      dashboardData.rawMatrix = payload.rawMatrix || payload.matrix || [];
      dashboardData.weeklyUpdateText = String(payload.weeklyUpdateText == null ? '' : payload.weeklyUpdateText).trim();
      dashboardData.weeklyUpdateB2 = String(payload.weeklyUpdateB2 == null ? dashboardData.weeklyUpdateText : payload.weeklyUpdateB2).trim();
      dashboardData.metaCells = payload.metaCells || { B2: dashboardData.weeklyUpdateB2 };
      dashboardData.weeklyUpdates = payload.weeklyUpdates || extractWeeklyUpdateItemsFromText(dashboardData.weeklyUpdateText) || extractWeeklyUpdateItemsFromMatrix(payload.rawMatrix || payload.matrix || []);
      validSheets.push({ key: key, source: { sheetName: dashboardData.displayTitle, displayTitle: dashboardData.displayTitle, originalSheetName: key, url: payload.sourceUrl || '' }, data: dashboardData });
    } catch (e) {
      const msg = '[' + (displayTitle || payload.sheetName || key) + '] ' + (e && e.message ? e.message : e);
      loadErrors.push(msg);
      console.warn('[sheet-loader] sheet skipped:', msg);
    }
  });

  if (!validSheets.length) {
    throw new Error('로드 가능한 시트가 없습니다. 각 시트의 A열에 Head가 있는지 확인해주세요.\n' + loadErrors.join('\n'));
  }

  const keys = validSheets.map(function(s){ return s.key; });
  const sourceMap = {};
  validSheets.forEach(function(s){ sourceMap[s.key] = s.source; });

  window.__SHEET_DRIVEN_NAV = true;
  window.__DASHBOARD_KEYS = keys.slice();
  window.__SHEET_SOURCE_MAP = sourceMap;

  initBaseGlobals(keys, sourceMap);

  validSheets.forEach(function(s) {
    applySheetData(s.key, s.data);
  });

  renderSidebarNavFromSheets(keys);
  forceCurrentSheetTitle(keys[0]);
}

async function loadSheetsFromPublishedXlsx(xlsxUrl) {
  if (!window.XLSX) throw new Error('XLSX 라이브러리가 로드되지 않았습니다. index.html의 xlsx.full.min.js를 확인해주세요.');

  const isGoogleSheetUrl = /^https?:\/\/docs\.google\.com/i.test(String(xlsxUrl || ''));
  const fetchUrl = isGoogleSheetUrl ? appendCacheBuster(xlsxUrl) : xlsxUrl;
  const res = await fetch(fetchUrl, { cache: isGoogleSheetUrl ? 'no-store' : 'default' });
  if (!res.ok) throw new Error('XLSX를 불러오지 못했습니다. HTTP ' + res.status + ' / ' + fetchUrl);

  const buf = await res.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellStyles: true, bookFiles: true, cellNF: true });
  const payloads = [];

  (wb.SheetNames || []).forEach(function(sheetName, idx) {
    const fallbackSheetName = 'Sheet ' + (idx + 1);
    const ws = wb.Sheets[sheetName];
    if (!ws) return;
    const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
    const displaySheetName = getWorksheetB1DisplayTitle(ws, matrix, fallbackSheetName, idx);
    let styleMatrix = worksheetToStyleMatrix(ws, wb);
    const rawXmlStyleMatrix = worksheetToStyleMatrixFromOoxml(wb, idx, ws);
    if (hasMoreStyleCells(rawXmlStyleMatrix, styleMatrix)) styleMatrix = rawXmlStyleMatrix;
    const cleaned = normalizeMatrix(matrix);
    if (hasHeadMarker(cleaned)) {
      const weeklyUpdateText = getWeeklyUpdateB2FromWorksheet(ws, matrix);
      payloads.push({
        sheetName: displaySheetName,
        displayTitle: displaySheetName,
        originalSheetName: 'sheet_' + (idx + 1),
        matrix: cleaned,
        rawMatrix: matrix,
        styles: normalizeStyleMatrix(styleMatrix, cleaned),
        sourceUrl: xlsxUrl,
        weeklyUpdateText: weeklyUpdateText,
        weeklyUpdateB2: weeklyUpdateText,
        metaCells: { B2: weeklyUpdateText },
        weeklyUpdates: extractWeeklyUpdateItemsFromText(weeklyUpdateText)
      });
    } else {
      console.info('[sheet-loader] xlsx sheet skipped because Head marker not found:', displaySheetName);
    }
  });

  return payloads;
}


function hasMoreStyleCells(candidate, current) {
  function count(m) {
    let n = 0;
    (m || []).forEach(function(row) { (row || []).forEach(function(v) { if (normalizeFillColor(v)) n++; }); });
    return n;
  }
  return count(candidate) > count(current);
}

function worksheetToStyleMatrixFromOoxml(wb, sheetIdx, ws) {
  try {
    const styleMap = parseOoxmlStyleColorMap(wb);
    if (!styleMap || !styleMap.length) return [];
    const sheetXml = getWorksheetXmlText(wb, sheetIdx);
    if (!sheetXml) return [];
    const range = XLSX.utils.decode_range(ws && ws['!ref'] || 'A1:A1');
    const out = [];
    for (let r = range.s.r; r <= range.e.r; r++) {
      const row = [];
      for (let c = range.s.c; c <= range.e.c; c++) row.push('');
      out.push(row);
    }

    sheetXml.replace(/<c\b([^>]*)>(?:[\s\S]*?<\/c>)?/g, function(_, attrs) {
      const ref = getXmlAttr(attrs, 'r');
      const sIdx = getXmlAttr(attrs, 's');
      if (!ref || sIdx == null) return '';
      const pos = XLSX.utils.decode_cell(ref);
      const rr = pos.r - range.s.r;
      const cc = pos.c - range.s.c;
      if (!out[rr]) return '';
      const bg = normalizeFillColor(styleMap[Number(sIdx)] || '');
      if (bg) out[rr][cc] = bg;
      return '';
    });

    // 병합 셀은 top-left 셀 배경색을 전체 범위에 전파합니다.
    (ws && ws['!merges'] || []).forEach(function(m) {
      const top = m.s.r - range.s.r;
      const left = m.s.c - range.s.c;
      const bg = normalizeFillColor(out[top] && out[top][left]);
      if (!bg) return;
      for (let r = m.s.r; r <= m.e.r; r++) {
        for (let c = m.s.c; c <= m.e.c; c++) {
          const rr = r - range.s.r;
          const cc = c - range.s.c;
          if (out[rr]) out[rr][cc] = bg;
        }
      }
    });

    return out;
  } catch (e) {
    console.warn('[sheet-loader] raw OOXML style parse failed:', e);
    return [];
  }
}

function getWorksheetXmlText(wb, sheetIdx) {
  const candidates = [
    'xl/worksheets/sheet' + (sheetIdx + 1) + '.xml',
    '/xl/worksheets/sheet' + (sheetIdx + 1) + '.xml'
  ];
  for (let i = 0; i < candidates.length; i++) {
    const txt = getWorkbookFileText(wb, candidates[i]);
    if (txt) return txt;
  }
  return '';
}

function parseOoxmlStyleColorMap(wb) {
  const stylesXml = getWorkbookFileText(wb, 'xl/styles.xml') || getWorkbookFileText(wb, '/xl/styles.xml');
  if (!stylesXml) return [];
  const themeColors = getWorkbookThemeColorsFromXml(wb);
  const fills = [];

  stylesXml.replace(/<fill\b[^>]*>([\s\S]*?)<\/fill>/g, function(_, body) {
    const pattern = (body.match(/<patternFill\b([^>]*)>/i) || [,''])[1] || '';
    const patternType = (getXmlAttr(pattern, 'patternType') || '').toLowerCase();
    if (patternType === 'none' || patternType === 'gray125') {
      fills.push('');
      return '';
    }
    const fg = (body.match(/<fgColor\b([^>]*)\/?\>/i) || [,''])[1] || '';
    const bg = (body.match(/<bgColor\b([^>]*)\/?\>/i) || [,''])[1] || '';
    fills.push(normalizeOoxmlColorAttrs(fg, themeColors) || normalizeOoxmlColorAttrs(bg, themeColors) || '');
    return '';
  });

  const styleToColor = [];
  const cellXfsMatch = stylesXml.match(/<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/i);
  const cellXfsBody = cellXfsMatch ? cellXfsMatch[1] : '';
  cellXfsBody.replace(/<xf\b([^>]*)\/?\>/g, function(_, attrs) {
    const fillId = Number(getXmlAttr(attrs, 'fillId') || 0);
    styleToColor.push(normalizeFillColor(fills[fillId] || ''));
    return '';
  });
  return styleToColor;
}

function normalizeOoxmlColorAttrs(attrs, themeColors) {
  if (!attrs) return '';
  const rgb = getXmlAttr(attrs, 'rgb');
  if (rgb) return normalizeFillColor(rgb);
  const indexed = getXmlAttr(attrs, 'indexed');
  if (indexed != null && indexed !== '') return normalizeFillColor(indexedColorToHex(Number(indexed)));
  const theme = getXmlAttr(attrs, 'theme');
  if (theme != null && theme !== '') {
    const tint = getXmlAttr(attrs, 'tint');
    let base = themeColors[Number(theme)] || '';
    base = normalizeFillColor(base);
    if (!base) return '';
    const t = tint !== '' && tint != null ? Number(tint) : 0;
    return t ? applyTintToHex(base, t) : base;
  }
  return '';
}

function getWorkbookThemeColorsFromXml(wb) {
  const fallback = ['#FFFFFF','#000000','#EEECE1','#1F497D','#4F81BD','#C0504D','#9BBB59','#8064A2','#4BACC6','#F79646','#0000FF','#800080'];
  const themeXml = getWorkbookFileText(wb, 'xl/theme/theme1.xml') || getWorkbookFileText(wb, '/xl/theme/theme1.xml');
  if (!themeXml) return fallback;
  const order = ['lt1','dk1','lt2','dk2','accent1','accent2','accent3','accent4','accent5','accent6','hlink','folHlink'];
  const out = [];
  order.forEach(function(name) {
    const re = new RegExp('<a:' + name + '\\b[^>]*>([\\s\\S]*?)<\\/a:' + name + '>', 'i');
    const m = themeXml.match(re);
    const body = m ? m[1] : '';
    const srgb = (body.match(/<a:srgbClr\b[^>]*val="([0-9A-Fa-f]{6})"/i) || [,''])[1];
    const sys = (body.match(/<a:sysClr\b[^>]*lastClr="([0-9A-Fa-f]{6})"/i) || [,''])[1];
    out.push(srgb ? '#' + srgb.toUpperCase() : (sys ? '#' + sys.toUpperCase() : ''));
  });
  return out.some(Boolean) ? out : fallback;
}

function getXmlAttr(attrText, name) {
  const re = new RegExp('(?:^|\\s)' + name + '="([^"]*)"', 'i');
  const m = String(attrText || '').match(re);
  return m ? m[1] : '';
}

function getWorkbookFileText(wb, path) {
  const files = wb && (wb.files || wb.Files || wb.keys && wb.files);
  if (!files) return '';
  const normalized = String(path || '').replace(/^\//, '');
  const candidates = [normalized, '/' + normalized];

  function decodeContent(content) {
    if (content == null) return '';
    if (typeof content === 'string') return content;
    if (content instanceof Uint8Array || Array.isArray(content)) {
      try { return new TextDecoder('utf-8').decode(new Uint8Array(content)); } catch(e) { return ''; }
    }
    if (content.content != null) return decodeContent(content.content);
    if (content.data != null) return decodeContent(content.data);
    if (content.asText && typeof content.asText === 'function') {
      try { return content.asText(); } catch(e) {}
    }
    return '';
  }

  if (Array.isArray(files)) {
    for (let i = 0; i < files.length; i++) {
      const f = files[i] || {};
      const name = String(f.name || f.path || '').replace(/^\//, '');
      if (name === normalized) return decodeContent(f);
    }
    return '';
  }

  for (let i = 0; i < candidates.length; i++) {
    const val = files[candidates[i]];
    if (val != null) return decodeContent(val);
  }

  if (wb && Array.isArray(wb.keys)) {
    for (let i = 0; i < wb.keys.length; i++) {
      const k = String(wb.keys[i] || '').replace(/^\//, '');
      if (k === normalized) return decodeContent(files[wb.keys[i]] || files[k]);
    }
  }
  return '';
}


function worksheetToStyleMatrix(ws, wb) {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  const out = [];
  for (let r = range.s.r; r <= range.e.r; r++) {
    const row = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r: r, c: c });
      row.push(extractCellFillColor(ws[addr], wb));
    }
    out.push(row);
  }

  // 병합 셀은 top-left 셀에만 스타일이 들어오는 경우가 많으므로
  // 병합 범위 전체에 top-left 배경색을 전파합니다.
  (ws['!merges'] || []).forEach(function(m) {
    const top = m.s.r - range.s.r;
    const left = m.s.c - range.s.c;
    const bg = normalizeFillColor(out[top] && out[top][left]);
    if (!bg) return;
    for (let r = m.s.r; r <= m.e.r; r++) {
      for (let c = m.s.c; c <= m.e.c; c++) {
        const rr = r - range.s.r;
        const cc = c - range.s.c;
        if (out[rr]) out[rr][cc] = bg;
      }
    }
  });

  return out;
}

function extractCellFillColor(cell, wb) {
  if (!cell || cell.s == null) return '';

  const styles = [];
  styles.push(cell.s);

  const resolved = resolveWorkbookCellStyle(cell.s, wb);
  if (resolved) styles.push(resolved);

  for (let i = 0; i < styles.length; i++) {
    const st = styles[i] || {};

    // SheetJS 버전에 따라 style 객체가 fill 하위가 아니라 최상위에 색상을 둘 때도 있습니다.
    const fill = st.fill || st.Fill || st;
    const candidates = [
      fill.fgColor, fill.bgColor, fill.fgcolor, fill.bgcolor,
      fill.color, fill.fg, fill.bg,
      st.fgColor, st.bgColor, st.color,
      st.fgcolor, st.bgcolor
    ];

    for (let j = 0; j < candidates.length; j++) {
      const color = normalizeXlsxColor(candidates[j], wb);
      if (color) return color;
    }
  }

  return '';
}

function resolveWorkbookCellStyle(styleRef, wb) {
  if (!wb || styleRef == null) return null;
  if (typeof styleRef === 'object' && styleRef.fill) return styleRef;

  const styles = wb.Styles || wb.styles || wb.stylesheet || {};
  const cellXfs = styles.CellXf || styles.cellXfs || styles.CellXfs || styles.cellXf || [];
  const fills = styles.Fills || styles.fills || styles.Fill || styles.fill || [];

  let xf = null;
  if (typeof styleRef === 'number' || /^\d+$/.test(String(styleRef))) {
    xf = cellXfs[Number(styleRef)];
  } else if (typeof styleRef === 'object') {
    xf = styleRef;
  }

  if (!xf) return null;
  const fillId = xf.fillId != null ? xf.fillId : (xf.fillid != null ? xf.fillid : xf.fillID);
  if (fillId == null) return xf;
  const fill = fills[Number(fillId)];
  return Object.assign({}, xf, { fill: fill || xf.fill || {} });
}

function normalizeXlsxColor(color, wb) {
  if (!color) return '';
  if (typeof color === 'string') return normalizeFillColor(color);
  if (color.rgb) return normalizeFillColor(color.rgb);
  if (color.argb) return normalizeFillColor(color.argb);
  if (color.indexed != null) return indexedColorToHex(color.indexed);
  if (color.theme != null) return themeColorToHex(color.theme, color.tint, wb);
  if (color.auto) return '';
  return '';
}

function indexedColorToHex(idx) {
  const map = {
    22:'#C0C0C0', 23:'#808080', 24:'#9999FF', 25:'#993366', 26:'#FFFFCC', 27:'#CCFFFF',
    42:'#CCFFFF', 43:'#CCFFCC', 44:'#FFFF99', 45:'#99CCFF', 46:'#FF99CC', 47:'#CC99FF',
    48:'#FFCC99', 49:'#3366FF', 50:'#33CCCC', 51:'#99CC00', 52:'#FFCC00', 53:'#FF9900',
    54:'#FF6600', 55:'#666699', 56:'#969696', 57:'#003366', 58:'#339966', 59:'#003300',
    60:'#333300', 61:'#993300', 62:'#993366', 63:'#333399', 64:'#FFFFFF', 65:''
  };
  return map[idx] || '';
}

function themeColorToHex(themeIdx, tint, wb) {
  const themeColors = getWorkbookThemeColors(wb);
  let base = themeColors[Number(themeIdx)];
  if (!base) return '';
  base = normalizeFillColor(base);
  if (!base) return '';
  const t = Number(tint || 0);
  if (!t) return base;
  return applyTintToHex(base, t);
}

function getWorkbookThemeColors(wb) {
  // OOXML 기본 Office theme 순서: lt1, dk1, lt2, dk2, accent1~6, hlink, folHlink
  const fallback = ['#FFFFFF','#000000','#EEECE1','#1F497D','#4F81BD','#C0504D','#9BBB59','#8064A2','#4BACC6','#F79646','#0000FF','#800080'];
  try {
    const theme = wb && (wb.Themes && (wb.Themes.theme1 || wb.Themes[0] || wb.Themes));
    const raw = typeof theme === 'string' ? theme : '';
    if (!raw) return fallback;
    const colors = [];
    raw.replace(/<a:srgbClr[^>]*val="([0-9A-Fa-f]{6})"[^>]*>/g, function(_, hex) {
      colors.push('#' + hex.toUpperCase());
      return '';
    });
    return colors.length >= 10 ? colors : fallback;
  } catch(e) {
    return fallback;
  }
}

function applyTintToHex(hex, tint) {
  hex = normalizeFillColor(hex);
  if (!hex) return '';
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  function tintChannel(ch) {
    if (tint < 0) return Math.round(ch * (1 + tint));
    return Math.round(ch + (255 - ch) * tint);
  }
  r = Math.max(0, Math.min(255, tintChannel(r)));
  g = Math.max(0, Math.min(255, tintChannel(g)));
  b = Math.max(0, Math.min(255, tintChannel(b)));
  return '#' + [r,g,b].map(function(x){ return x.toString(16).padStart(2,'0'); }).join('').toUpperCase();
}

function normalizeStyleMatrix(styles, matrix) {
  const rows = styles || [];
  const rowCount = (matrix || []).length;
  const colCount = (matrix || []).reduce(function(max, row){ return Math.max(max, (row || []).length); }, 0);
  const out = [];
  for (let r = 0; r < rowCount; r++) {
    const row = [];
    for (let c = 0; c < colCount; c++) row.push(normalizeFillColor(rows[r] && rows[r][c]));
    out.push(row);
  }
  return out;
}

function normalizeFillColor(value) {
  let v = String(value || '').trim();
  if (!v) return '';
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toUpperCase();
  v = v.replace(/^#/, '').toUpperCase();
  if (/^[0-9A-F]{8}$/.test(v)) v = v.slice(2);
  if (/^[0-9A-F]{6}$/.test(v)) {
    const hex = '#' + v;
    if (hex === '#FFFFFF') return '';
    if (hex === '#D9D9D9') return '#F1F3F5';
    return hex;
  }
  return '';
}

function pickMergedCellBackground(styleRows, r, c, rowspan, colspan) {
  const candidates = [];
  for (let rr = r; rr < r + rowspan; rr++) {
    for (let cc = c; cc < c + colspan; cc++) {
      const bg = normalizeFillColor(styleRows[rr] && styleRows[rr][cc]);
      if (bg) candidates.push(bg);
    }
  }
  return candidates[0] || '';
}

function extractSheetTablesFromPublishedHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const tabs = parsePublishedSheetTabs(html);
  const tables = Array.prototype.slice.call(doc.querySelectorAll('table'));
  const payloads = [];

  tables.forEach(function(table, idx) {
    let matrix = htmlTableToMatrix(table);
    matrix = stripGoogleGridHeaders(matrix);
    matrix = normalizeMatrix(matrix);
    if (!hasHeadMarker(matrix)) return;

    const fallbackName = (tabs[payloads.length] && tabs[payloads.length].name) ||
      findNearbySheetName(table) ||
      ('Sheet ' + (payloads.length + 1));
    const name = getSheetTitleFromB1(matrix, fallbackName, payloads.length);

    payloads.push({ sheetName: name, displayTitle: name, originalSheetName: fallbackName, matrix: matrix, sourceUrl: DEFAULT_PUBLISHED_HTML_URL, weeklyUpdates: extractWeeklyUpdateItemsFromMatrix(matrix) });
  });

  return payloads;
}

function htmlTableToMatrix(table) {
  const grid = [];
  const rows = Array.prototype.slice.call(table.querySelectorAll('tr'));
  const occupied = {};

  rows.forEach(function(tr, r) {
    if (!grid[r]) grid[r] = [];
    let c = 0;
    while (occupied[r + ',' + c]) c++;

    const cells = Array.prototype.slice.call(tr.children).filter(function(el) {
      return /^(td|th)$/i.test(el.tagName || '');
    });

    cells.forEach(function(cell) {
      while (occupied[r + ',' + c]) c++;
      const text = cleanText(cell.textContent || '');
      const colspan = Math.max(1, parseInt(cell.getAttribute('colspan') || cell.colSpan || 1, 10));
      const rowspan = Math.max(1, parseInt(cell.getAttribute('rowspan') || cell.rowSpan || 1, 10));

      // top-left만 값 유지. 나머지는 빈칸으로 두어 병합 헤더를 colspan으로 추정할 수 있게 합니다.
      grid[r][c] = text;
      for (let rr = r; rr < r + rowspan; rr++) {
        if (!grid[rr]) grid[rr] = [];
        for (let cc = c; cc < c + colspan; cc++) {
          if (!(rr === r && cc === c)) grid[rr][cc] = grid[rr][cc] || '';
          occupied[rr + ',' + cc] = true;
        }
      }
      c += colspan;
    });
  });

  return grid;
}

function stripGoogleGridHeaders(matrix) {
  matrix = normalizeMatrix(matrix);
  if (!matrix.length) return matrix;

  // Google waffle table은 첫 행에 A/B/C... 컬럼 라벨, 첫 열에 1/2/3... 행 번호가 붙을 수 있습니다.
  const firstRow = matrix[0] || [];
  let letterHits = 0;
  for (let i = 1; i < Math.min(firstRow.length, 12); i++) {
    if (/^[A-Z]{1,3}$/.test(cleanText(firstRow[i]))) letterHits++;
  }
  if (letterHits >= 2) matrix = matrix.slice(1);

  let numericHits = 0;
  let checked = 0;
  for (let r = 0; r < Math.min(matrix.length, 30); r++) {
    const v = cleanText(matrix[r] && matrix[r][0]);
    if (!v) continue;
    checked++;
    if (/^\d+$/.test(v)) numericHits++;
  }
  if (checked && numericHits / checked > 0.6) {
    matrix = matrix.map(function(row){ return (row || []).slice(1); });
  }

  return normalizeMatrix(matrix);
}

function findNearbySheetName(table) {
  let el = table;
  for (let i = 0; i < 4 && el; i++, el = el.parentElement) {
    const id = el.getAttribute && el.getAttribute('id');
    const aria = el.getAttribute && (el.getAttribute('aria-label') || el.getAttribute('data-name'));
    if (aria) return cleanText(aria);
    if (id && !/^\d+$/.test(id) && id.length < 80) return cleanText(id.replace(/[_-]+/g, ' '));
  }
  return '';
}

async function getCsvSourceMapFromPubhtmlOrConfig() {
  const configured = normalizeConfiguredSources(SHEET_CSV_URLS);
  if (Object.keys(configured).length) return configured;

  const html = await fetchText(DEFAULT_PUBLISHED_HTML_URL);
  const tabs = parsePublishedSheetTabs(html);
  if (!tabs.length) {
    throw new Error('pubhtml에서 시트 탭 gid를 찾지 못했습니다. pubhtml HTML 구조가 예상과 다릅니다.');
  }

  const out = {};
  tabs.forEach(function(tab, i) {
    const name = tab.name || ('Sheet ' + (i + 1));
    const key = safeSheetKey(name, i);
    out[key] = {
      url: buildCsvUrlForGid(tab.gid),
      sheetName: name,
      gid: tab.gid
    };
  });
  return out;
}

async function loadSheetsFromCsvSourceMap(sourceMap) {
  const payloads = [];
  const keys = Object.keys(sourceMap || {});
  for (const key of keys) {
    const source = normalizeSheetSource(sourceMap[key], key);
    if (!source.url) continue;
    const csvText = await fetchText(source.url);
    const matrix = parseCSV(csvText);
    const title = getSheetTitleFromB1(matrix, source.sheetName || key, payloads.length);
    payloads.push({ sheetName: title, displayTitle: title, originalSheetName: source.sheetName || key, matrix: normalizeMatrix(matrix), sourceUrl: source.url, weeklyUpdates: extractWeeklyUpdateItemsFromMatrix(matrix) });
  }
  return payloads;
}

function parsePublishedSheetTabs(html) {
  const tabs = [];
  const seen = {};

  function add(gid, name) {
    gid = String(gid || '').trim();
    name = decodeHtmlEntities(cleanText(stripTags(name || '')));
    if (!gid) return;
    if (!name || /^gid$/i.test(name) || /^#?$/.test(name)) name = 'Sheet ' + (tabs.length + 1);
    const id = gid;
    if (seen[id]) return;
    seen[id] = true;
    tabs.push({ gid: gid, name: name });
  }

  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');

    Array.prototype.forEach.call(doc.querySelectorAll('a[href*="gid"], area[href*="gid"]'), function(a) {
      const href = a.getAttribute('href') || '';
      const m = href.match(/[?#&]gid=(\d+)/) || href.match(/#gid=(\d+)/) || href.match(/gid(?:%3D|=)(\d+)/i);
      if (!m) return;
      const name = cleanText(a.textContent || a.getAttribute('title') || a.getAttribute('aria-label') || '');
      add(m[1], name);
    });

    Array.prototype.forEach.call(doc.querySelectorAll('[data-gid], [gid]'), function(el) {
      const gid = el.getAttribute('data-gid') || el.getAttribute('gid');
      const name = cleanText(el.textContent || el.getAttribute('title') || el.getAttribute('aria-label') || '');
      add(gid, name);
    });
  } catch(e) {
    console.warn('[sheet-loader] DOM tab parse failed', e);
  }

  // Anchor fallback
  let m;
  const anchorRe = /<a\b[^>]*href=["'][^"']*(?:[?#&]gid=|#gid=|gid%3D)(\d+)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
  while ((m = anchorRe.exec(html))) add(m[1], m[2]);

  // Generic gid + possible visible label nearby fallback
  const genericRe = /gid[=:%3D]+(\d+)/gi;
  while ((m = genericRe.exec(html))) {
    const start = Math.max(0, m.index - 300);
    const end = Math.min(html.length, m.index + 500);
    const near = html.slice(start, end);
    let name = '';
    const titleMatch = near.match(/(?:title|aria-label|data-name)=["']([^"']+)["']/i);
    if (titleMatch) name = titleMatch[1];
    if (!name) {
      const textMatch = near.match(/>([^<>]{1,80})<\/a>/i) || near.match(/>([^<>]{1,80})<\/div>/i) || near.match(/>([^<>]{1,80})<\/span>/i);
      if (textMatch) name = textMatch[1];
    }
    add(m[1], name);
  }

  return tabs;
}

function normalizeConfiguredSources(config) {
  const out = {};
  Object.keys(config || {}).forEach(function(key, i) {
    const source = normalizeSheetSource(config[key], key);
    if (!source.url) return;
    out[safeSheetKey(key, i)] = source;
  });
  return out;
}

function normalizeSheetSource(source, key) {
  if (typeof source === 'string') return { url: source, sheetName: key, displayTitle: key };
  source = source || {};
  const title = source.displayTitle || source.sheetTitle || source.sheetName || source.tabName || source.name || key;
  return { url: source.url || source.csv || '', sheetName: title, displayTitle: title, originalSheetName: source.originalSheetName || '' };
}

function buildCsvUrlForGid(gid) {
  return DEFAULT_PUBLISHED_BASE_URL + '?gid=' + encodeURIComponent(gid) + '&single=true&output=csv';
}

async function fetchText(url) {
  const res = await fetch(appendCacheBuster(url), { cache: 'no-store' });
  if (!res.ok) throw new Error('불러오기 실패 HTTP ' + res.status + ' / ' + url);
  return await res.text();
}

function appendCacheBuster(url) {
  return url + (url.indexOf('?') >= 0 ? '&' : '?') + 't=' + Date.now();
}

function parseCSV(csvText) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i];
    const next = csvText[i + 1];

    if (ch === '"' && inQuotes && next === '"') {
      cell += '"';
      i++;
    } else if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      row.push(cleanText(cell));
      cell = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && next === '\n') i++;
      row.push(cleanText(cell));
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }

  if (cell || row.length) {
    row.push(cleanText(cell));
    rows.push(row);
  }
  return normalizeMatrix(rows);
}

function normalizeMatrix(matrix) {
  const rows = (matrix || []).map(function(row) {
    return (row || []).map(function(cell) { return cleanText(cell); });
  });
  let maxLen = rows.reduce(function(max, row) { return Math.max(max, row.length); }, 0);
  return rows.map(function(row) {
    const out = row.slice();
    while (out.length < maxLen) out.push('');
    return out;
  });
}

function hasHeadMarker(matrix) {
  return (matrix || []).some(function(row) { return isHeadMarker(row && row[0]); });
}

function extractHeadMarkedTable(matrix, key, styles) {
  matrix = normalizeMatrix(matrix);
  styles = normalizeStyleMatrix(styles || [], matrix);
  const headBlocks = findHeadBlocks(matrix);
  if (!headBlocks.length) {
    throw new Error('[' + key + '] 시트에서 1열(A열)에 "Head"라고 적힌 헤더 행을 찾지 못했습니다.');
  }

  const block = expandHeadBlockWithImplicitRows(matrix, headBlocks[0], headBlocks[1]);
  const nextBlock = headBlocks[1];
  const dataStart = block.end + 1;
  const dataEnd = nextBlock ? nextBlock.start : matrix.length;
  const colIndexes = getHeadTableColumnIndexes(matrix, block, dataStart, dataEnd);
  const rawHeaderRows = block.rows.map(function(rowIdx) {
    return colIndexes.map(function(ci) { return cleanText(matrix[rowIdx] && matrix[rowIdx][ci]); });
  });
  const rawHeaderStyleRows = block.rows.map(function(rowIdx) {
    return colIndexes.map(function(ci) { return normalizeFillColor(styles[rowIdx] && styles[rowIdx][ci]); });
  });
  const headerRowsForDisplay = buildHeaderRowsForDisplay(rawHeaderRows, rawHeaderStyleRows);
  const headers = buildHeadMarkedHeadersFromRows(rawHeaderRows);
  const rows = buildHeadMarkedRows(matrix, dataStart, dataEnd, colIndexes, headers, styles);

  return { headers: headers, rows: rows, headerRows: rawHeaderRows, headerStyleRows: rawHeaderStyleRows, tableHeaderRows: headerRowsForDisplay };
}

function findHeadBlocks(matrix) {
  const blocks = [];
  let cur = null;
  matrix.forEach(function(row, idx) {
    const isHead = isHeadMarker(row && row[0]);
    if (isHead) {
      if (!cur) cur = { start: idx, end: idx, rows: [] };
      cur.end = idx;
      cur.rows.push(idx);
    } else if (cur) {
      blocks.push(cur);
      cur = null;
    }
  });
  if (cur) blocks.push(cur);
  return blocks;
}

// Head marker가 A열에서 세로 병합되어 있으면 xlsx/CSV에서는 첫 행만 "Head"로 내려오고
// 아래 헤더 행의 A열은 빈칸으로 내려옵니다.
// 예: A열 Head(병합) + 1행 Category + 2행 Kitchen/Laundry.
// 이 경우 Head가 적힌 행 다음의 "헤더처럼 보이는" 빈 A열 행을 header block에 포함합니다.
function expandHeadBlockWithImplicitRows(matrix, block, nextBlock) {
  const out = { start: block.start, end: block.end, rows: block.rows.slice() };
  const stopAt = nextBlock ? nextBlock.start : matrix.length;

  for (let r = block.end + 1; r < stopAt; r++) {
    const row = matrix[r] || [];
    if (isHeadMarker(row[0])) break;
    if (cleanText(row[0])) break;
    if (!hasContentAfterMarkerColumn(row)) break;
    if (!looksLikeImplicitHeaderRow(row)) break;

    out.end = r;
    out.rows.push(r);

    // 일반적으로 header는 1~3행입니다. 과도하게 데이터 행까지 먹지 않도록 제한합니다.
    if (out.rows.length >= 4) break;
  }

  return out;
}

function hasContentAfterMarkerColumn(row) {
  for (let c = 1; c < (row || []).length; c++) {
    if (cleanText(row[c])) return true;
  }
  return false;
}

function looksLikeImplicitHeaderRow(row) {
  const values = (row || []).slice(1).map(cleanText).filter(Boolean);
  if (!values.length) return false;

  let headerScore = 0;
  let dataScore = 0;
  values.forEach(function(v) {
    if (isHeaderLikeText(v)) headerScore++;
    if (isDataLikeText(v)) dataScore++;
  });

  // Kitchen / Laundry처럼 명확한 헤더 단어가 있으면 포함합니다.
  if (headerScore > 0 && headerScore >= dataScore) return true;

  // 대부분 국가코드/상태/URL/숫자이면 데이터 행으로 봅니다.
  if (dataScore >= Math.max(1, Math.ceil(values.length * 0.35))) return false;

  return false;
}

function isHeaderLikeText(value) {
  const v = cleanText(value).toLowerCase();
  if (!v) return false;
  return /^(category|kitchen|laundry|refrigerator|washing|washer|dryer|wash tower|washtower|tv|audio|monitor|pc|air conditioner|aircare|vacuum|contents?|content|article|guide|installation|model|division|product|status|progress|country|contry|region|url|page|pg#|remark|owner|due|date|phase|task|schema|alt text|faq)$/i.test(v) ||
    /(category|kitchen|laundry|refrigerator|washing|washer|dryer|washtower|installation|guide|status|country|region|content|article|schema|faq|alt text)/i.test(v);
}

function isDataLikeText(value) {
  const v = cleanText(value);
  if (!v) return false;
  const upper = normalizeCountryKey(v);
  if (COUNTRY_FULLNAME_MAP[upper] || COUNTRY_REGION_MAP[upper]) return true;
  if (/^https?:\/\//i.test(v)) return true;
  if (/^\d+(?:\.\d+)?%?$/.test(v)) return true;
  if (/^\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}$/.test(v)) return true;
  if (/^(done|complete|completed|closed|in progress|wip|corp\.? review|client review|pre-review|cancel|cancelled|canceled|완료|작업중|법인리뷰|법인 리뷰|사전검토|사전 검토|취소)$/i.test(v)) return true;
  return false;
}

function isHeadMarker(value) {
  return String(value || '').trim().toLowerCase() === 'head';
}

function getHeadTableColumnIndexes(matrix, block, dataStart, dataEnd) {
  const maxLen = matrix.reduce(function(max, row) { return Math.max(max, (row || []).length); }, 0);
  const cols = [];
  for (let c = 1; c < maxLen; c++) {
    let hasHeader = false;
    let hasData = false;
    block.rows.forEach(function(r) { if (cleanText(matrix[r] && matrix[r][c])) hasHeader = true; });
    for (let r = dataStart; r < dataEnd; r++) {
      if (isHeadMarker(matrix[r] && matrix[r][0])) continue;
      if (cleanText(matrix[r] && matrix[r][c])) { hasData = true; break; }
    }
    if (hasHeader || hasData) cols.push(c);
  }
  return cols;
}

function buildHeadMarkedHeadersFromRows(rawHeaderRows) {
  const seen = {};
  const filledRows = fillMergedHeaderBlanks(rawHeaderRows);
  const colCount = filledRows.reduce(function(max, row) { return Math.max(max, row.length); }, 0);
  return Array.from({ length: colCount }).map(function(_, idx) {
    const parts = [];
    filledRows.forEach(function(row) {
      const text = cleanText(row[idx]);
      if (text && parts.indexOf(text) < 0) parts.push(text);
    });
    let header = parts.join(' / ') || ('Column ' + (idx + 1));
    if (seen[header] != null) { seen[header] += 1; header += ' ' + seen[header]; }
    else seen[header] = 1;
    return header;
  });
}

function fillMergedHeaderBlanks(rawHeaderRows) {
  const horizontalFilled = rawHeaderRows.map(function(row) {
    let last = '';
    return row.map(function(cell) {
      const text = cleanText(cell);
      if (text) { last = text; return text; }
      return last;
    });
  });
  for (let r = 1; r < horizontalFilled.length; r++) {
    for (let c = 0; c < horizontalFilled[r].length; c++) {
      if (!horizontalFilled[r][c] && horizontalFilled[r - 1] && horizontalFilled[r - 1][c]) {
        horizontalFilled[r][c] = horizontalFilled[r - 1][c];
      }
    }
  }
  return horizontalFilled;
}

function buildHeaderRowsForDisplay(rawHeaderRows, rawHeaderStyleRows) {
  const sourceRows = (rawHeaderRows || []).map(function(row) {
    return (row || []).map(function(cell) { return cleanText(cell); });
  }).filter(function(row) {
    return row.some(function(cell) { return !!cleanText(cell); });
  });

  if (!sourceRows.length) return [];

  const rowCount = sourceRows.length;
  const colCount = sourceRows.reduce(function(max, row) { return Math.max(max, row.length); }, 0);
  const rows = sourceRows.map(function(row) {
    const out = row.slice();
    while (out.length < colCount) out.push('');
    return out;
  });
  const styleRows = (rawHeaderStyleRows || []).map(function(row) {
    const out = (row || []).map(function(cell) { return normalizeFillColor(cell); });
    while (out.length < colCount) out.push('');
    return out;
  });
  while (styleRows.length < rowCount) styleRows.push(Array.from({ length: colCount }, function(){ return ''; }));

  // occupied[r][c] = true이면 위쪽/왼쪽 셀이 rowspan/colspan으로 이미 차지한 자리입니다.
  const occupied = Array.from({ length: rowCount }, function() {
    return Array.from({ length: colCount }, function() { return false; });
  });

  const displayRows = [];

  for (let r = 0; r < rowCount; r++) {
    const cells = [];

    for (let c = 0; c < colCount; c++) {
      if (occupied[r][c]) continue;

      const text = cleanText(rows[r][c]);
      if (!text) continue;

      // 가로 병합: 같은 행에서 현재 셀 오른쪽이 빈칸이면 다음 텍스트 전까지 colspan 처리합니다.
      // 예: Category | 빈칸 | 빈칸 | 빈칸  → Category colspan=4
      let colspan = 1;
      while (c + colspan < colCount && !cleanText(rows[r][c + colspan]) && !occupied[r][c + colspan]) {
        colspan++;
      }

      // 세로 병합: 아래 헤더 행의 동일 범위가 비어 있으면 rowspan 처리합니다.
      // 예: Country 아래 행이 빈칸 → Country rowspan=2
      let rowspan = 1;
      while (r + rowspan < rowCount) {
        let allBlankBelow = true;
        for (let cc = c; cc < c + colspan && cc < colCount; cc++) {
          if (cleanText(rows[r + rowspan][cc])) {
            allBlankBelow = false;
            break;
          }
        }
        if (!allBlankBelow) break;
        rowspan++;
      }

      for (let rr = r; rr < r + rowspan && rr < rowCount; rr++) {
        for (let cc = c; cc < c + colspan && cc < colCount; cc++) {
          occupied[rr][cc] = true;
        }
      }

      cells.push({
        text: text,
        colspan: colspan > 1 ? colspan : 1,
        rowspan: rowspan > 1 ? rowspan : 1,
        bg: pickMergedCellBackground(styleRows, r, c, rowspan, colspan)
      });
    }

    if (cells.length) displayRows.push(cells);
  }

  return displayRows;
}

function buildHeadMarkedRows(matrix, dataStart, dataEnd, colIndexes, headers, styles) {
  const rows = [];
  for (let r = dataStart; r < dataEnd; r++) {
    const src = matrix[r] || [];
    if (isHeadMarker(src[0])) continue;
    const obj = {};
    obj.__styles = {};
    let nonEmpty = 0;
    headers.forEach(function(h, i) {
      const ci = colIndexes[i];
      const value = cleanText(src[ci]);
      obj[h] = value;
      obj.__styles[h] = normalizeFillColor(styles[r] && styles[r][ci]);
      if (value) nonEmpty++;
    });
    if (nonEmpty > 0) rows.push(obj);
  }
  return rows;
}

function initBaseGlobals(activeKeys, sourceMap) {
  activeKeys = activeKeys && activeKeys.length ? activeKeys : [];
  sourceMap = sourceMap || {};
  window.SC = {
    'Pre-Review': { label: '사전검토', dot: '#94A3B8', bg: '#F1F5F9', tc: '#475569' },
    'In Progress': { label: '작업중', dot: '#3B82F6', bg: '#EFF6FF', tc: '#1E40AF' },
    'Corp. Review': { label: '법인리뷰', dot: '#F59E0B', bg: '#FEF3C7', tc: '#92400E' },
    'Done': { label: '완료', dot: '#10B981', bg: '#ECFDF5', tc: '#047857' },
    'Cancel': { label: '취소', dot: '#CBD5E1', bg: '#F8FAFC', tc: '#64748B' }
  };
  window.COL_FULL = {};
  window.STALLED_DAYS = {};
  window.LOCALE_MAP = {};
  window.REGION_CFG = { EU:{label:'EU'}, ASIA:{label:'ASIA'}, CIS:{label:'CIS'}, LATAM:{label:'LATAM'}, MEA:{label:'MEA'}, INDIA:{label:'INDIA'}, NA:{label:'NA'}, ETC:{label:'ETC'} };
  window.REGION_ORDER = ['EU','ASIA','CIS','LATAM','MEA','INDIA','NA','ETC'];
  window.ART_ABBR = {};
  window.REPORT_KEYS = activeKeys.slice();
  window.DATA = {};
  activeKeys.forEach(function(key) {
    const src = normalizeSheetSource(sourceMap[key], key);
    const title = src.displayTitle || src.sheetName || key;
    window.DATA[key] = { title: title, displayTitle: title, sheetTitle: title, sheetTabName: title, originalSheetName: src.originalSheetName || '', icon: '', items: [], tableHeaders: [], tableRows: [], headerRows: [], stats: emptyStats() };
  });
  window.BG_WEEKS = {}; window.ARTICLE_WEEKS = {}; window.ICE_WEEKS = {}; window.MICROSITE_WEEKS = {}; window.WASHTOWER_WEEKS = {}; window.ALTTEXT_WEEKS = {}; window.FAQ_WEEKS = {}; window.PDP_WEEKS = {}; window.VACUUM_WEEKS = {}; window.WMO_FAQ_WEEKS = {};
}

function emptyStats() { return { Done: 0, 'Corp. Review': 0, 'In Progress': 0, 'Pre-Review': 0, Cancel: 0, Total: 0 }; }

function buildSheetDashboardData(table, sheetTitle) {
  const prepared = prepareRegionFirstTable(table);
  const items = prepared.rows.map(function(row) {
    const status = normalizeStatus(pickValue(row, ['Status', 'status', '진행상태', '상태', 'Task Status in PTT', 'Result']));
    const country = pickCountryValue(row);
    const region = row.Region || inferRegionFromCountry(country) || 'ETC';
    return {
      raw: row,
      locale: pickValue(row, ['Locale', 'locale', 'Country', 'country', '국가', 'PDP Country']) || '',
      country: country || '',
      region: region,
      phase: pickValue(row, ['Phase', 'phase', '차수']) || '',
      status: status,
      overall: status,
      pages: Number(pickValue(row, ['Page#', 'Pg#', 'Pages', 'Page', 'pages', 'Total Page#', 'Total Pages']) || 0),
      url: pickValue(row, ['URL', 'Url', 'url', 'Page URL']) || '',
      remark: pickValue(row, ['Remark', 'remark', '비고']) || ''
    };
  });
  const syncedRows = prepared.rows.map(function(row, idx) {
    const copy = Object.assign({}, row);
    copy.Region = items[idx] ? items[idx].region : (copy.Region || 'ETC');
    return copy;
  });
  return {
    displayTitle: sheetTitle,
    sheetTitle: sheetTitle,
    sheetTabName: sheetTitle,
    tableHeaders: prepared.headers,
    tableRows: syncedRows,
    headerRows: prepared.headerRows,
    headerStyleRows: prepared.headerStyleRows,
    tableHeaderRows: prepared.tableHeaderRows,
    items: items,
    stats: calcStats(items)
  };
}

function prepareRegionFirstTable(table) {
  const originalHeaders = (table.headers || []).slice();
  const regionHeaderIndexes = [];
  originalHeaders.forEach(function(h, idx) {
    if (isRegionHeader(h)) regionHeaderIndexes.push(idx);
  });

  const headersWithoutRegion = originalHeaders.filter(function(_, idx) { return regionHeaderIndexes.indexOf(idx) < 0; });
  const headers = ['Region'].concat(headersWithoutRegion);

  const rows = (table.rows || []).map(function(row) {
    const country = pickCountryValue(row);
    const existingRegion = pickValue(row, ['Region', 'region', 'PDP Region']);
    const region = inferRegionFromCountry(country) || normalizeRegionLabel(existingRegion) || 'ETC';
    const out = { Region: region };
    const sourceStyles = row.__styles || {};
    out.__styles = { Region: '' };
    headersWithoutRegion.forEach(function(h) {
      const value = row[h] || '';
      out[h] = isCountryHeaderName(h) ? displayCountryName(value) : value;
      out.__styles[h] = normalizeFillColor(sourceStyles[h]);
    });
    return out;
  });

  let filteredHeaderRows = [];
  if (Array.isArray(table.headerRows) && table.headerRows.length) {
    filteredHeaderRows = table.headerRows.map(function(row) {
      return (row || []).filter(function(_, idx) { return regionHeaderIndexes.indexOf(idx) < 0; });
    });
  }
  let filteredHeaderStyleRows = [];
  if (Array.isArray(table.headerStyleRows) && table.headerStyleRows.length) {
    filteredHeaderStyleRows = table.headerStyleRows.map(function(row) {
      return (row || []).filter(function(_, idx) { return regionHeaderIndexes.indexOf(idx) < 0; });
    });
  }
  const tableHeaderRows = buildRegionFirstHeaderRowsForDisplay(filteredHeaderRows, headersWithoutRegion, filteredHeaderStyleRows);

  return { headers: headers, rows: rows, headerRows: filteredHeaderRows, headerStyleRows: filteredHeaderStyleRows, tableHeaderRows: tableHeaderRows };
}

function isRegionHeader(header) {
  const n = normalizeName(header);
  return n === 'region' || n === 'pdp region' || n === '지역';
}

function buildRegionFirstHeaderRowsForDisplay(filteredHeaderRows, fallbackHeaders, filteredHeaderStyleRows) {
  const rows = Array.isArray(filteredHeaderRows) && filteredHeaderRows.length ? filteredHeaderRows : [fallbackHeaders || []];
  const displayRows = buildHeaderRowsForDisplay(rows, filteredHeaderStyleRows || []);
  if (!displayRows.length) {
    return [[{ text: 'Region', rowspan: 1 }].concat((fallbackHeaders || []).map(function(h) { return { text: h, colspan: 1 }; }))];
  }
  displayRows[0] = [{ text: 'Region', rowspan: displayRows.length, bg: '' }].concat(displayRows[0]);
  return displayRows;
}

function pickCountryValue(row) {
  return pickValue(row, [
    'Country', 'country', 'Country Name', 'country name', 'Contry', 'contry', '국가',
    'PDP Country', 'Locale', 'locale', 'Market', 'market', '법인', 'Subsidiary'
  ]);
}

function isCountryHeaderName(header) {
  const n = normalizeName(header);
  return n === 'country' || n === 'country name' || n === 'contry' || n === 'pdp country' || n === '국가' || n === 'market' || n === '법인' || n === 'subsidiary';
}

function displayCountryName(value) {
  const parsed = parseCountryValueParts(value);
  const fullName = COUNTRY_FULLNAME_MAP[parsed.code] || String(value || '').trim();
  return parsed.lang ? (fullName + ' (' + parsed.lang + ')') : fullName;
}

function parseCountryValueParts(value) {
  let raw = String(value || '').trim();
  if (!raw) return { code: '', lang: '' };

  if (raw.indexOf(':') >= 0) raw = raw.split(':')[0].trim();
  raw = raw.replace(/^(LGE|LG)\s+[A-Z0-9.]+\s*-\s*/i, '').trim();

  let lang = '';
  const parenLocale = raw.match(/\((?:[A-Z]{2}\s*[-_]\s*)?([a-z]{2})\)\s*$/i);
  if (parenLocale && isSheetLoaderLanguageCode(parenLocale[1])) {
    lang = String(parenLocale[1]).toLowerCase();
    raw = raw.replace(/\s*\([^)]*\)\s*$/i, '').trim();
  } else {
    raw = raw.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  }

  // Only a final -xx or _xx is a language suffix. The country/base part can be
  // either a code (HK, CA, SA) or a name (Saudi Arabia, Switzerland).
  const localeMatch = raw.match(/^(.+?)[\s]*[-_][\s]*([A-Za-z]{2})\s*$/);
  if (localeMatch && isSheetLoaderLanguageCode(localeMatch[2])) {
    raw = String(localeMatch[1] || '').trim();
    lang = String(localeMatch[2] || '').toLowerCase();
  }

  const code = normalizeCountryKey(raw);
  return { code: code, lang: lang };
}

function isSheetLoaderLanguageCode(value) {
  const code = String(value || '').toLowerCase();
  return ['en','ar','fr','de','es','pt','ko','ja','zh','it','nl','vi','th','id','tr','pl','cs','da','sv','fi','no','he','fa','ro','bg','hr','hu','el','sk','sl','lt','lv','et','ms','hi'].indexOf(code) >= 0;
}

function normalizeRegionLabel(value) {
  const v = String(value || '').trim().toUpperCase();
  if (!v) return '';
  if (['EU', 'EUROPE', 'EUR'].indexOf(v) >= 0) return 'EU';
  if (['ASIA', 'APAC', 'SEA', 'AP'].indexOf(v) >= 0) return 'ASIA';
  if (['CIS', 'KZ', 'KAZAKHSTAN'].indexOf(v) >= 0) return 'CIS';
  if (['LATAM', 'LATIN AMERICA', 'SOUTH AMERICA', 'LAC'].indexOf(v) >= 0) return 'LATAM';
  if (['MEA', 'MIDDLE EAST', 'AFRICA', 'LEVANT', 'MIDDLE EAST AFRICA'].indexOf(v) >= 0) return 'MEA';
  if (['INDIA', 'IN'].indexOf(v) >= 0) return 'INDIA';
  if (['NA', 'NORTH AMERICA', 'US', 'USA', 'CANADA'].indexOf(v) >= 0) return 'NA';
  return v;
}

function inferRegionFromCountry(country) {
  const code = normalizeCountryKey(country);
  if (!code) return '';
  if (COUNTRY_REGION_MAP[code]) return COUNTRY_REGION_MAP[code];

  // Locale style such as KR-en, PH_en, sa_en, LGE GP1 - PH-en (OPR)
  const m = code.match(/(?:^|[^A-Z])([A-Z]{2})(?:[-_ ][A-Z]{2,}|$)/);
  if (m && COUNTRY_REGION_MAP[m[1]]) return COUNTRY_REGION_MAP[m[1]];
  return '';
}

function normalizeCountryKey(value) {
  let v = String(value || '').trim();
  if (!v) return '';
  if (v.indexOf(':') >= 0) v = v.split(':')[0].trim();
  v = v.replace(/\([^)]*\)/g, ' ');
  v = v.replace(/^(LGE|LG)\s+[A-Z0-9.]+\s*-\s*/i, '');
  v = v.replace(/[_-](EN|AR|FR|ES|PT|KO|JA|ZH|DE|IT|NL|VI|TH|ID|TR|PL|CS|DA|SV|FI|NO|HE|FA)$/i, '');
  v = v.replace(/\s+/g, ' ').trim();
  const upper = v.toUpperCase();
  if (COUNTRY_ALIAS_MAP[upper]) return COUNTRY_ALIAS_MAP[upper];
  return upper;
}

const COUNTRY_ALIAS_MAP = {
  'AFRICA': 'AFRICA', 'LEVANT': 'LEVANT', 'UNITED KINGDOM': 'UK', 'GREAT BRITAIN': 'UK', 'BRITAIN': 'UK', 'U.K.': 'UK', 'GB': 'UK',
  'UNITED STATES': 'US', 'UNITED STATES OF AMERICA': 'US', 'U.S.': 'US', 'USA': 'US',
  'CZECH REPUBLIC': 'CZ', 'CZECHIA': 'CZ', 'KOREA': 'KR', 'SOUTH KOREA': 'KR', 'REPUBLIC OF KOREA': 'KR',
  'VIETNAM': 'VN', 'VIET NAM': 'VN', 'TAIWAN': 'TW', 'HONG KONG': 'HK',
  'UAE': 'AE', 'UNITED ARAB EMIRATES': 'AE', 'SAUDI ARABIA': 'SA', 'TÜRKIYE': 'TR', 'TURKEY': 'TR',
  'SOUTH AFRICA': 'ZA', 'NEW ZEALAND': 'NZ', 'PHILIPPINES': 'PH', 'INDONESIA': 'ID',
  'KAZAKHSTAN': 'KZ',
  'MEXICO': 'MX', 'BRAZIL': 'BR', 'ARGENTINA': 'AR', 'CHILE': 'CL', 'COLOMBIA': 'CO', 'PERU': 'PE',
  'BELGIUM': 'BE', 'DENMARK': 'DK', 'FINLAND': 'FI', 'SWEDEN': 'SE', 'GERMANY': 'DE', 'SPAIN': 'ES',
  'FRANCE': 'FR', 'ITALY': 'IT', 'AUSTRALIA': 'AU', 'INDIA': 'IN', 'CANADA': 'CA'
};

const COUNTRY_REGION_MAP = {
  AFRICA:'MEA', LEVANT:'MEA',
  // EU / Europe
  AT:'EU', BE:'EU', BG:'EU', CH:'EU', CY:'EU', CZ:'EU', DE:'EU', DK:'EU', EE:'EU', ES:'EU', FI:'EU', FR:'EU',
  GB:'EU', UK:'EU', GR:'EU', HR:'EU', HU:'EU', IE:'EU', IT:'EU', LT:'EU', LV:'EU', NL:'EU', NO:'EU', PL:'EU',
  PT:'EU', RO:'EU', RS:'EU', SE:'EU', SI:'EU', SK:'EU', TR:'EU', UA:'EU',
  // CIS
  KZ:'CIS',
  // ASIA / Oceania
  AU:'ASIA', BD:'ASIA', CN:'ASIA', HK:'ASIA', ID:'ASIA', JP:'ASIA', KR:'ASIA', LK:'ASIA', MY:'ASIA', MM:'ASIA',
  NZ:'ASIA', PH:'ASIA', SG:'ASIA', TH:'ASIA', TW:'ASIA', VN:'ASIA', PK:'ASIA', KH:'ASIA', NP:'ASIA',
  // India as separate region
  IN:'INDIA',
  // North America
  US:'NA', CA:'NA',
  // LATAM
  AR:'LATAM', BO:'LATAM', BR:'LATAM', CL:'LATAM', CO:'LATAM', CR:'LATAM', DO:'LATAM', EC:'LATAM', GT:'LATAM',
  HN:'LATAM', MX:'LATAM', NI:'LATAM', PA:'LATAM', PE:'LATAM', PR:'LATAM', PY:'LATAM', SV:'LATAM', UY:'LATAM', VE:'LATAM',
  // MEA
  AE:'MEA', AF:'MEA', AO:'MEA', BH:'MEA', DZ:'MEA', EG:'MEA', GH:'MEA', IL:'MEA', IR:'MEA', IQ:'MEA', JO:'MEA',
  KE:'MEA', KW:'MEA', LB:'MEA', MA:'MEA', NG:'MEA', OM:'MEA', QA:'MEA', SA:'MEA', TN:'MEA', TZ:'MEA', ZA:'MEA'
};

const COUNTRY_FULLNAME_MAP = {
  AFRICA:'Africa', LEVANT:'Levant', HS:'HS', AE:'United Arab Emirates', AF:'Afghanistan', AO:'Angola', AR:'Argentina', AT:'Austria', AU:'Australia',
  BD:'Bangladesh', BE:'Belgium', BG:'Bulgaria', BH:'Bahrain', BO:'Bolivia', BR:'Brazil', CA:'Canada',
  CH:'Switzerland', CL:'Chile', CN:'China', CO:'Colombia', CR:'Costa Rica', CY:'Cyprus', CZ:'Czech Republic',
  DE:'Germany', DK:'Denmark', DO:'Dominican Republic', DZ:'Algeria', EC:'Ecuador', EE:'Estonia', EG:'Egypt',
  ES:'Spain', FI:'Finland', FR:'France', GB:'United Kingdom', GH:'Ghana', GR:'Greece', GT:'Guatemala',
  HK:'Hong Kong', HN:'Honduras', HR:'Croatia', HU:'Hungary', ID:'Indonesia', IE:'Ireland', IL:'Israel',
  IN:'India', IR:'Iran', IQ:'Iraq', IT:'Italy', JO:'Jordan', JP:'Japan', KE:'Kenya', KH:'Cambodia',
  KR:'South Korea', KW:'Kuwait', KZ:'Kazakhstan', LB:'Lebanon', LK:'Sri Lanka', LT:'Lithuania', LV:'Latvia',
  MA:'Morocco', MM:'Myanmar', MX:'Mexico', MY:'Malaysia', NG:'Nigeria', NI:'Nicaragua', NL:'Netherlands',
  NO:'Norway', NP:'Nepal', NZ:'New Zealand', OM:'Oman', PA:'Panama', PE:'Peru', PH:'Philippines',
  PK:'Pakistan', PL:'Poland', PR:'Puerto Rico', PT:'Portugal', PY:'Paraguay', QA:'Qatar', RO:'Romania',
  RS:'Serbia', SA:'Saudi Arabia', SE:'Sweden', SG:'Singapore', SI:'Slovenia', SK:'Slovakia', SV:'El Salvador',
  TH:'Thailand', TN:'Tunisia', TR:'Turkey', TW:'Taiwan', TZ:'Tanzania', UA:'Ukraine', UK:'United Kingdom',
  US:'United States', UY:'Uruguay', VE:'Venezuela', VN:'Vietnam', ZA:'South Africa'
};

function applySheetData(key, data) {
  if (!window.DATA[key]) return;
  const target = window.DATA[key];
  const title = data.displayTitle || data.sheetTabName || data.sheetTitle || target.title;
  target.title = title;
  target.displayTitle = title;
  target.sheetTitle = title;
  target.sheetTabName = title;
  target.originalSheetName = data.originalSheetName || target.originalSheetName || '';
  target.tableHeaders = data.tableHeaders;
  target.tableRows = data.tableRows;
  target.headerRows = data.headerRows;
  target.tableHeaderRows = data.tableHeaderRows;
  target.headerStyleRows = data.headerStyleRows || [];
  target.items = data.items;
  target.stats = data.stats;

  // Fixed management cells outside the Head table must be copied too.
  // B2 is used for the weekly update notice shown inside .ov-card-new.
  // Previous versions read B2 in loadSheetsFromPublishedXlsx(), but applySheetData()
  // did not copy those fields into DATA[currentKey], so renderWeeklyUpdateSection()
  // always received an empty value.
  target.weeklyUpdateText = data.weeklyUpdateText || '';
  target.weeklyUpdateB2 = data.weeklyUpdateB2 || data.weeklyUpdateText || '';
  target.weeklyUpdates = Array.isArray(data.weeklyUpdates) ? data.weeklyUpdates : [];
  target.metaCells = data.metaCells || {};
  target.rawMatrix = data.rawMatrix || [];
  target.matrix = data.matrix || target.matrix || [];
}

function renderSidebarNavFromSheets(keys) {
  const section = document.getElementById('sheetNavList') || document.querySelector('.sb-section');
  if (!section) return;
  const html = ['<div class="sb-section-label">Contents</div>'];
  keys.forEach(function(key, idx) {
    const d = window.DATA && window.DATA[key];
    const title = (d && (d.displayTitle || d.sheetTabName || d.sheetTitle || d.title)) || key;
    const abbr = makeNavAbbr(title, idx);
    const total = d && d.stats ? (d.stats.Total || 0) : 0;
    html.push('<div class="nav-item ' + (idx === 0 ? 'active' : '') + '" data-key="' + escapeAttrForLoader(key) + '" onclick="switchMenu(this)">' +
      '<span class="ni-text" data-abbr="' + escapeAttrForLoader(abbr) + '">' + escapeHtmlForLoader(title) + '</span>' +
      '<span class="ni-badge" style="background:rgba(148,163,184,.16);color:#64748B">' + total.toLocaleString() + '</span>' +
      '</div>');
  });
  section.innerHTML = html.join('');
}

function getPrevIsoWeekLabelForLoader() {
  try {
    const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    const week = 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
    return 'W' + String(week).padStart(2, '0');
  } catch(e) {
    return 'W--';
  }
}

function forceCurrentSheetTitle(key) {
  key = key || (window.__DASHBOARD_KEYS && window.__DASHBOARD_KEYS[0]);
  const d = window.DATA && window.DATA[key];
  const title = d && (d.displayTitle || d.sheetTabName || d.sheetTitle || d.title);
  const top = document.getElementById('topTitle');
  const meta = document.getElementById('topMeta');
  if (top && title) top.textContent = title;
  if (meta) meta.textContent = getPrevIsoWeekLabelForLoader();
}

function makeNavAbbr(title, idx) {
  const words = String(title || '').replace(/[^A-Za-z0-9가-힣 ]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return String(idx + 1).padStart(2, '0');
  const letters = words.slice(0, 2).map(function(w) { return w.charAt(0).toUpperCase(); }).join('');
  return letters || String(idx + 1).padStart(2, '0');
}

function pickValue(row, candidates) {
  const keys = Object.keys(row || {});
  for (const c of candidates) {
    const exact = keys.find(function(k) { return normalizeName(k) === normalizeName(c); });
    if (exact && row[exact]) return row[exact];
  }
  for (const c of candidates) {
    const partial = keys.find(function(k) { return normalizeName(k).includes(normalizeName(c)); });
    if (partial && row[partial]) return row[partial];
  }
  return '';
}

function normalizeStatus(value) {
  const v = String(value || '').trim().toLowerCase();
  if (!v) return 'Pre-Review';
  if (['done', 'complete', 'completed', 'closed', '완료', '등록완료'].includes(v)) return 'Done';
  if (['corp. review', 'corp review', 'client review', '법인리뷰', '법인 리뷰'].includes(v)) return 'Corp. Review';
  if (['in progress', 'wip', 'working', '작업중', '진행중'].includes(v)) return 'In Progress';
  if (['cancel', 'cancelled', 'canceled', '취소'].includes(v)) return 'Cancel';
  if (['pre-review', 'pre review', 'pre review ', '사전검토', '사전 검토'].includes(v)) return 'Pre-Review';
  return 'Pre-Review';
}

function calcStats(items) {
  const stats = emptyStats();
  (items || []).forEach(function(item) {
    const status = item.overall || item.status || 'Pre-Review';
    if (stats[status] == null) stats[status] = 0;
    stats[status] += 1;
    stats.Total += 1;
  });
  return stats;
}

function normalizeName(value) { return String(value || '').toLowerCase().replace(/[\s_\-/.]+/g, ' ').trim(); }
function cleanText(value) { return String(value == null ? '' : value).replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim(); }
function stripTags(html) { return String(html || '').replace(/<[^>]*>/g, ' '); }
function decodeHtmlEntities(text) {
  const el = document.createElement('textarea');
  el.innerHTML = String(text || '');
  return el.value;
}
function safeSheetKey(name, index) {
  let key = String(name || '').trim().toLowerCase().replace(/[^a-z0-9가-힣]+/g, '_').replace(/^_+|_+$/g, '');
  if (!key) key = 'sheet_' + (index + 1);
  if (/^\d/.test(key)) key = 'sheet_' + key;
  return key;
}
function escapeHtmlForLoader(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function escapeAttrForLoader(value) { return escapeHtmlForLoader(value); }
