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
var currentKey = 'overview';  // 'overview' | 티켓 키
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
function lastComment(t) { return (t.comments && t.comments.length) ? t.comments[0] : null; }
// "박나은/(협력사) 선임/B2B디지털채널팀" → "박나은" (전체는 title 툴팁으로)
function shortName(name) { return String(name || '').split('/')[0].trim() || name || ''; }
function oneLine(text, max) { var s = String(text || '').replace(/\s+/g, ' ').trim(); return s.length > max ? s.slice(0, max).trim() + '…' : s; }
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
        'data-search="' + esc((t.key + ' ' + t.title + ' ' + t.assignee).toLowerCase()) + '" onclick="switchTicket(this)" title="' + esc(t.key + ' · ' + t.title) + '">' +
        '<span class="ni-text"><span class="ni-key">' + esc(t.key) + '</span><span class="ni-title">' + esc(shortTitle(t.title)) + '</span></span>' +
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

// 제목 접두 "[ID]", "ID)", "Medical)" 등은 사이드바에서는 노이즈 — 표시용으로만 뗀다.
function shortTitle(title) {
  return String(title || '').replace(/^\s*(\[[^\]]*\]\s*|\(IT\s*B2B\)\s*|IT\s*B2B\s*\)\s*|ID사업부\s*|ID\s*\)\s*|Medical\s*\)\s*)+/i, '').trim() || title;
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
function selectKey(key) {
  currentKey = (CFG.board === 'id' && key === 'id_npi') ? 'id_npi' : (findTicket(key) ? findTicket(key).key : 'overview');
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
    if (currentKey === 'id_npi') {
      params.delete(PARAM);
      params.set('npi', '1');
    } else {
      params.delete('npi');
      if (currentKey === 'overview') params.delete(PARAM); else params.set(PARAM, currentKey);
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
function onSearchInput(v) { searchTerm = String(v || '').trim().toLowerCase(); applySearchToNav(); if (currentKey === 'overview') renderContent(); }
function applySearchToNav() {
  document.querySelectorAll('.nav-item[data-search]').forEach(function (n) {
    n.classList.toggle('is-hidden', !!searchTerm && n.dataset.search.indexOf(searchTerm) < 0);
  });
}

// ── 본문 ─────────────────────────────────────────────────
function renderContent() {
  if (currentKey === 'id_npi') { renderIdNpi(); return; }
  var wrap = $('contentWrap');
  var t = currentKey === 'overview' ? null : findTicket(currentKey);
  $('topTitle').textContent = t ? t.key + ' · ' + shortTitle(t.title) : CFG.title;
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

function renderOverview() {
  var all = tickets();
  var visible = all.filter(function (t) {
    if (stageFilter && t.status !== stageFilter) return false;
    if (searchTerm && (t.key + ' ' + t.title + ' ' + t.assignee).toLowerCase().indexOf(searchTerm) < 0) return false;
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
  h.push('<div class="table-wrap"><table><thead><tr><th>티켓 / 업무</th><th>진행 상태</th><th>담당자</th><th>마감일</th><th>최근 변경</th><th class="col-cm">마지막 코멘트</th></tr></thead><tbody>');
  if (!visible.length) h.push('<tr><td colspan="6" class="t-empty">조건에 맞는 티켓이 없습니다.</td></tr>');
  visible.forEach(function (t) {
    h.push('<tr class="row-link" onclick="selectKey(\'' + esc(t.key) + '\')">' +
      '<td><div class="t-title">' + esc(t.title) + '</div><div class="t-key">' + esc(t.key) + (t.parent && t.parent.key ? ' · 상위 ' + esc(t.parent.key) : '') + '</div></td>' +
      '<td><span class="badge ' + jiraStatusAppearance(t) + '">' + esc(t.status) + '</span></td>' +
      '<td>' + esc(t.assignee) + '</td>' +
      '<td class="t-num' + (isOverdue(t) ? ' overdue' : '') + '">' + (stageOf(t) === '완료' ? '<span class="muted">완료 ' + esc(day(t.resolved || t.stageSince)) + '</span>' : (t.due ? esc(t.due) : '미정')) + '</td>' +
      '<td class="t-num">' + esc(day(t.updated)) + '<span class="t-sub">' + esc(ago(t.updated)) + '</span></td>' +
      '<td class="col-cm">' + cellComment(t) + '</td></tr>');
  });
  h.push('</tbody></table></div>');
  h.push('<p class="sub" style="margin-top:12px">완료 티켓은 최근 ' + (DATA.doneDays || 0) + '일 내 완료 전환된 건만 포함되며, 그 이전 완료건은 표시하지 않습니다. 단계는 Jira 상태명으로 판정합니다.</p>');
  h.push('</div>');
  return h.join('');
}
function cellComment(t) {
  var c = lastComment(t);
  if (!c) return '<span class="muted">—</span>';
  return '<div class="cm-cell"><div class="cm-cell-head"><b title="' + esc(c.author) + '">' + esc(shortName(c.author)) + '</b><span class="t-sub" style="display:inline;margin-left:6px">' + esc(ago(c.created)) + '</span>' +
    (t.commentCount ? '<span class="cm-count" title="코멘트 ' + t.commentCount + '개">' + t.commentCount + '</span>' : '') + '</div>' +
    '<div class="cm-cell-body" title="' + esc(oneLine(c.text, 400)) + '">' + esc(oneLine(c.text, 80)) + '</div></div>';
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
    '<div class="tk-title">' + esc(t.title) + '</div></div>' +
    '<div class="tk-actions"><a class="btn-primary" href="' + esc(t.url) + '" target="_blank" rel="noopener">Jira에서 열기 ↗</a></div></div>');
  var alerts = [];
  if (isOverdue(t)) alerts.push('<div class="alert">마감일 ' + esc(t.due) + ' 을 ' + Math.abs(untilDue) + '일 지났습니다.</div>');
  else if (untilDue != null && untilDue <= 3 && stage !== '완료') alerts.push('<div class="alert">마감일 ' + esc(t.due) + ' 까지 ' + untilDue + '일 남았습니다.</div>');
  if (isStale(t)) alerts.push('<div class="alert">' + daysSince(t.updated) + '일 동안 Jira 업데이트가 없습니다.</div>');
  var lc = lastComment(t);
  if (lc && stage !== '완료' && daysSince(lc.created) >= 7) alerts.push('<div class="alert info">마지막 코멘트 ' + daysSince(lc.created) + '일 전 (' + esc(shortName(lc.author)) + ')</div>');
  if (stage === '응답 대기') alerts.push('<div class="alert info">응답 대기 상태 — 요청자/법인 회신을 확인하세요.</div>');
  if (stage === '검토·승인') alerts.push('<div class="alert info">승인 대기 상태 — 법인 승인 진행을 확인하세요.</div>');
  if (stage === '완료') alerts.push('<div class="alert done">' + esc(day(t.resolved || t.stageSince)) + ' 완료 (' + esc(t.status) + ')</div>');
  if (alerts.length) h.push('<div class="alerts">' + alerts.join('') + '</div>');
  h.push('</div>');

  h.push('<div class="card"><div class="card-title">티켓 정보<small>Jira 기준 ' + esc(fmtDateTime(DATA.generatedAt)) + '</small></div>');
  h.push('<dl class="meta-grid">' +
    meta('담당자', t.assignee) +
    meta('보고자', t.reporter || '—') +
    meta('Status', t.status) +
    meta('프로젝트', t.project) +
    meta('상위 티켓', t.parent && t.parent.key ? '<a class="link" href="' + esc(DATA.baseUrl + '/browse/' + t.parent.key) + '" target="_blank" rel="noopener">' + esc(t.parent.key) + '</a>' : '—', t.parent && t.parent.title ? t.parent.title : '', true) +
    meta('생성', day(t.created) || '—', ago(t.created)) +
    (stage === '완료'
      ? meta('완료일', day(t.resolved || t.stageSince) || '—', ago(t.resolved || t.stageSince))
      : meta('마감일', t.due ? '<span' + (isOverdue(t) ? ' class="overdue"' : '') + '>' + esc(t.due) + '</span>' : '미정', untilDue == null ? '' : (untilDue < 0 ? Math.abs(untilDue) + '일 초과' : untilDue + '일 남음'), true)) +
    meta('최근 변경', day(t.updated) || '—', ago(t.updated)) +
    meta('상태 그룹 변경', day(t.stageSince) || '—', sinceStage == null ? '' : sinceStage + '일 경과 · 개별 상태 체류시간 아님') +
    '</dl></div>');

  h.push(renderComments(t));
  h.push('<div class="card"><div class="card-title">설명 요약<small>Jira 본문 앞부분</small></div>');
  if (t.descriptionExcerpt) h.push('<div class="desc">' + esc(t.descriptionExcerpt) + '</div>');
  else h.push('<div class="desc empty">Jira 본문이 비어 있거나 내보내기에서 제외됐습니다. 전체 내용은 Jira에서 확인하세요.</div>');
  h.push('</div>');
  return h.join('');
}
function renderComments(t) {
  var list = t.comments || [];
  var total = t.commentCount != null ? t.commentCount : list.length;
  var h = ['<div class="card"><div class="card-title">최근 코멘트<small>' +
    (total ? '코멘트 ' + total + '개 · 최근 ' + list.length + '개 · <a class="link" href="' + esc(t.url) + '" target="_blank" rel="noopener">Jira에서 전체 보기</a>' : 'Jira 코멘트') + '</small></div>'];
  if (!list.length) {
    h.push('<div class="desc empty">' + (t.comments ? '아직 코멘트가 없습니다.' : '코멘트가 내보내기에서 제외됐습니다.') + '</div></div>');
    return h.join('');
  }
  h.push('<ol class="cm-list">');
  list.forEach(function (c, i) {
    h.push('<li class="cm-item' + (i === 0 ? ' is-latest' : '') + '">' +
      '<div class="cm-head"><b class="cm-author" title="' + esc(c.author) + '">' + esc(shortName(c.author)) + '</b>' +
      '<span class="cm-when" title="' + esc(fmtDateTime(c.created)) + '">' + esc(ago(c.created)) + ' · ' + esc(day(c.created)) + '</span>' +
      (i === 0 ? '<span class="cm-latest">최신</span>' : '') + '</div>' +
      '<div class="cm-body">' + esc(c.text || '(본문 없음)') + '</div></li>');
  });
  h.push('</ol></div>');
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
    })
    .catch(function (e) {
      console.error('[id-dashboard] tickets.json 로드 실패', e);
      $('contentWrap').innerHTML = '<div class="notice">티켓 데이터를 불러오지 못했습니다 (' + esc(e.message) + '). export_id_tickets.py --board ' + esc(CFG.board) + ' 로 data/tickets.json 을 갱신했는지 확인하세요.</div>';
      $('ticketNavList').innerHTML = '<div class="sb-empty">데이터 없음</div>';
    });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
