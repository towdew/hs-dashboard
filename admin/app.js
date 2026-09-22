'use strict';

// SHA-256 hex of the access key. The key itself is not in this file.
var GATE_HASH = '0fec50a87c8d4d0d5e57d060c08e2362e639dde8d03baaa9128270a6c0dca22a';
var GATE_OK = 'dash-admin-ok';

var BOARDS = [
  { id: 'it', label: 'IT', href: '../it/', kind: 'gr' },
  { id: 'it-b2b', label: 'IT/B2B', href: '../it-b2b/', kind: 'jira', data: '../it-b2b/data/tickets.json' },
  { id: 'id', label: 'ID', href: '../id/', kind: 'jira', data: '../id/data/tickets.json' }
];

var STATE = { view: 'home', cache: {} };

function $(id) { return document.getElementById(id); }
function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function daysSince(v) {
  if (!v || !Number.isFinite(Date.parse(v))) return null;
  var a = new Date(v); a.setHours(0, 0, 0, 0);
  var b = new Date(); b.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((b - a) / 86400000));
}
function ago(v) {
  var d = daysSince(v);
  if (d == null) return '—';
  if (d === 0) return '오늘';
  if (d === 1) return '어제';
  return d + '일 전';
}
function stageOf(t) {
  if (t.statusCategory === 'done') return '완료';
  if (/HOLD|CLARIFICATION|RESPONSE/i.test(t.status)) return '응답 대기';
  if (/APPROVAL|REVIEW/i.test(t.status)) return '검토·승인';
  if (/PRE.?CHECK|OPEN|NEW|CREATE|TO DO/i.test(t.status)) return '사전검토';
  return '진행 중';
}
function stageClass(s) {
  return { '사전검토': 'st-new', '진행 중': 'st-progress', '검토·승인': 'st-review', '응답 대기': 'st-hold', '완료': 'st-done' }[s] || '';
}
function lastComment(t) {
  return (t.comments && t.comments.length) ? t.comments[0] : null;
}
function oneLine(text, max) {
  var s = String(text || '').replace(/\s+/g, ' ').trim();
  return s.length > max ? s.slice(0, max).trim() + '…' : s;
}
async function sha256hex(text) {
  var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(function (b) {
    return b.toString(16).padStart(2, '0');
  }).join('');
}
async function unlock(key) {
  var hash = await sha256hex(String(key || '').trim());
  if (hash !== GATE_HASH) return false;
  sessionStorage.setItem(GATE_OK, '1');
  return true;
}

async function fetchJson(url) {
  var res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(url + ' ' + res.status);
  return res.json();
}
async function fetchText(url) {
  var res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(url + ' ' + res.status);
  return res.text();
}

function summarizeJira(payload) {
  var tickets = (payload && payload.tickets) || [];
  var open = [];
  var done = 0;
  tickets.forEach(function (t) {
    if (t.statusCategory === 'done') done += 1;
    else open.push(t);
  });
  open.sort(function (a, b) {
    return Date.parse(b.updated || 0) - Date.parse(a.updated || 0);
  });
  return {
    exportedAt: payload.generatedAt || payload.exportedAt || payload.updated || '',
    total: tickets.length,
    open: open.length,
    done: done,
    tickets: open
  };
}

