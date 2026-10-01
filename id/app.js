'use strict';
// ID Dashboard — data/tickets.json(export_id_tickets.py 산출물)을 읽어 사이드바 탭(=티켓)과 본문을 그린다.
// /it 와 같은 chrome. 데이터는 정적 파일이므로 Jira 연결은 없다.

// 보드별 문구 — it-b2b/index.html 이 window.DASH_CONFIG 로 덮어쓴다(같은 app.js·style.css 공유).
var CFG = Object.assign({
  board: 'id',
  logoText: 'ID Dashboard', logoSub: 'Jira follow-up · ID 사업부',
  navAbbr: 'ID', title: 'ID 업무 현황', eyebrow: 'Jira follow-up · ID', heading: 'ID 업무 진행 현황',
  subject: 'ID 사업부 티켓', docTitle: 'LG ID Dashboard', dataPath: './data/tickets.json'
}, window.DASH_CONFIG || {});

var DATA = null;              // tickets.json 전체
var CATALOG = null;           // it-b2b/data/catalog.json — 모델 변동(메뉴는 숨김)
var CMS = null;               // it-b2b/data/cms-business.json — business 하위 IT 모델
var currentKey = 'overview';  // 'overview' | 'catalog' | 'cms' | 'id_npi' | 티켓 키
var stageFilter = '';         // Overview 단계 칩
var searchTerm = '';
var PARAM = 'ticket';

var $ = function (id) { return document.getElementById(id); };
var esc = function (v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
};

// ── 날짜 유틸 ────────────────────────────────────────────
function day(v) { return v && Number.isFinite(Date.parse(v)) ? new Date(v).toLocaleDateString('sv-SE') : ''; }
function daysSince(v) {
  // 달력 기준 일수 — 어제 22:56 코멘트는 "어제"여야 하므로 24시간 단위가 아니라 날짜 경계로 센다.
  if (!v || !Number.isFinite(Date.parse(v))) return null;
  var a = new Date(v); a.setHours(0, 0, 0, 0);
  var b = new Date(); b.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((b - a) / 86400000));
}
function daysUntil(v) {
  if (!v || !Number.isFinite(Date.parse(v))) return null;
  return Math.ceil((Date.parse(v + 'T23:59:59') - Date.now()) / 86400000);
}
function ago(v) {
  var d = daysSince(v);
  if (d == null) return '';
  if (d === 0) return '오늘';
  if (d === 1) return '어제';
  return d + '일 전';
}
function fmtDateTime(v) {
  if (!v || !Number.isFinite(Date.parse(v))) return '—';
  var d = new Date(v);
  return d.toLocaleDateString('sv-SE') + ' ' + d.toTimeString().slice(0, 5);
}

// ── 단계 판정 (프로토타입 dashboard.js 규칙 이식) ─────────
var STAGES = ['사전검토', '진행 중', '검토·승인', '응답 대기', '완료'];
function stageOf(t) {
  if (t.statusCategory === 'done') return '완료';
  if (/HOLD|CLARIFICATION|RESPONSE/i.test(t.status)) return '응답 대기';
  if (/APPROVAL|REVIEW/i.test(t.status)) return '검토·승인';
  if (/PRE.?CHECK|OPEN|NEW|CREATE|TO DO/i.test(t.status)) return '사전검토';
  return '진행 중';
}
function isDone(t) { return t.statusCategory === 'done'; }
function jiraStatusAppearance(t) {
  if (t.statusCategory === 'done') return 'jira-done';
  if (t.statusCategory === 'new') return 'jira-new';
  return 'jira-progress';
}
function statusRank(status, category) {
  var rank = {
    'OPEN': 10, 'TO DO': 11, 'PRE-CHECK': 20, 'IN PROGRESS': 30,
    'WAITING FOR SUB APPROVAL': 40, 'ON HOLD (RESPONSE)': 50,
    'RESOLVED / CLOSED': 80, 'REJECTED': 90
  }[status];
  if (rank != null) return rank;
  if (category === 'new') return 15;
  if (category === 'done') return 85;
  return 45;
}
function isOverdue(t) { var d = daysUntil(t.due); return d != null && d < 0 && !isDone(t); }
function isStale(t) { var d = daysSince(t.updated); return d != null && d >= 7 && !isDone(t); }

function tickets() { return (DATA && DATA.tickets) || []; }
function shortName(name) { return String(name || '').split('/')[0].trim() || name || ''; }
function shortTitle(title) {
  return String(title || '').replace(/^\s*(\[[^\]]*\]\s*|\(IT\s*B2B\)\s*|IT\s*B2B\s*\)\s*|ID사업부\s*|ID\s*\)\s*|Medical\s*\)\s*)+/i, '').trim() || title || '';
}
function findTicket(key) {
  key = String(key || '').trim().toUpperCase();
  for (var i = 0; i < tickets().length; i++) if (tickets()[i].key.toUpperCase() === key) return tickets()[i];
  return null;
}

// ── 사이드바 ─────────────────────────────────────────────
function navSectionCollapsed(id) {
  try { return localStorage.getItem(CFG.board + '-nav-collapsed:' + id) === '1'; } catch (e) { return false; }
}
function toggleNavSection(id) {
  var label = document.querySelector('.sb-section-label-toggle[data-section="' + id + '"]');
  var body = document.querySelector('.sb-section-body[data-section="' + id + '"]');
  if (!label || !body) return;
  var collapsed = !body.classList.contains('is-collapsed');
  body.classList.toggle('is-collapsed', collapsed);
  label.classList.toggle('is-collapsed', collapsed);
  label.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  try { localStorage.setItem(CFG.board + '-nav-collapsed:' + id, collapsed ? '1' : '0'); } catch (e) { /* ignore */ }
}

function ticketKeyOrder(a, b) {
  var ak = String(a.key || '').split('-');
  var bk = String(b.key || '').split('-');
  var proj = ak[0].localeCompare(bk[0]);
  if (proj) return proj;
  return (parseInt(ak[1], 10) || 0) - (parseInt(bk[1], 10) || 0);
}

