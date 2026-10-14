/* ============================================================
 * MS Dashboard — UX Enhancement Layer (ux-enhance.js)
 * ------------------------------------------------------------
 * 기존 sheet-loader.js / common.js 로직은 수정하지 않고,
 * 그 위에서 사이드바·상단바 UX만 재구성합니다.
 *
 *  1) Model Name 파싱 → 짧은 제목 + 요청주차(W##) + 요청일(MM/DD)
 *  2) 사이드바 그룹핑 : [유형별] NPI·Feature / Microsite / GNB·Category /
 *                        PDP·PLP 업데이트 / FAQ·SEO   또는  [월별]
 *  3) 검색(/ 단축키) + 상태 필터(전체 / 진행중 / 완료) + 그룹 접기·펼치기
 *  4) 항목별 미니 진행바 · 완료 체크 표시
 *  5) 사이드바 접힘 상태에서는 그룹 아이콘 레일 표시
 *  6) 상단바 : 짧은 제목 + Division / W## / 요청일 칩
 *     Overview 카드 : 원본 Request 명 + 복사 버튼
 *
 * 삭제 방법: index.html에서 ux-enhance.js / ux-enhance.css 참조만 지우면
 * 기존 화면으로 그대로 돌아갑니다.
 * ============================================================ */
(function () {
  'use strict';

  var STORE_KEY = 'msdash.ux.v1';

  /* ── 유형 그룹 정의 (위에서부터 먼저 매칭) ───────────────── */
  var TYPE_GROUPS = [
    // order = 사이드바 표시 순서
    { id: 'faq',   order: 5, label: 'FAQ · SEO',            abbr: 'FAQ', test: /\bFAQ\b|\bSEO\b/i },
    { id: 'npi',   order: 1, label: 'NPI · Feature',        abbr: 'NPI', test: /\bNPI\b/i },
    { id: 'micro', order: 2, label: 'Microsite · Playbook', abbr: 'Micro', test: /microsite|playbook|brand page|hub page|webos/i },
    { id: 'gnb',   order: 3, label: 'GNB · Category',       abbr: 'GNB', test: /\bGNB\b|category|banner/i },
    { id: 'pdp',   order: 4, label: 'PDP · PLP 업데이트',   abbr: 'PDP', test: /./ }
  ];

  var STATUS_FILTERS = [
    { id: 'all',  label: '전체' },
    { id: 'open', label: '진행중' },
    { id: 'done', label: '완료' }
  ];

  var state = loadState();
  var META = {};      // key -> parsed meta
  var KEYS = [];

  /* ── utils ─────────────────────────────────────────────── */
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
  function loadState() {
    var def = { division: '', q: '', status: 'all', mode: 'type', open: {}, lastKey: '' };
    try {
      var raw = window.localStorage && localStorage.getItem(STORE_KEY);
      if (raw) {
        var s = JSON.parse(raw);
        def.division = s.division || '';
        def.status = s.status || 'all';
        def.mode = s.mode === 'month' ? 'month' : 'type';
        def.open = s.open && typeof s.open === 'object' ? s.open : {};
        def.lastKey = s.lastKey || '';
      }
    } catch (e) {}
    return def;
  }
  function saveState() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        division: state.division, status: state.status, mode: state.mode, open: state.open, lastKey: state.lastKey
      }));
    } catch (e) {}
  }
  function getCurrentKey() {
    try { if (typeof currentKey !== 'undefined' && currentKey) return currentKey; } catch (e) {}
    var a = document.querySelector('#sheetNavList .nav-item.active');
    return a ? a.getAttribute('data-key') : (KEYS[0] || '');
  }
  function divisionOf(key) {
    var d = window.DATA && window.DATA[key];
    return (typeof getMsDashboardDivision === 'function') ? getMsDashboardDivision(d) : String((d && d.division) || 'Unassigned');
  }

  /* ── Model Name 파싱 ────────────────────────────────────── */
  // 예) GR26-W25-MS-Audio-xboom Stage 501 PDP Update-0626
  function parseModelName(raw) {
    var full = String(raw || '').trim();
    var m = full.match(/^GR(\d{2})-W(\d{1,2})-MS-([A-Za-z]+)-(.*)$/i);
    var out = { full: full, year: null, week: null, cat: '', title: full, date: '', month: null };
    if (!m) return out;
    out.year = 2000 + Number(m[1]);
    out.week = Number(m[2]);
    out.cat = m[3];
    var rest = m[4].trim();
    // 끝의 요청일(-MMDD) 또는 잘린 날짜(-0, -05 …) 제거
    var dm = rest.match(/-\s*([01]\d{0,3})\s*$/);
    if (dm) {
      if (dm[1].length === 4) out.date = dm[1].slice(0, 2) + '/' + dm[1].slice(2);
      rest = rest.slice(0, dm.index).trim();
    }
    out.truncated = full.length >= 80 && (!dm || dm[1].length < 4);   // 엑셀 Model Name이 80자에서 잘린 경우
    out.title = (rest || full) + (out.truncated ? '…' : '');
    // 월 계산: 요청일이 있으면 요청일 기준, 없으면 ISO 주차의 목요일 기준
    if (dm && dm[1].length === 4) {
      out.month = Number(dm[1].slice(0, 2));
    } else {
      out.month = isoWeekMonth(out.year, out.week);
    }
    return out;
  }
  function isoWeekMonth(year, week) {
    if (!year || !week) return null;
    var jan4 = new Date(Date.UTC(year, 0, 4));
    var dow = jan4.getUTCDay() || 7;
    var mon1 = new Date(jan4.getTime() - (dow - 1) * 86400000);
    var thu = new Date(mon1.getTime() + ((week - 1) * 7 + 3) * 86400000);
    return thu.getUTCMonth() + 1;
  }
  function typeGroupOf(meta) {
    for (var i = 0; i < TYPE_GROUPS.length; i++) if (TYPE_GROUPS[i].test.test(meta.title)) return TYPE_GROUPS[i];
    return TYPE_GROUPS[TYPE_GROUPS.length - 1];
  }

  /* ── 진행 통계 ──────────────────────────────────────────── */
  function statsOf(key) {
    var cs = { Done: 0, total: 0, Cancel: 0, 'Pre-Review': 0, 'In Progress': 0, 'Corp. Review': 0 };
    try { if (typeof contentStats === 'function') cs = contentStats(key) || cs; } catch (e) {}
    var total = cs.total || 0;
    var done = cs.Done || 0;
    var open = (cs['Pre-Review'] || 0) + (cs['In Progress'] || 0) + (cs['Corp. Review'] || 0);
    return {
      total: total, done: done, open: open,
      pct: total > 0 ? Math.round(done / total * 100) : 0,
      complete: total > 0 && open === 0
    };
  }
  function pctTone(p, complete) {
    if (complete) return 'done';
    if (p >= 70) return 'high';
    if (p >= 40) return 'mid';
    if (p > 0) return 'low';
    return 'zero';
  }

  /* ── 데이터 준비 ────────────────────────────────────────── */
  function prepare() {
    KEYS = (window.__DASHBOARD_KEYS || []).slice();
    META = {};
    KEYS.forEach(function (key) {
      var d = window.DATA && window.DATA[key];
      var title = (d && (d.displayTitle || d.title)) || key;
      var meta = parseModelName(title);
      meta.key = key;
      meta.division = divisionOf(key);
      meta.type = typeGroupOf(meta);
      meta.stats = statsOf(key);
      META[key] = meta;
    });
    var divisions = getDivisions();
    if (!state.division || divisions.indexOf(state.division) < 0) {
      state.division = divisionOf(getCurrentKey()) || divisions[0] || '';
    }
  }
  function shortDivision(d) {
    var s = String(d || '').replace(/^MS\s+/i, '').trim();
    return s || d;
  }
  function getDivisions() {
    var list = [];
    KEYS.forEach(function (k) { var d = META[k] ? META[k].division : divisionOf(k); if (list.indexOf(d) < 0) list.push(d); });
    return list;
  }

  /* ── 필터 + 그룹핑 ──────────────────────────────────────── */
  function matchesQuery(meta, q) {
    if (!q) return true;
    var hay = (meta.title + ' ' + meta.full + ' W' + meta.week + ' ' + meta.cat).toLowerCase();
    return q.toLowerCase().split(/\s+/).filter(Boolean).every(function (t) { return hay.indexOf(t) >= 0; });
  }
  function matchesStatus(meta) {
    if (state.status === 'open') return !meta.stats.complete;
    if (state.status === 'done') return meta.stats.complete;
    return true;
  }
  function visibleKeys(opts) {
    opts = opts || {};
    return KEYS.filter(function (k) {
      var m = META[k];
      if (!m) return false;
      // 검색어가 있으면 Division 구분 없이 전체에서 찾음
      if (!opts.ignoreDivision && !state.q && m.division !== state.division) return false;
      if (!opts.ignoreStatus && !matchesStatus(m)) return false;
      return matchesQuery(m, state.q);
    });
  }
  function sortByRecent(a, b) {
    var ma = META[a], mb = META[b];
    if ((mb.week || 0) !== (ma.week || 0)) return (mb.week || 0) - (ma.week || 0);
    return ma.title.localeCompare(mb.title, undefined, { numeric: true });
  }
  function buildGroups(keys) {
    var groups = [];
    var byId = {};
    keys.slice().sort(sortByRecent).forEach(function (k) {
      var m = META[k];
      var gid, label, abbr, order;
      if (state.q) {
        var di = getDivisions().indexOf(m.division);
        gid = 'd' + di;
        label = m.division + ' · 검색 결과';
        abbr = shortDivision(m.division).slice(0, 5);
        order = di;
      } else if (state.mode === 'month') {
        gid = 'm' + (m.month || 0);
        label = m.month ? (m.month + '월') : '기타';
        abbr = m.month ? (m.month + '월') : '-';
        order = -(m.month || 0);
      } else {
        gid = m.type.id;
        label = m.type.label;
        abbr = m.type.abbr;
        order = m.type.order;
      }
      if (!byId[gid]) {
        byId[gid] = { id: gid, label: label, abbr: abbr, order: order, keys: [], weeks: [] };
        groups.push(byId[gid]);
      }
      byId[gid].keys.push(k);
      if (m.week) byId[gid].weeks.push(m.week);
    });
    groups.sort(function (a, b) { return a.order - b.order; });
    return groups;
  }
  function groupStateKey(gid) { return state.mode + ':' + state.division + ':' + gid; }
  function isGroupOpen(group, activeKey) {
    if (state.q) return true;                                   // 검색 중에는 모두 펼침
    var saved = state.open[groupStateKey(group.id)];
    if (saved != null) return !!saved;
    return group.keys.indexOf(activeKey) >= 0;                  // 기본: 현재 항목이 있는 그룹만
  }

  /* ── 렌더링 ─────────────────────────────────────────────── */
  var ICON = {
    search: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>',
    x: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    chev: '<svg class="ux-chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>',
    check: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    expand: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 15 12 20 17 15"/><polyline points="7 9 12 4 17 9"/></svg>',
    collapse: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 20 12 15 17 20"/><polyline points="7 4 12 9 17 4"/></svg>',
    copy: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
  };

  function renderShell() {
    var section = document.getElementById('sheetNavList');
    if (!section) return;
    section.classList.add('ux-nav');
    section.innerHTML =
      '<div class="ux-nav-head">' +
        '<div class="ux-div-tabs" id="uxDivTabs" role="tablist" aria-label="Division"></div>' +
        '<label class="ux-search">' + ICON.search +
          '<input id="uxSearch" type="search" placeholder="Request 검색  ( / )" autocomplete="off" aria-label="Request 검색">' +
          '<button type="button" class="ux-search-clear" id="uxSearchClear" aria-label="검색어 지우기">' + ICON.x + '</button>' +
        '</label>' +
        '<div class="ux-filter-row">' +
          '<div class="ux-status-chips" id="uxStatusChips" role="radiogroup" aria-label="진행 상태"></div>' +
          '<div class="ux-tools">' +
            '<div class="ux-mode" role="radiogroup" aria-label="그룹 기준">' +
              '<button type="button" data-mode="type">유형</button><button type="button" data-mode="month">월</button>' +
            '</div>' +
            '<button type="button" class="ux-icon-btn" id="uxToggleAll" title="모두 펼치기/접기"></button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="ux-nav-body" id="uxNavBody"></div>' +
      '<div class="ux-rail" id="uxRail" aria-label="그룹 바로가기"></div>';

    var input = document.getElementById('uxSearch');
    input.value = state.q;
    input.addEventListener('input', function () { state.q = input.value.trim(); renderAll(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { input.value = ''; state.q = ''; renderAll(); input.blur(); }
      if (e.key === 'Enter') {
        var first = document.querySelector('#uxNavBody .nav-item');
        if (first) first.click();
      }
    });
    document.getElementById('uxSearchClear').addEventListener('click', function () {
      input.value = ''; state.q = ''; renderAll(); input.focus();
    });
    section.querySelectorAll('.ux-mode button').forEach(function (b) {
      b.addEventListener('click', function () { state.mode = b.getAttribute('data-mode'); saveState(); renderAll(); });
    });
    document.getElementById('uxToggleAll').addEventListener('click', function () {
      var groups = buildGroups(visibleKeys());
      var activeKey = getCurrentKey();
      var anyClosed = groups.some(function (g) { return !isGroupOpen(g, activeKey); });
      groups.forEach(function (g) { state.open[groupStateKey(g.id)] = anyClosed; });
      saveState(); renderAll();
    });
  }

  function renderDivisionTabs() {
    var el = document.getElementById('uxDivTabs');
    if (!el) return;
    var divs = getDivisions();
    el.style.setProperty('--ux-cols', String(Math.min(divs.length, 3) || 1));
    el.innerHTML = divs.map(function (d) {
      var keys = KEYS.filter(function (k) { return META[k].division === d; });
      var openCnt = keys.filter(function (k) { return !META[k].stats.complete; }).length;
      return '<button type="button" role="tab" class="ux-div-tab' + (d === state.division && !state.q ? ' active' : '') + '" data-div="' + esc(d) + '" aria-selected="' + (d === state.division) + '" title="' + esc(d) + ' · 진행중 ' + openCnt + ' / 전체 ' + keys.length + '">' +
        '<span class="ux-div-name">' + esc(shortDivision(d)) + '</span>' +
        '<span class="ux-div-count">' + (state.q ? (keys.filter(function (k) { return matchesQuery(META[k], state.q); }).length + ' 검색') : keys.length) + '</span>' +
      '</button>';
    }).join('');
    el.querySelectorAll('.ux-div-tab').forEach(function (b) {
      b.addEventListener('click', function () {
        if (state.q) {   // 검색 중 Division 클릭 → 검색 해제 후 이동
          state.q = ''; var inp = document.getElementById('uxSearch'); if (inp) inp.value = '';
          state.division = ''; 
        }
        selectDivision(b.getAttribute('data-div'));
      });
    });
  }

  function renderStatusChips() {
    var el = document.getElementById('uxStatusChips');
    if (!el) return;
    var base = visibleKeys({ ignoreStatus: true });
    var counts = {
      all: base.length,
      open: base.filter(function (k) { return !META[k].stats.complete; }).length,
      done: base.filter(function (k) { return META[k].stats.complete; }).length
    };
    el.innerHTML = STATUS_FILTERS.map(function (f) {
      return '<button type="button" role="radio" aria-checked="' + (state.status === f.id) + '" class="ux-chip' + (state.status === f.id ? ' active' : '') + '" data-st="' + f.id + '">' +
        esc(f.label) + '<b>' + counts[f.id] + '</b></button>';
    }).join('');
    el.querySelectorAll('.ux-chip').forEach(function (b) {
      b.addEventListener('click', function () { state.status = b.getAttribute('data-st'); saveState(); renderAll(); });
    });
    document.querySelectorAll('#sheetNavList .ux-mode button').forEach(function (b) {
      var on = b.getAttribute('data-mode') === state.mode;
      b.classList.toggle('active', on);
      b.setAttribute('aria-checked', String(on));
    });
  }

  function itemHtml(key, activeKey) {
    var m = META[key];
    var s = m.stats;
    var tone = pctTone(s.pct, s.complete);
    var active = key === activeKey;
    // 유형 그룹(NPI) 안에서는 반복되는 '2026 NPI-' 접두어를 생략해 핵심어만 노출
    var label = (state.mode === 'type' && !state.q && m.type.id === 'npi') ? m.title.replace(/^20\d\d\s*NPI\s*-\s*/i, '') : m.title;
    var tip = m.full + (s.total ? '\n완료 ' + s.done.toLocaleString() + ' / ' + s.total.toLocaleString() + 'p' : '');
    return '<div class="nav-item ux-item' + (active ? ' active' : '') + (s.complete ? ' is-complete' : '') + '" role="button" tabindex="0"' +
        ' data-key="' + esc(key) + '" data-model-type="' + esc(m.division) + '" title="' + esc(tip) + '" onclick="switchMenu(this)">' +
      '<span class="ux-item-top">' +
        (m.week ? '<span class="ux-wk">W' + m.week + '</span>' : '') +
        '<span class="ni-text ux-title">' + esc(label) + '</span>' +
      '</span>' +
      '<span class="ux-item-bottom">' +
        '<span class="ux-bar tone-' + tone + '"><span style="width:' + Math.max(s.pct, s.pct > 0 ? 3 : 0) + '%"></span></span>' +
        '<span class="ni-badge ux-pct tone-' + tone + '">' + s.pct + '%</span>' +
        (s.complete ? '<span class="ux-done-ic" aria-label="완료">' + ICON.check + '</span>' : '') +
      '</span>' +
    '</div>';
  }

  function renderList() {
    var body = document.getElementById('uxNavBody');
    var rail = document.getElementById('uxRail');
    if (!body) return;
    var activeKey = getCurrentKey();
    var keys = visibleKeys();
    var groups = buildGroups(keys);

    if (!groups.length) {
      body.innerHTML = '<div class="ux-empty">' +
        (state.q ? '<b>“' + esc(state.q) + '”</b> 검색 결과가 없습니다.' : '해당 조건의 Request가 없습니다.') +
        (state.status !== 'all' ? '<button type="button" class="ux-link" id="uxResetStatus">상태 필터 해제</button>' : '') +
        '</div>';
      var rs = document.getElementById('uxResetStatus');
      if (rs) rs.addEventListener('click', function () { state.status = 'all'; saveState(); renderAll(); });
    } else {
      body.innerHTML = groups.map(function (g) {
        var open = isGroupOpen(g, activeKey);
        var hasActive = g.keys.indexOf(activeKey) >= 0;
        var openCnt = g.keys.filter(function (k) { return !META[k].stats.complete; }).length;
        var wk = '';
        if (state.mode === 'month' && g.weeks.length) {
          var mn = Math.min.apply(null, g.weeks), mx = Math.max.apply(null, g.weeks);
          wk = '<span class="ux-g-sub">W' + mn + (mx !== mn ? '–' + mx : '') + '</span>';
        }
        return '<section class="ux-group' + (open ? ' open' : '') + (hasActive ? ' has-active' : '') + '" data-gid="' + esc(g.id) + '">' +
          '<button type="button" class="ux-g-head" aria-expanded="' + open + '">' +
            ICON.chev +
            '<span class="ux-g-label">' + esc(g.label) + '</span>' + wk +
            '<span class="ux-g-meta">' +
              (openCnt ? '<span class="ux-g-open" title="진행중 Request ' + openCnt + '건">진행 ' + openCnt + '</span>' : '<span class="ux-g-alldone" title="모두 완료">완료</span>') +
              '<span class="ux-g-count" title="전체 Request ' + g.keys.length + '건">' + g.keys.length + '</span>' +
            '</span>' +
          '</button>' +
          '<div class="ux-g-items">' + g.keys.map(function (k) { return itemHtml(k, activeKey); }).join('') + '</div>' +
        '</section>';
      }).join('');
    }

    body.querySelectorAll('.ux-g-head').forEach(function (h) {
      h.addEventListener('click', function () {
        var sec = h.parentNode;
        var gid = sec.getAttribute('data-gid');
        var now = !sec.classList.contains('open');
        sec.classList.toggle('open', now);
        h.setAttribute('aria-expanded', String(now));
        state.open[groupStateKey(gid)] = now;
        saveState();
        updateToggleAllIcon();
      });
    });
    body.querySelectorAll('.ux-item').forEach(function (it) {
      it.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); it.click(); }
      });
    });

    // 접힘 상태용 그룹 레일
    if (rail) {
      rail.innerHTML = groups.map(function (g) {
        var hasActive = g.keys.indexOf(activeKey) >= 0;
        return '<button type="button" class="ux-rail-btn' + (hasActive ? ' active' : '') + '" data-gid="' + esc(g.id) + '" title="' + esc(g.label) + ' (' + g.keys.length + ')">' +
          '<span>' + esc(g.abbr) + '</span><i>' + g.keys.length + '</i></button>';
      }).join('');
      rail.querySelectorAll('.ux-rail-btn').forEach(function (b) {
        b.addEventListener('click', function () {
          var gid = b.getAttribute('data-gid');
          state.open[groupStateKey(gid)] = true; saveState();
          if (typeof toggleSidebar === 'function') toggleSidebar();
          renderList();
          var sec = document.querySelector('#uxNavBody .ux-group[data-gid="' + gid + '"]');
          if (sec) setTimeout(function () { sec.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 260);
        });
      });
    }
    updateToggleAllIcon();
  }

  function updateToggleAllIcon() {
    var btn = document.getElementById('uxToggleAll');
    if (!btn) return;
    var secs = document.querySelectorAll('#uxNavBody .ux-group');
    var anyClosed = Array.prototype.some.call(secs, function (s) { return !s.classList.contains('open'); });
    btn.innerHTML = anyClosed ? ICON.expand : ICON.collapse;
    btn.title = anyClosed ? '모두 펼치기' : '모두 접기';
    btn.setAttribute('aria-label', btn.title);
  }

  function renderAll() {
    renderDivisionTabs();
    renderStatusChips();
    renderList();
    var clear = document.getElementById('uxSearchClear');
    if (clear) clear.style.visibility = state.q ? 'visible' : 'hidden';
  }

  function scrollActiveIntoView() {
    var a = document.querySelector('#uxNavBody .nav-item.active');
    var body = document.getElementById('sheetNavList');
    if (!a || !body) return;
    var ar = a.getBoundingClientRect(), br = body.getBoundingClientRect();
    var head = document.querySelector('#sheetNavList .ux-nav-head');
    var top = br.top + (head ? head.offsetHeight : 0);
    if (ar.top < top || ar.bottom > br.bottom) {
      body.scrollTop += ar.top - top - 40;
    }
  }

  function selectDivision(div) {
    if (div === state.division) return;
    state.division = div;
    saveState();
    renderAll();
    var cur = getCurrentKey();
    if (META[cur] && META[cur].division === div) return;
    var first = document.querySelector('#uxNavBody .nav-item');
    if (!first) {
      var k = KEYS.filter(function (x) { return META[x].division === div; }).sort(sortByRecent)[0];
      if (k) { renderList(); first = document.querySelector('#uxNavBody .nav-item[data-key="' + k + '"]'); }
    }
    if (first && typeof window.switchMenu === 'function') window.switchMenu(first);
  }

  /* ── 상단바 · Overview 카드 보강 ─────────────────────────── */
  /* 상단바: 제목은 Overview 카드에서 한 번만 보여주고,
     상단바는 위치(Breadcrumb)만 표시 → 카드가 화면 밖으로 스크롤되면 제목을 compact하게 노출 */
  function renderTopbar() {
    var key = getCurrentKey();
    var m = META[key];
    var t = document.getElementById('topTitle');
    if (!t || !m) return;
    var wrapEl = t.parentNode;
    var crumb = document.getElementById('uxCrumb');
    if (!crumb) {
      crumb = document.createElement('nav');
      crumb.id = 'uxCrumb';
      crumb.className = 'ux-crumb';
      crumb.setAttribute('aria-label', '현재 위치');
      wrapEl.insertBefore(crumb, t);
    }
    var old = document.getElementById('uxTopChips');
    if (old) old.remove();
    crumb.innerHTML =
      '<span class="ux-crumb-root">MS Global Request</span>' +
      '<span class="ux-crumb-sep">/</span><span class="ux-crumb-div">' + esc(m.division) + '</span>' +
      '<span class="ux-crumb-sep">/</span><span>' + esc(state.mode === 'month' && m.month ? m.month + '월' : m.type.label) + '</span>';
    t.textContent = m.title;
    t.title = m.full;
    document.title = m.title + ' · MS Dashboard';
  }

  var titleObserver = null;
  function watchOverviewTitle() {
    var topbar = document.querySelector('.topbar');
    var target = document.querySelector('#contentWrap .ux-ov-title');
    if (!topbar) return;
    if (titleObserver) { titleObserver.disconnect(); titleObserver = null; }
    if (!target || !('IntersectionObserver' in window)) { topbar.classList.remove('ux-title-on'); return; }
    titleObserver = new IntersectionObserver(function (entries) {
      var e = entries[0];
      topbar.classList.toggle('ux-title-on', !e.isIntersecting && e.boundingClientRect.top < 80);
    }, { rootMargin: '-56px 0px 0px 0px', threshold: 0 });
    titleObserver.observe(target);
  }

  /* ── Overview 카드 재구성 ───────────────────────────────── */
  var STATUS_UI = [
    { key: 'Pre-Review',   label: '사전검토', tab: 'Pre-Review',   cls: 'pre' },
    { key: 'In Progress',  label: '작업중',   tab: 'In Progress',  cls: 'wip' },
    { key: 'Corp. Review', label: '법인리뷰', tab: 'Corp. Review', cls: 'corp' },
    { key: 'Done',         label: '완료',     tab: 'Done',         cls: 'done' },
    { key: 'Cancel',       label: '취소',     tab: '',             cls: 'cancel' }
  ];

  /* ── Jira 티켓 링크 ─────────────────────────────────────
     jira-links.js 의 window.JIRA_LINKS 에서 찾음.
     key: 엑셀 Model Name 전체 (예: 'GR26-W30-MS-Audio-xboom speaker PDP update-0731')
          또는 'W30' 같은 요청 주차 키는 지원하지 않음 (Request 단위로 1:1 매핑)
     value: 'https://...atlassian.net/browse/XXX-123' 형태의 전체 URL, 또는 'XXX-123' (JIRA_BASE_URL과 결합) */
  function jiraInfo(m) {
    var map = window.JIRA_LINKS || {};
    var raw = map[m.full] || map[m.full.trim()] || '';
    if (!raw) return null;
    raw = String(raw).trim();
    var url = /^https?:\/\//i.test(raw) ? raw : ((window.JIRA_BASE_URL || '').replace(/\/+$/, '') + '/browse/' + raw);
    var keyMatch = url.match(/([A-Z][A-Z0-9]+-\d+)/);
    return { url: url, key: keyMatch ? keyMatch[1] : 'Jira' };
  }
  function jiraHtml(m) {
    var j = jiraInfo(m);
    var icon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
    if (j) {
      return '<a class="ux-jira" href="' + esc(j.url) + '" target="_blank" rel="noopener" title="Jira 티켓 열기 · ' + esc(j.url) + '">' +
        icon + '<span>Jira</span><b>' + esc(j.key) + '</b>' +
        '<svg class="ux-jira-out" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><polyline points="8 7 17 7 17 16"/></svg></a>';
    }
    return '<span class="ux-jira empty" title="jira-links.js 에 이 Request의 Jira URL을 추가하면 링크로 바뀝니다">' + icon + '<span>Jira 티켓 미연결</span></span>';
  }

  function currentTabValue() {
    try { if (typeof currentTab !== 'undefined') return currentTab; } catch (e) {}
    return 'all';
  }

  function enhanceOverview() {
    var key = getCurrentKey();
    var m = META[key];
    var card = document.querySelector('#contentWrap .ov-card-new');
    var d = window.DATA && window.DATA[key];
    if (!m || !card || !d) return;

    var cs = { Done: 0, total: 0 };
    try { cs = contentStats(key) || cs; } catch (e) {}
    var total = cs.total || 0;
    var done = cs.Done || 0;
    var cancel = cs.Cancel || 0;
    var remain = Math.max(0, total - done - cancel);
    var pct = total ? Math.round(done / total * 100) : 0;
    var info = { sites: 0, pages: total, hasPages: true };
    try { info = getSheetOverviewTotalInfo(d) || info; } catch (e) {}
    var items = d.items || [];
    var countryCnt = function (st) { return items.filter(function (x) { return (x.overall || x.status) === st; }).length; };
    var tab = currentTabValue();

    var seg = STATUS_UI.filter(function (s) { return s.key !== 'Cancel'; }).map(function (s) {
      var v = cs[s.key] || 0;
      if (!v || !total) return '';
      var w = v / total * 100;
      return '<span class="ux-seg ' + s.cls + '" style="flex:' + v + ' 1 0" title="' + s.label + ' ' + v.toLocaleString() + '페이지 (' + Math.round(w) + '%)"></span>';
    }).join('');

    var cards = STATUS_UI.filter(function (s) { return s.key !== 'Cancel'; }).map(function (s) {
      var v = cs[s.key] || 0;
      var share = total ? Math.round(v / total * 100) : 0;
      var cc = countryCnt(s.key);
      var clickable = !!s.tab;
      var active = clickable && tab === s.tab;
      return '<' + (clickable ? 'button type="button"' : 'div') + ' class="ux-stat ' + s.cls + (active ? ' active' : '') + (v ? '' : ' zero') + '"' +
          (clickable ? ' data-tab="' + s.tab + '" title="' + s.label + ' 국가만 표에서 보기"' : '') + '>' +
        '<span class="ux-stat-head"><i></i>' + s.label + '<span class="ux-stat-share">' + share + '%</span></span>' +
        '<span class="ux-stat-num">' + v.toLocaleString() + '</span>' +
        '<span class="ux-stat-meta">' + (cc ? cc + '개국' : '해당 국가 없음') + '</span>' +
      '</' + (clickable ? 'button' : 'div') + '>';
    }).join('');

    card.classList.add('ux-ov');
    card.innerHTML =
      '<div class="ux-ov-head">' +
        '<div class="ux-ov-titleblock">' +
          '<div class="ux-ov-tags">' +
            '<span class="ux-tag div">' + esc(m.division) + '</span>' +
            '<span class="ux-tag">' + esc(m.type.label) + '</span>' +
            (m.week ? '<span class="ux-tag line">W' + m.week + ' 요청' + (m.date ? ' · ' + esc(m.date) : '') + '</span>' : '') +
          '</div>' +
          '<h1 class="ux-ov-title">' + esc(m.title) + '</h1>' +
        '</div>' +
        '<div class="ux-ov-kpis">' +
          '<div class="ux-kpi main"><span class="ux-kpi-label">완료율</span><span class="ux-kpi-val">' + pct + '<small>%</small></span></div>' +
          '<div class="ux-kpi"><span class="ux-kpi-label">Sites</span><span class="ux-kpi-val">' + Number(info.sites || 0).toLocaleString() + '</span></div>' +
          '<div class="ux-kpi"><span class="ux-kpi-label">Pages</span><span class="ux-kpi-val">' + Number(info.hasPages ? info.pages : total).toLocaleString() + '</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="ux-ov-pipe">' +
        '<div class="ux-pipe-row">' +
          '<span class="ux-pipe-title">Status Pipeline <small>페이지 기준</small></span>' +
          '<span class="ux-pipe-sum">' +
            '<span>전체 <b>' + total.toLocaleString() + '</b></span>' +
            '<span>완료 <b class="done">' + done.toLocaleString() + '</b></span>' +
            '<span>잔여 <b>' + remain.toLocaleString() + '</b></span>' +
            (cancel ? '<span class="ux-pipe-cancel">취소 ' + cancel.toLocaleString() + '</span>' : '') +
          '</span>' +
        '</div>' +
        '<div class="ux-pipe-bar" role="img" aria-label="완료율 ' + pct + '%">' + (seg || '<span class="ux-seg empty"></span>') + '</div>' +
      '</div>' +
      '<div class="ux-stat-grid">' + cards + '</div>';

    // 상태 카드 클릭 = 아래 표의 상태 탭 필터와 연동 (다시 클릭하면 전체)
    card.querySelectorAll('.ux-stat[data-tab]').forEach(function (b) {
      b.addEventListener('click', function () {
        var want = b.classList.contains('active') ? 'all' : b.getAttribute('data-tab');
        var tabEl = document.querySelector('#contentWrap .tab[data-tab="' + want + '"]');
        if (tabEl && typeof switchTab === 'function') {
          switchTab(tabEl);
          syncStatCards();
          var area = document.getElementById('dataArea');
          if (area) area.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
    watchOverviewTitle();
  }

  /* ── 국가별 현황 표 정리 (렌더 후 DOM 후처리 · 데이터/필터 로직은 기존 그대로) ── */
  var STATUS_CLASS = { '사전검토': 'pre', '작업중': 'wip', '법인리뷰': 'corp', '완료': 'done', '취소': 'cancel' };
  function shortUrl(href) {
    try {
      var u = new URL(href);
      var path = u.pathname.replace(/\/+$/, '') || '/';
      return (u.hostname.replace(/^www\./, '') === 'lg.com' ? '' : u.hostname) + path;
    } catch (e) { return href; }
  }
  function polishTable() {
    var area = document.getElementById('dataArea');
    if (!area) return;
    var card = area.querySelector('.sheet-table-card');
    if (!card) return;
    card.classList.add('ux-tbl');

    // 1) 헤더: 제목 + 표시 건수 + 지역 필터, 아래 줄에 상태 탭(세그먼트)
    var head = card.querySelector('.sheet-filter-row');
    var tabBar = area.querySelector('.tab-bar-inline');
    var rowsCount = card.querySelectorAll('tbody tr').length;
    if (head) {
      head.classList.add('ux-tbl-head');
      var left = head.querySelector('.sheet-filter-left');
      if (left && !left.querySelector('.ux-tbl-count')) {
        var cnt = document.createElement('span');
        cnt.className = 'ux-tbl-count';
        cnt.textContent = rowsCount + '개 사이트';
        left.appendChild(cnt);
      }
      if (tabBar) {
        tabBar.classList.add('ux-tbl-tabs');
        head.appendChild(tabBar);
      }
    }

    var table = card.querySelector('table.sheet-data-table');
    if (!table) return;
    var ths = Array.prototype.slice.call(table.querySelectorAll('thead th'));
    var hasRegion = ths.length && /^region$/i.test(ths[0].textContent.trim());
    var numIdx = -1, urlIdx = -1, stIdx = -1;
    ths.forEach(function (th, i) {
      var t = th.textContent.trim().toLowerCase();
      if (/^(page#?|pg#?|pages?)$/.test(t)) { numIdx = i; th.classList.add('ux-num'); }
      if (/url/.test(t)) { urlIdx = i; th.classList.add('ux-url-col'); }
      if (/^status$/.test(t)) { stIdx = i; th.classList.add('ux-st-col'); }
      if (i === 0 && hasRegion) th.classList.add('ux-region-col');
    });

    Array.prototype.forEach.call(table.querySelectorAll('tbody tr'), function (tr) {
      var regionCell = tr.querySelector('td.sheet-region-cell');
      if (regionCell) {
        tr.classList.add('ux-grp-start');
        if (!regionCell.querySelector('.ux-region')) {
          regionCell.innerHTML = '<span class="ux-region">' + esc(regionCell.textContent.trim()) + '</span>';
        }
      }
      var offset = (hasRegion && !regionCell) ? -1 : 0;
      var cells = tr.children;
      if (numIdx >= 0 && cells[numIdx + offset]) cells[numIdx + offset].classList.add('ux-num');
      if (urlIdx >= 0 && cells[urlIdx + offset]) cells[urlIdx + offset].classList.add('ux-url-col');
      if (stIdx >= 0 && cells[stIdx + offset]) cells[stIdx + offset].classList.add('ux-st-col');
    });

    // 2) 상태 pill: 텍스트 기준 클래스 부여 (inline 색상 제거 → 공통 토큰 사용)
    Array.prototype.forEach.call(table.querySelectorAll('.sheet-status-pill'), function (pill) {
      var label = pill.textContent.trim();
      var cls = STATUS_CLASS[label];
      if (!cls) return;
      pill.classList.add('ux-pill', 'st-' + cls);
      pill.removeAttribute('style');
      var dot = pill.querySelector('span');
      if (dot) dot.removeAttribute('style');
    });

    // 3) URL: 경로만 짧게 표시 (전체 URL은 툴팁/링크 그대로)
    Array.prototype.forEach.call(table.querySelectorAll('a.sheet-link'), function (a) {
      if (a.classList.contains('ux-link')) return;
      var href = a.getAttribute('href') || '';
      a.classList.add('ux-link');
      a.title = href;
      a.innerHTML = '<span>' + esc(shortUrl(href)) + '</span><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><polyline points="8 7 17 7 17 16"/></svg>';
    });
  }

  function syncStatCards() {
    var tab = currentTabValue();
    document.querySelectorAll('#contentWrap .ux-stat[data-tab]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-tab') === tab);
    });
  }

  /* ── 기존 함수 래핑 ─────────────────────────────────────── */
  function wrap() {
    var origSwitch = window.switchMenu;
    if (typeof origSwitch === 'function' && !origSwitch.__ux) {
      window.switchMenu = function (el) {
        var key = el && el.getAttribute && el.getAttribute('data-key');
        // 다른 Division의 항목이 선택되면 사이드바 Division도 맞춰줌
        if (key && META[key] && META[key].division !== state.division) {
          state.division = META[key].division; saveState();
        }
        var r = origSwitch.apply(this, arguments);
        if (key && META[key]) { state.lastKey = META[key].full; saveState(); }
        renderAll();
        renderTopbar();
        scrollActiveIntoView();
        var main = document.getElementById('mainArea');
        window.scrollTo({ top: 0, behavior: 'auto' });
        if (main) main.scrollTop = 0;
        return r;
      };
      window.switchMenu.__ux = true;
    }

    var origTopbar = window.updateTopbarTitle;
    if (typeof origTopbar === 'function' && !origTopbar.__ux) {
      window.updateTopbarTitle = function () {
        var r = origTopbar.apply(this, arguments);
        renderTopbar();
        return r;
      };
      window.updateTopbarTitle.__ux = true;
    }

    var origRender = window.renderContent;
    if (typeof origRender === 'function' && !origRender.__ux) {
      window.renderContent = function () {
        var r = origRender.apply(this, arguments);
        enhanceOverview();
        return r;
      };
      window.renderContent.__ux = true;
    }

    // 표 렌더 함수가 상단 제목을 원본명으로 다시 덮어쓰므로, 렌더 후 짧은 제목으로 복원
    var origTable = window.renderSheetDrivenTable;
    if (typeof origTable === 'function' && !origTable.__ux) {
      window.renderSheetDrivenTable = function () {
        var r = origTable.apply(this, arguments);
        renderTopbar();
        try { polishTable(); } catch (e) { console.warn('[ux-enhance] table polish skipped', e); }
        return r;
      };
      window.renderSheetDrivenTable.__ux = true;
    }

    var origTab = window.switchTab;
    if (typeof origTab === 'function' && !origTab.__ux) {
      window.switchTab = function () {
        var r = origTab.apply(this, arguments);
        syncStatCards();
        return r;
      };
      window.switchTab.__ux = true;
    }

    // syncNavBadges는 기존 .ni-badge 색상을 inline으로 덮어쓰므로, 이후 진행바 톤을 다시 맞춤
    var origSync = window.syncNavBadges;
    if (typeof origSync === 'function' && !origSync.__ux) {
      window.syncNavBadges = function () {
        var r = origSync.apply(this, arguments);
        document.querySelectorAll('#uxNavBody .ux-pct').forEach(function (b) { b.removeAttribute('style'); });
        return r;
      };
      window.syncNavBadges.__ux = true;
    }

    // 기존 Division 필터 함수가 다른 곳에서 호출돼도 새 사이드바와 충돌하지 않게 연결
    window.applyModelTypeNavVisibility = function (division) { if (division) { state.division = division; renderAll(); } };
    window.switchModelTypeTab = function (division) { selectDivision(division); };
  }

  /* ── 키보드 단축키 ──────────────────────────────────────── */
  function bindKeys() {
    document.addEventListener('keydown', function (e) {
      var tag = (e.target && e.target.tagName) || '';
      var typing = /INPUT|TEXTAREA|SELECT/.test(tag) || (e.target && e.target.isContentEditable);
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey) {
        var input = document.getElementById('uxSearch');
        if (!input) return;
        e.preventDefault();
        var sb = document.getElementById('sidebar');
        if (sb && sb.classList.contains('collapsed') && typeof toggleSidebar === 'function') toggleSidebar();
        if (window.innerWidth <= 768 && typeof openMobileSidebar === 'function') openMobileSidebar();
        input.focus(); input.select();
      }
    });
  }

  /* 상단 '법인 콘텐츠 등록 독려' 버튼: 아이콘을 알림(벨) 아이콘으로 교체 */
  function restyleTopButtons() {
    document.querySelectorAll('.topbar-rpt-group .topbar-rpt-btn').forEach(function (btn) {
      if (!/openStatusBoard/.test(btn.getAttribute('onclick') || '')) return;
      var svg = btn.querySelector('svg');
      if (svg) svg.innerHTML = '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>';
      btn.title = '법인 콘텐츠 등록 독려 현황 열기';
    });
  }

  /* ── init ───────────────────────────────────────────────── */
  function init() {
    if (!window.__DASHBOARD_KEYS || !window.__DASHBOARD_KEYS.length || !window.DATA) return;
    document.documentElement.classList.add('ux-enhanced');
    prepare();
    wrap();
    renderShell();
    renderAll();
    // 시작 화면: 마지막으로 본 Request → 없으면 현재 Division의 최신 Request
    var lastByName = KEYS.filter(function (k) { return META[k].full === state.lastKey; })[0];
    var startKey = lastByName
      || KEYS.filter(function (k) { return META[k].division === state.division; }).sort(sortByRecent)[0];
    if (startKey && startKey !== getCurrentKey()) {
      if (META[startKey].division !== state.division) { state.division = META[startKey].division; renderAll(); }
      var el = document.querySelector('#uxNavBody .nav-item[data-key="' + startKey + '"]');
      if (!el) { state.status = 'all'; renderAll(); el = document.querySelector('#uxNavBody .nav-item[data-key="' + startKey + '"]'); }
      if (el) window.switchMenu(el);
    }
    renderTopbar();
    enhanceOverview();
    bindKeys();
    restyleTopButtons();
    setTimeout(scrollActiveIntoView, 50);
  }

  window.MSDashUX = { init: init, refresh: function () { prepare(); renderAll(); renderTopbar(); }, parseModelName: parseModelName };
})();