function summarizeGr(titles, changes, indexHtml) {
  var titleMap = titles && titles.titles ? titles.titles : titles || {};
  var count = Object.keys(titleMap).length;
  var week = 0;
  if (changes && changes.changes && typeof changes.changes === 'object') {
    week = Object.keys(changes.changes).length;
  } else if (changes && changes.taskSummary && typeof changes.taskSummary === 'object') {
    week = Object.keys(changes.taskSummary).reduce(function (n, k) {
      var v = changes.taskSummary[k] || {};
      return n + (Number(v.changed) || 0) + (Number(v.new) || 0);
    }, 0);
  }
  var build = '';
  var m = String(indexHtml || '').match(/__BUILD_V\s*=\s*['"]([^'"]+)/);
  if (m) build = m[1];
  return {
    count: count,
    week: week,
    build: build,
    exportedAt: (titles && titles.generatedAt) || (changes && changes.generatedAt) || ''
  };
}

async function loadBoard(board) {
  if (STATE.cache[board.id]) return STATE.cache[board.id];
  if (board.kind === 'jira') {
    var payload = await fetchJson(board.data);
    STATE.cache[board.id] = { board: board, jira: summarizeJira(payload) };
    return STATE.cache[board.id];
  }
  var titles = await fetchJson('../it/data/gr-titles.json');
  var changes = await fetchJson('../it/data/gr-changes.json');
  var html = await fetchText('../it/index.html');
  STATE.cache[board.id] = { board: board, gr: summarizeGr(titles, changes, html) };
  return STATE.cache[board.id];
}

function renderNav(summaries) {
  var html = '<button type="button" class="sb-item' + (STATE.view === 'home' ? ' active' : '') + '" data-view="home">한눈에 보기</button>';
  summaries.forEach(function (s) {
    var n = s.jira ? s.jira.open : (s.gr ? s.gr.count : 0);
    html += '<button type="button" class="sb-item' + (STATE.view === s.board.id ? ' active' : '') + '" data-view="' + s.board.id + '">'
      + esc(s.board.label) + '<span class="sb-badge">' + n + '</span></button>';
  });
  $('nav').innerHTML = html;
  Array.prototype.forEach.call($('nav').querySelectorAll('[data-view]'), function (btn) {
    btn.onclick = function () { STATE.view = btn.getAttribute('data-view'); draw(); };
  });
}

function cardHtml(s) {
  if (s.error) {
    return '<button type="button" class="card" data-view="' + s.board.id + '"><h2>' + esc(s.board.label)
      + '</h2><p class="err">불러오지 못했습니다</p></button>';
  }
  if (s.jira) {
    return '<button type="button" class="card" data-view="' + s.board.id + '"><h2>' + esc(s.board.label)
      + '</h2><p class="meta">갱신 ' + esc(ago(s.jira.exportedAt)) + '</p><div class="nums">'
      + '<div><div class="n">' + s.jira.open + '</div><div class="l">진행</div></div>'
      + '<div><div class="n">' + s.jira.done + '</div><div class="l">완료</div></div></div></button>';
  }
  return '<button type="button" class="card" data-view="' + s.board.id + '"><h2>' + esc(s.board.label)
    + '</h2><p class="meta">빌드 ' + esc(s.gr.build || '—') + '</p><div class="nums">'
    + '<div><div class="n">' + s.gr.count + '</div><div class="l">GR 시트</div></div>'
    + '<div><div class="n">' + s.gr.week + '</div><div class="l">금주 변경</div></div></div></button>';
}

function ticketRows(tickets) {
  if (!tickets.length) return '<div class="empty">열린 티켓이 없습니다.</div>';
  var rows = tickets.map(function (t) {
    var st = stageOf(t);
    var c = lastComment(t);
    var comment = c ? oneLine((c.author || '') + ' · ' + (c.text || c.body || ''), 90) : '—';
    return '<tr><td class="key">' + esc(t.key) + '</td><td><span class="st ' + stageClass(st) + '">' + esc(st)
      + '</span></td><td>' + esc(oneLine(t.title || t.summary || '', 72)) + '</td><td class="muted">'
      + esc(ago(t.updated)) + '</td><td class="muted">' + esc(comment) + '</td></tr>';
  }).join('');
  return '<div class="table-wrap"><table><thead><tr><th>키</th><th>상태</th><th>제목</th><th>갱신</th><th>최근 코멘트</th></tr></thead><tbody>'
    + rows + '</tbody></table></div>';
}

function boardDetail(s) {
  var link = '<p style="margin:0 0 14px"><a class="ext" href="' + s.board.href + '" target="_blank" rel="noopener">보드 열기 →</a></p>';
  if (s.error) return link + '<p class="err">데이터를 불러오지 못했습니다. 배포가 끝난 뒤 다시 불러오세요.</p>';
  if (s.jira) {
    return '<div class="kpis"><div class="kpi"><div class="k">진행</div><div class="v">' + s.jira.open
      + '</div></div><div class="kpi"><div class="k">완료</div><div class="v">' + s.jira.done
      + '</div></div><div class="kpi"><div class="k">마지막 갱신</div><div class="v" style="font-size:18px">'
      + esc(ago(s.jira.exportedAt)) + '</div><div class="s">' + esc(s.jira.exportedAt || '') + '</div></div></div>'
      + link + ticketRows(s.jira.tickets);
  }
  return '<div class="kpis"><div class="kpi"><div class="k">GR 시트</div><div class="v">' + s.gr.count
    + '</div></div><div class="kpi"><div class="k">금주 변경</div><div class="v">' + s.gr.week
    + '</div></div><div class="kpi"><div class="k">빌드</div><div class="v" style="font-size:18px">'
    + esc(s.gr.build || '—') + '</div></div></div>' + link;
}

async function loadAll() {
  var out = [];
  for (var i = 0; i < BOARDS.length; i++) {
    try { out.push(await loadBoard(BOARDS[i])); }
    catch (err) { out.push({ board: BOARDS[i], error: String(err) }); }
  }
  return out;
}

function drawFrom(summaries) {
  renderNav(summaries);
  var view = STATE.view;
  if (view === 'home') {
    $('eyebrow').textContent = '보드 현황';
    $('heading').textContent = '한눈에 보기';
    $('content').innerHTML = '<div class="cards">' + summaries.map(cardHtml).join('') + '</div>';
    Array.prototype.forEach.call($('content').querySelectorAll('[data-view]'), function (btn) {
      btn.onclick = function () { STATE.view = btn.getAttribute('data-view'); draw(); };
    });
    return;
  }
  var s = summaries.filter(function (x) { return x.board.id === view; })[0];
  if (!s) return;
  $('eyebrow').textContent = s.board.label;
  $('heading').textContent = s.board.label + ' 현황';
  $('content').innerHTML = boardDetail(s);
}

async function draw() {
  var summaries = await loadAll();
  drawFrom(summaries);
}

async function enter() {
  $('gate').hidden = true;
  $('app').hidden = false;
  $('btn-refresh').onclick = function () { STATE.cache = {}; draw(); };
  await draw();
}

async function boot() {
  if (sessionStorage.getItem(GATE_OK) === '1') {
    await enter();
    return;
  }
  var params = new URLSearchParams(location.search);
  if (params.get('k') && await unlock(params.get('k'))) {
    history.replaceState({}, '', location.pathname);
    await enter();
    return;
  }
  $('gate-form').onsubmit = async function (e) {
    e.preventDefault();
    $('gate-err').hidden = true;
    if (await unlock($('gate-key').value)) await enter();
    else $('gate-err').hidden = false;
  };
}

boot();