function renderSidebar() {
  var all = tickets();
  var byStatus = {};
  all.forEach(function (t) {
    var name = t.status || 'UNKNOWN';
    if (!byStatus[name]) byStatus[name] = [];
    byStatus[name].push(t);
  });
  var statuses = Object.keys(byStatus).sort(function (a, b) {
    var sampleA = byStatus[a][0];
    var sampleB = byStatus[b][0];
    var ra = statusRank(a, sampleA.statusCategory);
    var rb = statusRank(b, sampleB.statusCategory);
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });
  var html = [];
  html.push('<div class="sb-section-label">Overview</div>');
  html.push('<div class="nav-item' + (currentKey === 'overview' ? ' active' : '') + '" data-key="overview" data-abbr="' + esc(CFG.navAbbr) + '" onclick="switchTicket(this)" title="' + esc(CFG.title) + '">' +
    '<span class="ni-text">' + esc(CFG.title) + '</span><span class="ni-badge ni-badge-muted" id="navTotalBadge">' + all.length + '</span></div>');
  if (CFG.board === 'it-b2b') {
    var cmsCount = CMS && CMS.totalModels != null ? CMS.totalModels : '…';
    html.push('<div class="sb-section-label" style="margin-top:10px">CMS</div>');
    html.push('<div class="nav-item' + (currentKey === 'cms' ? ' active' : '') + '" data-key="cms" data-abbr="CMS" onclick="switchTicket(this)" title="Business 하위 IT 모델">' +
      '<span class="ni-text">Business CMS</span><span class="ni-badge ni-badge-muted">' + cmsCount + '</span></div>');
  }

  function section(label, id, list, collapsible, appearance) {
    if (!list.length) return;
    var collapsed = collapsible && navSectionCollapsed(id);
    var dot = '<span class="sb-status-dot ' + appearance + '" aria-hidden="true"></span>';
    if (collapsible) {
      html.push('<div class="sb-section-label sb-status sb-section-label-toggle' + (collapsed ? ' is-collapsed' : '') + '" style="margin-top:10px" role="button" tabindex="0" ' +
        'data-section="' + esc(id) + '" aria-expanded="' + (collapsed ? 'false' : 'true') + '" onclick="toggleNavSection(\'' + esc(id) + '\')" ' +
        'onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();toggleNavSection(\'' + esc(id) + '\')}">' +
        '<span class="sb-section-caret" aria-hidden="true">▾</span>' + dot + esc(label) + ' <span class="sb-section-count">(' + list.length + ')</span></div>');
      html.push('<div class="sb-section-body' + (collapsed ? ' is-collapsed' : '') + '" data-section="' + esc(id) + '">');
    } else {
      html.push('<div class="sb-section-label sb-status" style="margin-top:10px">' + dot + esc(label) +
        ' <span class="sb-section-count">(' + list.length + ')</span></div>');
    }
    list.forEach(function (t) {
      var abbr = t.key.replace(/^[A-Z]+-/, '');
      html.push('<div class="nav-item' + (currentKey === t.key ? ' active' : '') + '" data-key="' + esc(t.key) + '" data-abbr="' + esc(abbr) + '" ' +
        'data-search="' + esc((t.key + ' ' + (t.title || '') + ' ' + (t.assignee || '')).toLowerCase()) + '" onclick="switchTicket(this)" title="' + esc(t.key + (t.title ? ' · ' + t.title : '')) + '">' +
        '<span class="ni-text"><span class="ni-key">' + esc(t.key) + '</span>' + (t.title ? '<span class="ni-title">' + esc(shortTitle(t.title)) + '</span>' : '') + '</span>' +
        '<span class="ni-badge ' + jiraStatusAppearance(t) + '" title="' + esc(t.status) + '">' + esc(t.status) + '</span></div>');
    });
    if (collapsible) html.push('</div>');
  }
  statuses.forEach(function (name) {
    var list = byStatus[name].slice().sort(ticketKeyOrder);
    var sample = list[0];
    var done = isDone(sample);
    var label = done && DATA.doneDays ? name + ' · ' + DATA.doneDays + 'd' : name;
    section(label, 'status:' + name, list, done, jiraStatusAppearance(sample));
  });
  if (CFG.board === 'id') {
    html.push('<div class="sb-section-label" style="margin-top:10px">NPI</div>');
    html.push('<div class="nav-item' + (currentKey === 'id_npi' ? ' active' : '') + '" data-key="id_npi" data-abbr="NPI" onclick="switchTicket(this)" title="ID NPI 현황">' +
      '<span class="ni-text">ID NPI 현황</span><span class="ni-badge ni-badge-muted">NPI</span></div>');
  }
  if (!all.length) html.push('<div class="sb-empty">표시할 티켓이 없습니다.</div>');
  $('ticketNavList').innerHTML = html.join('');
  applySearchToNav();
}

function stageShort(t) {
  return { '사전검토': '사전검토', '진행 중': '진행', '검토·승인': '승인대기', '응답 대기': '응답대기', '완료': '완료' }[stageOf(t)];
}

// ── 탭 전환 / 딥링크 ─────────────────────────────────────
function switchTicket(el) {
  var key = el && el.dataset ? el.dataset.key : el;
  selectKey(key);
  if (window.innerWidth <= 768) closeMobileSidebar();
}
function customKey(key) {
  if (CFG.board === 'id' && key === 'id_npi') return 'id_npi';
  if (CFG.board === 'it-b2b' && (key === 'catalog' || key === 'cms')) return key;
  return '';
}
function selectKey(key) {
  var custom = customKey(key);
  currentKey = custom || (findTicket(key) ? findTicket(key).key : 'overview');
  document.querySelectorAll('.nav-item[data-key]').forEach(function (n) {
    n.classList.toggle('active', n.dataset.key === currentKey);
  });
  renderContent();
  syncUrl();
}
function initialKeyFromUrl() {
  try {
    var params = new URLSearchParams(window.location.search);
    if (CFG.board === 'id' && (params.get('npi') === '1' || params.get('view') === 'npi')) return 'id_npi';
    if (CFG.board === 'it-b2b' && params.get('view') === 'catalog') return 'catalog';
    if (CFG.board === 'it-b2b' && params.get('view') === 'cms') return 'cms';
    var raw = params.get(PARAM) || '';
    if (!raw) return 'overview';
    var t = findTicket(raw);
    if (!t) {
      // 번호만 들어온 경우(?ticket=1373)도 받아준다
      var byNum = tickets().filter(function (x) { return x.key.split('-')[1] === raw.replace(/\D/g, ''); });
      if (byNum.length === 1) return byNum[0].key;
      console.warn('[deeplink] ?ticket=' + raw + ' 에 해당하는 티켓이 없어 Overview를 엽니다.');
      return 'overview';
    }
    return t.key;
  } catch (e) { return 'overview'; }
}
function syncUrl() {
  try {
    var params = new URLSearchParams(window.location.search);
    params.delete('npi');
    params.delete('view');
    if (currentKey === 'id_npi') {
      params.delete(PARAM);
      params.set('npi', '1');
    } else if (currentKey === 'catalog' || currentKey === 'cms') {
      params.delete(PARAM);
      params.set('view', currentKey);
    } else if (currentKey === 'overview') {
      params.delete(PARAM);
    } else {
      params.set(PARAM, currentKey);
    }
    var qs = params.toString();
    var next = window.location.pathname + (qs ? '?' + qs : '') + window.location.hash;
    if (next !== window.location.pathname + window.location.search + window.location.hash) {
      window.history.replaceState(window.history.state, '', next);
    }
  } catch (e) { /* file:// 등 */ }
}
function copyTicketLink() {
  syncUrl();
  var text = window.location.href;
  var done = function () { toast('링크를 복사했습니다'); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
  else { fallbackCopy(text); done(); }
}
function fallbackCopy(text) {
  var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) { /* ignore */ } document.body.removeChild(ta);
}
var toastTimer = null;
function toast(msg) {
  var el = $('toast'); el.textContent = msg; el.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.hidden = true; }, 1800);
}

// ── 검색 (사이드바 필터) ─────────────────────────────────
function onSearchInput(v) {
  searchTerm = String(v || '').trim().toLowerCase();
  applySearchToNav();
  if (currentKey === 'overview' || currentKey === 'catalog') renderContent();
}
function applySearchToNav() {
  document.querySelectorAll('.nav-item[data-search]').forEach(function (n) {
    n.classList.toggle('is-hidden', !!searchTerm && n.dataset.search.indexOf(searchTerm) < 0);
  });
}

// ── 본문 ─────────────────────────────────────────────────
function renderContent() {
  var wrapEl = $('contentWrap');
  if (wrapEl) wrapEl.classList.toggle('cms-url-lib', currentKey === 'cms');
  var search = $('ticketSearch');
  if (search) {
    var modelSearch = currentKey === 'catalog';
    search.placeholder = modelSearch ? '모델, 국가 검색' : '티켓 번호, 제목, 담당자 검색';
    search.setAttribute('aria-label', modelSearch ? '모델 검색' : '티켓 검색');
  }
  if (currentKey === 'id_npi') { renderIdNpi(); return; }
  if (currentKey === 'catalog') { renderCatalog(); return; }
  if (currentKey === 'cms') { renderCms(); return; }
  var wrap = $('contentWrap');
  var t = currentKey === 'overview' ? null : findTicket(currentKey);
  $('topTitle').textContent = t ? (t.title ? t.key + ' · ' + shortTitle(t.title) : t.key) : CFG.title;
  var jira = $('topJiraLink');
  if (t) { jira.href = t.url; jira.style.display = 'inline-flex'; } else { jira.style.display = 'none'; }
  wrap.innerHTML = t ? renderTicket(t) : renderOverview();
  document.title = (t ? t.key + ' · ' : '') + CFG.docTitle;
}

var _idNpiBundle = null;
var _idNpiMonth = '';

function renderIdNpi() {
  var wrap = $('contentWrap');
  $('topTitle').textContent = 'ID NPI 현황';
  $('topJiraLink').style.display = 'none';
  document.title = 'ID NPI 현황 · ' + CFG.docTitle;
  if (typeof npiWeeklyReportHtml !== 'function') {
    wrap.innerHTML = '<div class="card">NPI 현황 모듈을 불러오지 못했습니다.</div>';
    return;
  }
  if (!_idNpiBundle) {
    wrap.innerHTML = '<div class="card">ID NPI 현황을 불러오는 중입니다.</div>';
    var bust = window.__BUILD_V || Date.now();
    Promise.all([
      fetch('../it/data/npi.json?v=' + bust).then(function (r) { if (!r.ok) throw new Error('npi.json HTTP ' + r.status); return r.json(); }),
      fetch('../it/data/npi-weekly-cut.json?v=' + bust).then(function (r) { if (!r.ok) throw new Error('weekly cut HTTP ' + r.status); return r.json(); }),
    ]).then(function (pair) {
      _idNpiBundle = { registration: pair[0], weeklyCut: pair[1] };
      if (currentKey === 'id_npi') renderIdNpi();
    }).catch(function (e) {
      wrap.innerHTML = '<div class="notice">ID NPI 데이터를 불러오지 못했습니다 (' + esc(e.message) + ').</div>';
    });
    return;
  }
  wrap.innerHTML = npiWeeklyReportHtml({
    dept: 'ID',
    month: _idNpiMonth,
    registration: _idNpiBundle.registration,
    weeklyCut: _idNpiBundle.weeklyCut,
  });
}

function npiWeeklySetMonth(value) {
  _idNpiMonth = value || '';
  if (currentKey === 'id_npi') renderIdNpi();
}

function catalogChangeCount(payload) {
  var n = 0;
  ((payload && payload.catalogs) || []).forEach(function (c) {
    var ch = c.change || {};
    n += (ch.added || []).length + (ch.removed || []).length + (ch.renamed || []).length;
  });
  return n;
}
function loadCatalog() {
  fetch('./data/catalog.json?v=' + Date.now(), { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (json) {
      CATALOG = json;
      renderSidebar();
      if (currentKey === 'catalog') renderCatalog();
    })
    .catch(function (e) {
      if (currentKey === 'catalog') {
        $('contentWrap').innerHTML = '<div class="notice">모델 목록을 불러오지 못했습니다 (' + esc(e.message) + ').</div>';
      }
    });
}
function setCatalog(id) {
  window.__catId = id || 'laptops';
  if (currentKey === 'catalog') renderCatalog();
}
function renderCatalog() {
  var wrap = $('contentWrap');
  $('topTitle').textContent = '모델 변동';
  $('topJiraLink').style.display = 'none';
  document.title = '모델 변동 · ' + CFG.docTitle;
  if (!CATALOG) {
    wrap.innerHTML = '<div class="card">모델 목록을 불러오는 중입니다.</div>';
    return;
  }
  var catalogs = CATALOG.catalogs || [];
  var activeId = window.__catId || (catalogs[0] && catalogs[0].id) || 'laptops';
  var cat = catalogs.filter(function (c) { return c.id === activeId; })[0] || catalogs[0];
  if (!cat) {
    wrap.innerHTML = '<div class="notice">표시할 카탈로그가 없습니다.</div>';
    return;
  }
  var change = cat.change || {};
  var added = change.added || [];
  var removed = change.removed || [];
  var renamed = change.renamed || [];
  var models = (cat.models || []).filter(function (m) {
    if (!searchTerm) return true;
    return (m.sku + ' ' + m.name + ' ' + m.category).toLowerCase().indexOf(searchTerm) >= 0;
  });
  var html = [];
  html.push('<div class="card">');
  html.push('<div class="eyebrow">Global B2B · view all</div>');
  html.push('<div class="ov-head"><div><div class="h1">' + esc(cat.label) + '</div>');
  html.push('<div class="sub">평일 09:20 · 16:20에 목록을 다시 받아 비교합니다. 마지막 점검 ' + esc(fmtDateTime(CATALOG.checkedAt)) + '</div></div>');
  html.push('<div class="ov-total"><div class="ov-total-label">모델</div><div class="ov-total-num">' + cat.total + '</div></div></div>');
  html.push('<div class="kpi-row">');
  html.push('<div class="kpi"><b class="delta-add">' + added.length + '</b><span>이번 추가</span></div>');
  html.push('<div class="kpi-div"></div>');
  html.push('<div class="kpi"><b class="delta-remove">' + removed.length + '</b><span>이번 빠짐</span></div>');
  html.push('<div class="kpi-div"></div>');
  html.push('<div class="kpi"><b>' + renamed.length + '</b><span>이름 변경</span></div>');
  html.push('</div>');
  html.push('<div class="chips">');
  catalogs.forEach(function (c) {
    html.push('<button type="button" class="chip" aria-pressed="' + (c.id === cat.id ? 'true' : 'false') + '" onclick="setCatalog(\'' + esc(c.id) + '\')">' + esc(c.label) + '<b>' + c.total + '</b></button>');
  });
  html.push('<a class="chip" href="' + esc(cat.pageUrl) + '" target="_blank" rel="noopener">페이지 열기 ↗</a>');
  html.push('</div></div>');

  if (!added.length && !removed.length && !renamed.length && !(cat.history || []).length) {
    html.push('<div class="alert info">첫 기준입니다. 다음 점검부터 추가되거나 빠진 모델이 여기 표시됩니다.</div>');
  }
  if (added.length || removed.length || renamed.length) {
    html.push('<div class="card"><div class="card-title">이번 점검에서 바뀐 모델</div>');
    function lines(title, list, cls) {
      if (!list.length) return;
      html.push('<div class="card-title" style="margin-top:8px">' + esc(title) + '</div><div class="pill-row">');
      list.forEach(function (m) {
        var label = m.sku + (m.name ? ' · ' + m.name : '');
        if (m.before) label = m.sku + ' · ' + m.before + ' → ' + m.after;
        html.push('<span class="pill ' + cls + '">' + esc(label) + '</span>');
      });
      html.push('</div>');
    }
    lines('추가', added, 'delta-add');
    lines('빠짐', removed, 'delta-remove');
    lines('이름', renamed, '');
    html.push('</div>');
  }
  var past = (cat.history || []).slice(0, 5);
  if (past.length && !added.length && !removed.length && !renamed.length) {
    html.push('<div class="card"><div class="card-title">최근 변동 <small>이번 점검은 그대로입니다</small></div>');
    past.forEach(function (h) {
      html.push('<div class="sub" style="margin-bottom:8px">' + esc(fmtDateTime(h.at)) + ' · 추가 ' + (h.added || []).length + ' · 빠짐 ' + (h.removed || []).length + '</div>');
    });
    html.push('</div>');
  }

  html.push('<div class="card"><div class="section-bar"><h2>현재 목록 ' + models.length + '건</h2></div>');
  html.push('<div class="table-wrap"><table class="cat-table"><thead><tr><th>모델</th><th>분류</th><th>이름</th><th>출시</th></tr></thead><tbody>');
  if (!models.length) html.push('<tr><td class="t-empty" colspan="4">해당하는 모델이 없습니다.</td></tr>');
  models.forEach(function (m) {
    var sku = m.url ? '<a class="cat-sku" href="' + esc(m.url) + '" target="_blank" rel="noopener">' + esc(m.sku) + '</a>' : '<span class="cat-sku">' + esc(m.sku) + '</span>';
    html.push('<tr><td>' + sku + '</td><td>' + esc(m.category || '—') + '</td><td><div class="t-title">' + esc(m.name || '—') + '</div></td><td class="t-num">' + esc(m.released || '—') + '</td></tr>');
  });
  html.push('</tbody></table></div></div>');
  wrap.innerHTML = html.join('');
}

var CMS_LIB_PAGE = 50;
var CMS_LIB_DEFAULT = { search: '', category: '', status: 'ACTIVE', locale: '', page: 1 };
var _cmsLibFilter = { search: '', category: '', status: 'ACTIVE', locale: '', page: 1 };
var _cmsLibView = 'model';
var _cmsLibOpen = null;
var _cmsLibCountryQuery = '';
var _cmsLibLocaleIndex = null;
var _cmsLibCountryMeta = {};
var _cmsLibSearchTimer = null;
var CMS_LIB_SEARCH_ICON = '<svg class="dash-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>';
var CMS_DEFAULT_LANG = {
  ae: 'en', bd: 'en', br: 'pt', cac: 'es', cl: 'es', co: 'es', de: 'de', es: 'es',
  fr: 'fr', hk: 'zh', id: 'id', in: 'en', it: 'it', jp: 'ja', mx: 'es', nl: 'nl',
  pe: 'es', pl: 'pl', ru: 'ru', sa: 'ar', sg: 'en', th: 'th', uk: 'en', za: 'en'
};

function cmsNormalizeLocale(loc) {
  if (!loc || String(loc.locale || '').indexOf(' : ') >= 0) {
    if (loc && !loc.prodUrl) loc.prodUrl = loc.url || '';
    return;
  }
  var slug = String(loc.locale || '').toLowerCase().replace(/-/g, '_');
  var parts = slug.split('_').filter(Boolean);
  var base = (parts[0] || '').toUpperCase();
  if (base === 'GB') base = 'UK';
  var lang = parts.length > 1 ? parts[1] : (CMS_DEFAULT_LANG[parts[0]] || '');
  var token = parts.length > 1 ? (base + '_' + String(parts[1]).toUpperCase()) : base;
  loc.locale = lang ? (token + ' : ' + base + ' (' + lang + ')') : token;
  loc.country = lang ? (token + ' : ' + base + ' (' + lang.toUpperCase() + ')') : token;
  loc.prodUrl = loc.url || loc.prodUrl || '';
}
function loadCms() {
  fetch('./data/cms-business.json?v=' + (window.__BUILD_V || Date.now()), { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (json) {
      (json.models || []).forEach(function (model) {
        model.salesModelCode = model.salesModelCode || model.modelName || '';
        (model.locales || []).forEach(cmsNormalizeLocale);
      });
      CMS = json;
      _cmsLibLocaleIndex = null;
      _cmsLibCountryMeta = (typeof urlLibLocaleDisplayMap === 'function') ? urlLibLocaleDisplayMap(json.models || []) : {};
      renderSidebar();
      if (currentKey === 'cms') renderCms();
    })
    .catch(function (e) {
      if (currentKey === 'cms') {
        $('contentWrap').innerHTML = '<div class="notice">CMS 모델을 불러오지 못했습니다 (' + esc(e.message) + ').</div>';
      }
    });
}
function cmsLibUpdatedLabel(payload) {
  var match = /(20\d{2})(\d{2})(\d{2})/.exec((payload && payload.cmsSource) || '');
  return match ? match[1] + '-' + match[2] + '-' + match[3] : ((payload && payload.generatedAt) || '');
}
function cmsLibToggleClear(id, value) {
  var btn = document.getElementById(id);
  if (!btn) return;
  btn.classList.toggle('dash-search-clear-visible', !!value);
}
function cmsLibRenderSoon() {
  clearTimeout(_cmsLibSearchTimer);
  _cmsLibSearchTimer = setTimeout(cmsLibRenderResults, 150);
}
function urlLibAllLocaleTokens(allModels) {
  var seen = {};
  var tokens = [];
  (allModels || []).forEach(function (model) {
    (model.locales || []).forEach(function (loc) {
      var token = urlLibLocaleToken(loc.locale);
      if (token && !seen[token]) { seen[token] = 1; tokens.push(token); }
    });
  });
  tokens.sort();
  return tokens;
}
function getUrlLibLocaleIndex() {
  if (!_cmsLibLocaleIndex && CMS && typeof buildUrlLibLocaleIndex === 'function') {
    _cmsLibLocaleIndex = buildUrlLibLocaleIndex(CMS.models || []);
  }
  return _cmsLibLocaleIndex || {};
}
function urlLibSetViewMode(mode) {
  _cmsLibView = mode;
  _cmsLibCountryQuery = '';
  window.__cmsCountry = '';
  renderCms();
}
function urlLibOnSearchInput(inputEl) {
  _cmsLibFilter.search = inputEl.value;
  _cmsLibFilter.page = 1;
  cmsLibToggleClear('urlLibSearchClear', inputEl.value);
  cmsLibRenderSoon();
}
function urlLibClearSearch() {
  var input = document.getElementById('urlLibSearchInput');
  if (input) input.value = '';
  _cmsLibFilter.search = '';
  _cmsLibFilter.page = 1;
  cmsLibToggleClear('urlLibSearchClear', '');
  cmsLibRenderResults();
  if (input) input.focus();
}
function urlLibOnCountryQueryInput(inputEl) {
  _cmsLibCountryQuery = inputEl.value;
  cmsLibToggleClear('urlLibCountryClear', inputEl.value);
  cmsLibRenderSoon();
}
function urlLibClearCountryQuery() {
  var input = document.getElementById('urlLibCountryQueryInput');
  if (input) input.value = '';
  _cmsLibCountryQuery = '';
  cmsLibToggleClear('urlLibCountryClear', '');
  cmsLibRenderResults();
  if (input) input.focus();
}
function urlLibSelectLocale(token) {
  window.__cmsCountry = window.__cmsCountry === token ? '' : token;
  cmsLibRenderResults();
}
function urlLibSetFilter(key, value) {
  if (key !== 'page') _cmsLibFilter.page = 1;
  _cmsLibFilter[key] = key === 'page' ? parseInt(value, 10) : value;
  cmsLibRenderResults();
}
function urlLibResetFilter() {
  _cmsLibFilter = { search: '', category: '', status: 'ACTIVE', locale: '', page: 1 };
  _cmsLibCountryQuery = '';
  var searchInput = document.getElementById('urlLibSearchInput');
  if (searchInput) searchInput.value = '';
  cmsLibToggleClear('urlLibSearchClear', '');
  var countryInput = document.getElementById('urlLibCountryQueryInput');
  if (countryInput) countryInput.value = '';
  cmsLibToggleClear('urlLibCountryClear', '');
  var categorySel = document.getElementById('urlLibCategorySelect');
  if (categorySel) categorySel.value = '';
  var statusSel = document.getElementById('urlLibStatusSelect');
  if (statusSel) statusSel.value = 'ACTIVE';
  var localeSel = document.getElementById('urlLibLocaleSelect');
  if (localeSel) localeSel.value = '';
  cmsLibRenderResults();
}
function toggleUrlLibModel(modelName) {
  _cmsLibOpen = _cmsLibOpen === modelName ? null : modelName;
  cmsLibRenderResults();
}
function urlLibDownloadExcel() {
  if (typeof XLSX === 'undefined') { alert('엑셀 라이브러리를 불러오지 못했습니다.'); return; }
  if (!CMS || !CMS.models) { alert('CMS 데이터가 아직 로드되지 않았습니다.'); return; }
  var models = urlLibSortModels(urlLibFilterModels(CMS.models, _cmsLibFilter), 'name');
  var aoa = [['Model', 'Sales Model Code', 'Category', 'Locale', 'Country', 'Status', 'Live URL']];
  models.forEach(function (m) {
    urlLibMatchedLocales(m, _cmsLibFilter).forEach(function (l) {
      aoa.push([
        m.modelName || '', m.salesModelCode || '', m.category || '',
        urlLibLocaleToken(l.locale), l.country || '', l.status || '', l.prodUrl || ''
      ]);
    });
  });
  if (aoa.length === 1) { alert('현재 필터 조건에 해당하는 URL이 없습니다.'); return; }
  var ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 22 }, { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 28 }, { wch: 14 }, { wch: 72 }];
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'URL Library');
  var f = _cmsLibFilter;
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['항목', '값'],
    ['CMS 소스', CMS.cmsSource || ''],
    ['카테고리', f.category || '전체'],
    ['상태', f.status || '전체'],
    ['로케일', f.locale || '전체'],
    ['검색어', f.search || ''],
    ['모델 수', models.length],
    ['URL 수', aoa.length - 1]
  ]), '추출 조건');
  var stamp = (String(CMS.cmsSource || '').match(/20\d{6}/) || ['export'])[0];
  XLSX.writeFile(wb, 'LG_Business_URL_Library_' + stamp + '.xlsx');
}
function renderCms() {
  var wrap = $('contentWrap');
  $('topTitle').textContent = 'Business CMS';
  $('topJiraLink').style.display = 'none';
  document.title = 'Business CMS · ' + CFG.docTitle;
  if (!CMS) {
    wrap.innerHTML = '<div class="url-lib-empty" role="status">CMS 모델을 불러오는 중입니다.</div>';
    return;
  }
  if (typeof urlLibFilterModels !== 'function') {
    wrap.innerHTML = '<div class="notice">URL 라이브러리 모듈을 불러오지 못했습니다.</div>';
    return;
  }
  var allModels = CMS.models || [];
  var categories = CMS.categories || [];
  var statusOptions = ['ACTIVE', 'DISCONTINUED', 'SUSPENDED', 'HIDDEN'];
  var localeTokens = urlLibAllLocaleTokens(allModels);
  var localeMeta = _cmsLibCountryMeta || {};
  var headerHtml = '<div style="padding:16px 24px 0;flex-shrink:0"><div class="ov-card-new">';
  headerHtml += '<div class="ov-head-new"><div class="ov-head-title">';
  headerHtml += '<div class="ov-head-eyebrow">Live URL Library · Business IT</div>';
  headerHtml += '<div class="ov-head-name">제품별 Live URL 모음집</div>';
  headerHtml += '</div>';
  headerHtml += '<div class="ov-head-total"><div class="ov-head-total-num ov-head-total-sites">';
  headerHtml += '<strong>' + allModels.length.toLocaleString() + '</strong>개 모델 · ';
  headerHtml += '<strong>' + (CMS.totalUrls || 0).toLocaleString() + '</strong>개 URL';
  var updated = cmsLibUpdatedLabel(CMS);
  if (updated) headerHtml += '<span style="color:#94A3B8;font-size:var(--fs-caption);font-weight:500;margin-left:8px">업데이트: ' + esc(updated) + '</span>';
  headerHtml += '</div></div></div>';
  headerHtml += '<div class="url-lib-view-tabs">';
  headerHtml += '<button type="button" class="url-lib-view-tab' + (_cmsLibView === 'model' ? ' url-lib-view-tab-active' : '') + '" aria-pressed="' + (_cmsLibView === 'model' ? 'true' : 'false') + '" onclick="urlLibSetViewMode(\'model\')">모델별</button>';
  headerHtml += '<button type="button" class="url-lib-view-tab' + (_cmsLibView === 'country' ? ' url-lib-view-tab-active' : '') + '" aria-pressed="' + (_cmsLibView === 'country' ? 'true' : 'false') + '" onclick="urlLibSetViewMode(\'country\')">국가별</button>';
  headerHtml += '</div>';
  headerHtml += '<div class="url-lib-filter-bar">';
  if (_cmsLibView === 'country') {
    headerHtml += '<div class="dash-search">' + CMS_LIB_SEARCH_ICON;
    headerHtml += '<input id="urlLibCountryQueryInput" class="dash-search-input" type="text" aria-label="국가명 또는 로케일 검색" placeholder="국가명 또는 로케일 검색 (예: Spain, ES)..." value="' + esc(_cmsLibCountryQuery) + '" oninput="urlLibOnCountryQueryInput(this)">';
    headerHtml += '<button type="button" class="dash-search-clear' + (_cmsLibCountryQuery ? ' dash-search-clear-visible' : '') + '" id="urlLibCountryClear" onclick="urlLibClearCountryQuery()" aria-label="Clear search">&times;</button></div>';
  } else {
    headerHtml += '<div class="dash-search">' + CMS_LIB_SEARCH_ICON;
    headerHtml += '<input id="urlLibSearchInput" class="dash-search-input" type="text" aria-label="Search model or code" placeholder="Search model or code..." value="' + esc(_cmsLibFilter.search) + '" oninput="urlLibOnSearchInput(this)">';
    headerHtml += '<button type="button" class="dash-search-clear' + (_cmsLibFilter.search ? ' dash-search-clear-visible' : '') + '" id="urlLibSearchClear" onclick="urlLibClearSearch()" aria-label="Clear search">&times;</button></div>';
  }
  headerHtml += '<select class="url-lib-select" id="urlLibCategorySelect"' + urlLibSelectA11y('Category filter') + ' onchange="urlLibSetFilter(\'category\',this.value)">';
  headerHtml += '<option value="">All Categories</option>';
  categories.forEach(function (cat) {
    headerHtml += '<option value="' + esc(cat) + '"' + (_cmsLibFilter.category === cat ? ' selected' : '') + '>' + esc(cat) + '</option>';
  });
  headerHtml += '</select>';
  headerHtml += '<select class="url-lib-select" id="urlLibStatusSelect"' + urlLibSelectA11y('Status filter') + ' onchange="urlLibSetFilter(\'status\',this.value)">';
  headerHtml += '<option value="">All Status</option>';
  statusOptions.forEach(function (s) {
    headerHtml += '<option value="' + s + '"' + (_cmsLibFilter.status === s ? ' selected' : '') + '>' + s + '</option>';
  });
  headerHtml += '</select>';
  if (_cmsLibView !== 'country') {
    headerHtml += '<select class="url-lib-select" id="urlLibLocaleSelect"' + urlLibSelectA11y('Country filter') + ' onchange="urlLibSetFilter(\'locale\',this.value)">';
    headerHtml += '<option value="">All Countries</option>';
    localeTokens.forEach(function (token) {
      var lm = localeMeta[token] || {};
      var label = token + ' — ' + urlLibLocaleDisplayName(token, lm.lang, lm.withLang);
      headerHtml += '<option value="' + esc(token) + '"' + (_cmsLibFilter.locale === token ? ' selected' : '') + '>' + esc(label) + '</option>';
    });
    headerHtml += '</select>';
    headerHtml += '<button type="button" class="url-lib-page-btn" id="urlLibResetBtn" onclick="urlLibResetFilter()">Reset</button>';
  }
  headerHtml += '</div></div></div><div id="urlLibResults"></div>';
  wrap.innerHTML = headerHtml;
  cmsLibRenderResults();
}
function cmsLibRenderResults() {
  var resultsEl = document.getElementById('urlLibResults');
  if (!resultsEl || !CMS) return;
  if (_cmsLibView === 'country') cmsLibRenderCountry();
  else cmsLibRenderModels();
}
function cmsLibStatusClass(status) {
  if (status === 'ACTIVE') return 'url-lib-status-active';
  if (status === 'DISCONTINUED') return 'url-lib-status-disc';
  return 'url-lib-status-other';
}
function cmsLibRenderModels() {
  var wrap = document.getElementById('urlLibResults');
  if (!wrap) return;
  var filtered = urlLibSortModels(urlLibFilterModels(CMS.models || [], _cmsLibFilter), 'name');
  var pageInfo = urlLibPaginate(filtered, _cmsLibFilter.page, CMS_LIB_PAGE);
  var page = pageInfo.page;
  var html = '<div style="padding:12px 24px">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px">';
  html += '<div style="color:#64748B;font-size:var(--fs-caption);font-weight:500">' + filtered.length.toLocaleString() + '개 모델</div>';
  html += '<button type="button" id="urlLibExcelBtn" onclick="urlLibDownloadExcel()" title="현재 필터 조건 그대로 내보냅니다" style="cursor:pointer;border:1px solid #CBD5E1;background:#fff;color:#334155;border-radius:8px;padding:5px 12px;font-size:var(--fs-caption);font-weight:700;font-family:inherit">⬇ Excel Download</button>';
  html += '</div>';
  if (!filtered.length) {
    wrap.innerHTML = html + urlLibEmptyStateMarkup('조건에 맞는 모델이 없습니다.') + '</div>';
    return;
  }
  html += '<div class="url-lib-model-list">';
  pageInfo.pageItems.forEach(function (model, modelIndex) {
    var open = _cmsLibOpen === model.modelName;
    var shown = urlLibMatchedLocales(model, _cmsLibFilter);
    var activeCount = shown.filter(function (l) { return l.status === 'ACTIVE'; }).length;
    var detailId = 'urlLibModelDetail-' + page + '-' + modelIndex;
    html += '<div class="url-lib-model-row' + (open ? ' url-lib-model-row-active' : '') + '">';
    html += '<button type="button" class="url-lib-model-main" data-mk="' + esc(model.modelName) + '" aria-expanded="' + (open ? 'true' : 'false') + '" aria-controls="' + detailId + '" onclick="toggleUrlLibModel(this.getAttribute(\'data-mk\'))">';
    html += '<span class="url-lib-model-identity"><span class="url-lib-model-name">' + esc(model.modelName) + '</span>';
    html += '<span class="url-lib-model-cat">' + esc(model.category) + '</span></span>';
    html += '<span class="url-lib-model-stats">';
    html += '<span style="font-size:var(--fs-caption);color:#10B981;font-weight:700">ACTIVE ' + activeCount + '</span>';
    html += '<span style="font-size:var(--fs-caption);color:#64748B">' + urlLibCountryCount({ locales: shown }) + '개국 · ' + shown.length + '개 사이트</span>';
    html += '<span style="color:#94A3B8">' + (open ? '▲' : '▼') + '</span></span></button>';
    if (open) {
      html += '<div class="url-lib-detail-table" id="' + detailId + '"><table class="url-lib-table"><thead><tr>';
      html += '<th>Locale</th><th>Country</th><th>Status</th><th>Live URL</th></tr></thead><tbody>';
      shown.forEach(function (loc) {
        var displayUrl = urlLibDisplayUrl(loc.prodUrl);
        html += '<tr><td><span class="url-lib-locale-badge">' + esc(String(loc.locale || '').toUpperCase()) + '</span></td>';
        html += '<td style="color:#334155">' + esc(loc.country || loc.locale) + '</td>';
        html += '<td><span class="' + cmsLibStatusClass(loc.status) + '">' + esc(loc.status) + '</span></td>';
        html += '<td><a class="url-lib-url-link" href="' + esc(loc.prodUrl) + '" target="_blank" rel="noopener" title="' + esc(loc.prodUrl) + '">' + esc(displayUrl) + '</a></td></tr>';
      });
      html += '</tbody></table></div>';
    }
    html += '</div>';
  });
  html += '</div>';
  if (pageInfo.totalPages > 1) {
    html += '<div class="url-lib-pagination">';
    html += '<button class="url-lib-page-btn" ' + (page <= 1 ? 'disabled' : '') + ' onclick="urlLibSetFilter(\'page\',' + (page - 1) + ')">← 이전</button>';
    html += '<span style="color:#64748B;font-size:var(--fs-caption)">' + page + ' / ' + pageInfo.totalPages + '</span>';
    html += '<button class="url-lib-page-btn" ' + (page >= pageInfo.totalPages ? 'disabled' : '') + ' onclick="urlLibSetFilter(\'page\',' + (page + 1) + ')">다음 →</button>';
    html += '</div>';
  }
  html += '</div>';
  wrap.innerHTML = html;
}
function cmsLibRenderCountry() {
  var wrap = document.getElementById('urlLibResults');
  if (!wrap) return;
  var index = getUrlLibLocaleIndex();
  var tokens = Object.keys(index);
  var selected = window.__cmsCountry || '';
  function filteredModelsFor(token) {
    return (index[token] || []).filter(function (entry) {
      if (_cmsLibFilter.category && entry.category !== _cmsLibFilter.category) return false;
      if (_cmsLibFilter.status && entry.status !== _cmsLibFilter.status) return false;
      return true;
    });
  }
  if (!selected) {
    var matched = tokens.filter(function (t) { return urlLibLocaleMatchesQuery(t, _cmsLibCountryQuery); });
    var countByToken = {};
    matched.forEach(function (token) { countByToken[token] = filteredModelsFor(token).length; });
    matched.sort(function (a, b) { return countByToken[b] - countByToken[a]; });
    var html = '<div style="padding:12px 24px">';
    if (!matched.length) {
      wrap.innerHTML = html + urlLibEmptyStateMarkup('조건에 맞는 국가가 없습니다.') + '</div>';
      return;
    }
    html += '<div style="color:#64748B;font-size:var(--fs-caption);font-weight:500;margin-bottom:8px">국가를 검색하거나 아래에서 선택하세요</div>';
    html += '<div class="url-lib-country-grid">';
    matched.forEach(function (token) {
      var cm = _cmsLibCountryMeta[token] || {};
      html += '<button type="button" class="url-lib-country-card" data-token="' + esc(token) + '" onclick="urlLibSelectLocale(this.getAttribute(\'data-token\'))">';
      html += '<span class="url-lib-country-name">' + esc(urlLibLocaleDisplayName(token, cm.lang, cm.withLang)) + '</span>';
      html += '<span class="url-lib-country-token">' + esc(token) + '</span>';
      html += '<span class="url-lib-country-count">' + countByToken[token].toLocaleString() + '개 제품</span></button>';
    });
    html += '</div></div>';
    wrap.innerHTML = html;
    return;
  }
  var entries = filteredModelsFor(selected).slice().sort(function (a, b) {
    return a.category.localeCompare(b.category) || a.modelName.localeCompare(b.modelName);
  });
  var catCounts = {};
  entries.forEach(function (e) { catCounts[e.category] = (catCounts[e.category] || 0) + 1; });
  var catSummary = Object.keys(catCounts).sort().map(function (c) { return c + ' ' + catCounts[c]; }).join(' · ');
  var sm = _cmsLibCountryMeta[selected] || {};
  var html2 = '<div style="padding:12px 24px">';
  html2 += '<button type="button" class="url-lib-country-back" data-token="' + esc(selected) + '" onclick="urlLibSelectLocale(this.getAttribute(\'data-token\'))">← 국가 목록으로</button>';
  html2 += '<div class="ov-head-total-num ov-head-total-sites" style="margin:8px 0">';
  html2 += esc(urlLibLocaleDisplayName(selected, sm.lang, sm.withLang)) + ' (' + esc(selected) + ') · <strong>' + entries.length.toLocaleString() + '</strong>개 IT 제품 라이브';
  if (catSummary) html2 += '<span style="color:#94A3B8;font-size:var(--fs-caption);font-weight:500;margin-left:8px">(' + esc(catSummary) + ')</span>';
  html2 += '</div>';
  if (!entries.length) {
    wrap.innerHTML = html2 + urlLibEmptyStateMarkup('조건에 맞는 제품이 없습니다.') + '</div>';
    return;
  }
  html2 += '<table class="url-lib-table"><thead><tr><th>Category</th><th>Model</th><th>Status</th><th>Live URL</th></tr></thead><tbody>';
  entries.forEach(function (e) {
    var displayUrl = urlLibDisplayUrl(e.prodUrl);
    html2 += '<tr><td style="color:#334155">' + esc(e.category) + '</td>';
    html2 += '<td style="font-weight:600">' + esc(e.modelName) + '</td>';
    html2 += '<td><span class="' + cmsLibStatusClass(e.status) + '">' + esc(e.status) + '</span></td>';
    html2 += '<td><a class="url-lib-url-link" href="' + esc(e.prodUrl) + '" target="_blank" rel="noopener" title="' + esc(e.prodUrl) + '">' + esc(displayUrl) + '</a></td></tr>';
  });
  html2 += '</tbody></table></div>';
  wrap.innerHTML = html2;
}

function renderOverview() {
  var all = tickets();
  var visible = all.filter(function (t) {
    if (stageFilter && t.status !== stageFilter) return false;
    if (searchTerm && (t.key + ' ' + (t.title || '') + ' ' + (t.assignee || '')).toLowerCase().indexOf(searchTerm) < 0) return false;
    return true;
  });
  var sortSel = $('ovSort');
  var sort = sortSel ? sortSel.value : (window.__ovSort || 'updated');
  window.__ovSort = sort;
  visible.sort(function (a, b) {
    if (sort === 'due') return (a.due || '9999').localeCompare(b.due || '9999');
    if (sort === 'stale') return (a.updated || '9999').localeCompare(b.updated || '9999');
    return (b.updated || '').localeCompare(a.updated || '');
  });
  var review = all.filter(function (t) { return stageOf(t) === '검토·승인'; }).length;
  var hold = all.filter(function (t) { return stageOf(t) === '응답 대기'; }).length;
  var overdue = all.filter(isOverdue).length;
  var stale = all.filter(isStale).length;
  var doneN = all.filter(function (t) { return stageOf(t) === '완료'; }).length;
  var openN = all.length - doneN;

  var h = [];
  h.push('<div class="card">');
  h.push('<div class="ov-head"><div><div class="eyebrow">' + esc(CFG.eyebrow) + '</div><div class="h1">' + esc(CFG.heading) + '</div>' +
    '<div class="sub">내가 담당·보고·관찰하는 ' + esc(CFG.subject) + ' — 진행 중 전체' + (DATA.doneDays ? ' + 최근 ' + DATA.doneDays + '일 완료' : '') + '. Jira 기준 ' + esc(fmtDateTime(DATA.generatedAt)) + '</div></div>' +
    '<div class="ov-total"><div class="ov-total-label">In Progress</div><div class="ov-total-num">' + openN + '</div></div></div>');
  h.push('<div class="kpi-row">' +
    kpi(review, '검토·승인 대기') + '<div class="kpi-div"></div>' +
    kpi(hold, '응답 대기') + '<div class="kpi-div"></div>' +
    kpi(overdue, '마감일 초과', overdue > 0) + '<div class="kpi-div"></div>' +
    kpi(stale, '7일 이상 변경 없음', stale > 0) + '<div class="kpi-div"></div>' +
    kpi(doneN, (DATA.doneDays ? '최근 ' + DATA.doneDays + '일 ' : '') + '완료') + '</div>');
  var statusChips = Object.keys(all.reduce(function (acc, t) { acc[t.status] = t; return acc; }, {})).sort(function (a, b) {
    var ta = all.filter(function (t) { return t.status === a; })[0];
    var tb = all.filter(function (t) { return t.status === b; })[0];
    return statusRank(a, ta.statusCategory) - statusRank(b, tb.statusCategory);
  });
  h.push('<div class="chips" role="group" aria-label="Status">' + [''].concat(statusChips).map(function (s) {
    var sample = s ? all.filter(function (t) { return t.status === s; }) : [];
    var n = s ? sample.length : all.length;
    if (s && !n) return '';
    var tone = s ? jiraStatusAppearance(sample[0]) : '';
    return '<button class="chip' + (tone ? ' ' + tone : '') + '" data-stage="' + esc(s) + '" aria-pressed="' + (s === stageFilter) + '" onclick="setStageFilter(this.dataset.stage)">' + (s || 'All') + '<b>' + n + '</b></button>';
  }).join('') + '</div>');
  h.push('</div>');

  h.push('<div class="card">');
  h.push('<div class="section-bar"><h2>티켓별 현황 <span class="muted" style="font-weight:600;font-size:12px">' + visible.length + '건</span></h2>' +
    '<select id="ovSort" aria-label="정렬" onchange="renderContent()">' +
    opt('updated', '최근 업데이트순', sort) + opt('due', '마감일순', sort) + opt('stale', '변경 오래된순', sort) + '</select></div>');
  h.push('<div class="table-wrap"><table><thead><tr><th>티켓</th><th>진행 상태</th><th>담당자</th><th>마감일</th><th>최근 변경</th></tr></thead><tbody>');
  if (!visible.length) h.push('<tr><td colspan="5" class="t-empty">조건에 맞는 티켓이 없습니다.</td></tr>');
  visible.forEach(function (t) {
    h.push('<tr class="row-link" onclick="selectKey(\'' + esc(t.key) + '\')">' +
      '<td><div class="t-title">' + esc(shortTitle(t.title) || t.key) + '</div><div class="t-key">' + esc(t.key) + '</div></td>' +
      '<td><span class="badge ' + jiraStatusAppearance(t) + '">' + esc(t.status) + '</span></td>' +
      '<td>' + esc(shortName(t.assignee) || '—') + '</td>' +
      '<td class="t-num' + (isOverdue(t) ? ' overdue' : '') + '">' + (stageOf(t) === '완료' ? '<span class="muted">완료 ' + esc(day(t.resolved || t.stageSince)) + '</span>' : (t.due ? esc(t.due) : '미정')) + '</td>' +
      '<td class="t-num">' + esc(day(t.updated)) + '<span class="t-sub">' + esc(ago(t.updated)) + '</span></td></tr>');
  });
  h.push('</tbody></table></div>');
  h.push('<p class="sub" style="margin-top:12px">완료 티켓은 최근 ' + (DATA.doneDays || 0) + '일 내 완료 전환된 건만 포함되며, 그 이전 완료건은 표시하지 않습니다. 단계는 Jira 상태명으로 판정합니다.</p>');
  h.push('</div>');
  return h.join('');
}
function kpi(n, label, warn) { return '<div class="kpi' + (warn ? ' warn' : '') + '"><b>' + n + '</b><span>' + esc(label) + '</span></div>'; }
function opt(v, label, cur) { return '<option value="' + v + '"' + (v === cur ? ' selected' : '') + '>' + label + '</option>'; }
function setStageFilter(s) { stageFilter = stageFilter === s ? '' : s; renderContent(); }

function renderTicket(t) {
  var h = [];
  var stage = stageOf(t);
  var untilDue = daysUntil(t.due);
  var sinceStage = daysSince(t.stageSince);
  h.push('<div class="card">');
  h.push('<div class="tk-head"><div class="tk-head-main">' +
    '<div class="tk-key"><span>' + esc(t.key) + '</span><span class="badge ' + jiraStatusAppearance(t) + '">' + esc(t.status) + '</span>' +
    (t.priority ? '<span class="pill">' + esc(t.priority) + '</span>' : '') + (t.issuetype ? '<span class="pill">' + esc(t.issuetype) + '</span>' : '') + '</div>' +
    (t.title ? '<div class="tk-title">' + esc(t.title) + '</div>' : '') + '</div>' +
    '<div class="tk-actions"><a class="btn-primary" href="' + esc(t.url) + '" target="_blank" rel="noopener">Jira에서 열기 ↗</a></div></div>');
  var alerts = [];
  if (isOverdue(t)) alerts.push('<div class="alert">마감일 ' + esc(t.due) + ' 을 ' + Math.abs(untilDue) + '일 지났습니다.</div>');
  else if (untilDue != null && untilDue <= 3 && stage !== '완료') alerts.push('<div class="alert">마감일 ' + esc(t.due) + ' 까지 ' + untilDue + '일 남았습니다.</div>');
  if (isStale(t)) alerts.push('<div class="alert">' + daysSince(t.updated) + '일 동안 Jira 업데이트가 없습니다.</div>');
  if (stage === '응답 대기') alerts.push('<div class="alert info">응답 대기 상태 — 요청자/법인 회신을 확인하세요.</div>');
  if (stage === '검토·승인') alerts.push('<div class="alert info">승인 대기 상태 — 법인 승인 진행을 확인하세요.</div>');
  if (stage === '완료') alerts.push('<div class="alert done">' + esc(day(t.resolved || t.stageSince)) + ' 완료 (' + esc(t.status) + ')</div>');
  if (alerts.length) h.push('<div class="alerts">' + alerts.join('') + '</div>');
  h.push('</div>');

  h.push('<div class="card"><div class="card-title">티켓 정보<small>Jira 기준 ' + esc(fmtDateTime(DATA.generatedAt)) + '</small></div>');
  h.push('<dl class="meta-grid">' +
    meta('담당자', shortName(t.assignee) || '—') +
    meta('Status', t.status) +
    meta('프로젝트', t.project) +
    meta('생성', day(t.created) || '—', ago(t.created)) +
    (stage === '완료'
      ? meta('완료일', day(t.resolved || t.stageSince) || '—', ago(t.resolved || t.stageSince))
      : meta('마감일', t.due ? '<span' + (isOverdue(t) ? ' class="overdue"' : '') + '>' + esc(t.due) + '</span>' : '미정', untilDue == null ? '' : (untilDue < 0 ? Math.abs(untilDue) + '일 초과' : untilDue + '일 남음'), true)) +
    meta('최근 변경', day(t.updated) || '—', ago(t.updated)) +
    meta('상태 그룹 변경', day(t.stageSince) || '—', sinceStage == null ? '' : sinceStage + '일 경과 · 개별 상태 체류시간 아님') +
    '</dl></div>');
  return h.join('');
}
function meta(label, value, small, raw) {
  return '<div class="meta"><dt>' + esc(label) + '</dt><dd>' + (raw ? value : esc(value)) + (small ? '<small>' + esc(small) + '</small>' : '') + '</dd></div>';
}

// ── 사이드바 토글 / 모바일 ───────────────────────────────
function toggleSidebar() {
  var sb = $('sidebar');
  sb.classList.toggle('collapsed');
  try { localStorage.setItem(CFG.board + '-sidebar-collapsed', sb.classList.contains('collapsed') ? '1' : '0'); } catch (e) { /* ignore */ }
}
function openMobileSidebar() { $('sidebar').classList.add('mobile-open'); $('sbBackdrop').classList.add('show'); }
function closeMobileSidebar() { $('sidebar').classList.remove('mobile-open'); $('sbBackdrop').classList.remove('show'); }

// ── 초기화 ───────────────────────────────────────────────
function applyConfigToChrome() {
  var el;
  if ((el = document.querySelector('.sb-logo-text'))) el.textContent = CFG.logoText;
  if ((el = document.querySelector('.sb-logo-sub'))) el.textContent = CFG.logoSub;
  if ((el = $('topTitle'))) el.textContent = CFG.title;
  document.title = CFG.docTitle;
}

function init() {
  applyConfigToChrome();
  try { if (localStorage.getItem(CFG.board + '-sidebar-collapsed') === '1') $('sidebar').classList.add('collapsed'); } catch (e) { /* ignore */ }
  fetch(CFG.dataPath + '?v=' + Date.now(), { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (json) {
      DATA = json;
      var meta = 'Jira 기준 ' + fmtDateTime(json.generatedAt);
      $('topMeta').textContent = meta;
      $('sbFoot').textContent = meta + ' · ' + (json.count || tickets().length) + '건';
      currentKey = initialKeyFromUrl();
      renderSidebar();
      renderContent();
      syncUrl();
      if (CFG.board === 'it-b2b') { loadCatalog(); loadCms(); }
    })
    .catch(function (e) {
      console.error('[id-dashboard] tickets.json 로드 실패', e);
      $('contentWrap').innerHTML = '<div class="notice">티켓 데이터를 불러오지 못했습니다 (' + esc(e.message) + '). export_id_tickets.py --board ' + esc(CFG.board) + ' 로 data/tickets.json 을 갱신했는지 확인하세요.</div>';
      $('ticketNavList').innerHTML = '<div class="sb-empty">데이터 없음</div>';
    });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
