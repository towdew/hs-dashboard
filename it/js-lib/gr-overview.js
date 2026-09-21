// GR Overview — /id 티켓 Overview와 같은 랜딩을 Global Request 시트 단위로 그린다.
// 판정(그룹·담당·금주 변경·짧은 제목·건수)은 기존 함수를 재사용한다(이중 구현 금지).

var GR_OVERVIEW_KEY = 'gr_overview';
var GR_OVERVIEW_CHIPS = [
  { id: 'all', label: '전체' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'planned', label: 'Planned' },
  { id: 'done', label: 'Done' },
];

function grOverviewWeekOf(title) {
  var m = String(title == null ? '' : title).match(/\bW(\d{1,2})\b/i);
  return m ? parseInt(m[1], 10) : 0;
}

function grOverviewGroupLabel(group) {
  return { in_progress: 'In Progress', planned: 'Planned', done: 'Done' }[group] || group || '';
}

function grOverviewOneLine(text, max) {
  var s = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
  var n = max == null ? 80 : max;
  return s.length > n ? s.slice(0, n).trim() + '…' : s;
}

function grOverviewEsc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function grOverviewCollectRows(opts) {
  opts = opts || {};
  var data = opts.data || (typeof window !== 'undefined' ? window.DATA : {}) || {};
  var keys = opts.keys || (typeof window !== 'undefined' ? window.__DASHBOARD_KEYS : []) || [];
  var statsFn = opts.contentStats || (typeof contentStats === 'function' ? contentStats : null);
  var groupOf = opts.grTaskGroupOf || (typeof grTaskGroupOf === 'function' ? grTaskGroupOf : null);
  var ownerOf = opts.grOwnerOf || (typeof grOwnerOf === 'function' ? grOwnerOf : null);
  var changeFn = opts.grCountTaskChanges || (typeof grCountTaskChanges === 'function' ? grCountTaskChanges : null);
  var shortFn = opts.grNavShortTitle || (typeof grNavShortTitle === 'function' ? grNavShortTitle : function (t) { return t; });
  var taskKeyOf = opts.grTaskKeyOf || (typeof grTaskKeyOf === 'function' ? grTaskKeyOf : function (t) { return t; });
  var stateMap = opts.stateMap || (typeof window !== 'undefined' && window._grTaskState && window._grTaskState.state) || {};
  var changes = opts.changes || (typeof window !== 'undefined' && window._grChanges && window._grChanges.changes) || {};

  var rows = [];
  (keys || []).forEach(function (key) {
    var d = data[key];
    if (!d || d._custom) return;
    var title = d.displayTitle || d.sheetTabName || d.sheetTitle || d.title || key;
    var cs = statsFn ? (statsFn(key) || {}) : {};
    var cancel = cs.Cancel || 0;
    var total = cs.total || 0;
    var effective = Math.max(total - cancel, 0);
    var done = cs.Done || 0;
    var pct = effective > 0 ? Math.round(done / effective * 100) : 0;
    var taskKey = taskKeyOf(title);
    var override = taskKey ? stateMap[taskKey] : undefined;
    var group = groupOf ? groupOf(pct, override) : (pct >= 100 ? 'done' : 'in_progress');
    var weekly = changeFn ? changeFn(changes, taskKey) : { total: 0, added: 0, changed: 0 };
    rows.push({
      key: key,
      title: title,
      shortTitle: shortFn(title),
      week: grOverviewWeekOf(title),
      group: group,
      owner: ownerOf ? (ownerOf(title) || '') : '',
      pct: pct,
      done: done,
      effective: effective,
      inProgressSites: cs['In Progress'] || 0,
      reviewSites: cs['Corp. Review'] || 0,
      weekly: (weekly && weekly.total) || 0,
      weeklyAdded: (weekly && weekly.added) || 0,
      memo: String(d.weeklyUpdateB2 || d.weeklyUpdateText || '').replace(/\s+/g, ' ').trim(),
    });
  });
  return rows;
}

function grOverviewFilterRows(rows, filter) {
  var f = filter == null || filter === '' ? 'active' : filter;
  return (rows || []).filter(function (r) {
    if (f === 'all') return true;
    if (f === 'active') return r.group === 'in_progress' || r.group === 'planned';
    if (f === 'weekly') return (r.weekly || 0) > 0;
    return r.group === f;
  });
}

function grOverviewKpis(rows) {
  var k = { inProgress: 0, planned: 0, done: 0, wipSites: 0, reviewSites: 0, weeklyChanges: 0 };
  (rows || []).forEach(function (r) {
    if (r.group === 'in_progress') k.inProgress++;
    else if (r.group === 'planned') k.planned++;
    else if (r.group === 'done') k.done++;
    k.wipSites += r.inProgressSites || 0;
    k.reviewSites += r.reviewSites || 0;
    k.weeklyChanges += r.weekly || 0;
  });
  return k;
}

function grOverviewSortRows(rows, sort) {
  var s = sort || 'week';
  var order = { in_progress: 0, planned: 1, done: 2 };
  return (rows || []).slice().sort(function (a, b) {
    if (s === 'owner') {
      var c = String(a.owner || '').localeCompare(String(b.owner || ''), 'ko');
      return c || (b.week - a.week);
    }
    if (s === 'pct') return (a.pct - b.pct) || (b.week - a.week);
    if (s === 'weekly') return (b.weekly - a.weekly) || (b.week - a.week);
    if (b.week !== a.week) return b.week - a.week;
    return (order[a.group] || 9) - (order[b.group] || 9);
  });
}

function grOverviewChipCount(rows, id) {
  return grOverviewFilterRows(rows, id === 'all' ? 'all' : id).length;
}

function grOverviewRenderHtml(opts) {
  opts = opts || {};
  var rows = opts.rows || grOverviewCollectRows(opts);
  var filter = opts.filter || (typeof window !== 'undefined' && window.__grOvFilter) || 'active';
  var sort = opts.sort || (typeof window !== 'undefined' && window.__grOvSort) || 'week';
  var kpis = grOverviewKpis(rows);
  var visible = grOverviewSortRows(grOverviewFilterRows(rows, filter), sort);
  var esc = grOverviewEsc;

  function kpi(n, label) {
    return '<div class="ov-stat-blk"><div class="ov-stat-num">' + n + '</div><div class="ov-stat-cap">' + esc(label) + '</div></div>';
  }
  function opt(v, label) {
    return '<option value="' + v + '"' + (v === sort ? ' selected' : '') + '>' + esc(label) + '</option>';
  }

  var h = [];
  h.push('<div class="ov-card-new">');
  h.push('<div class="ov-head-new"><div class="ov-head-title">');
  h.push('<div class="ov-head-eyebrow">IT Global Request</div>');
  h.push('<div class="ov-head-name">IT 업무 진행 현황</div>');
  h.push('<div class="ov-head-sub">Global Request 태스크 — 진행·예정 기본 표시. 시트 행을 누르면 해당 건으로 이동합니다.</div>');
  h.push('</div><div class="ov-head-total"><div class="ov-head-total-label">In Progress</div>');
  h.push('<div class="ov-head-total-num">' + kpis.inProgress + '</div></div></div>');
  h.push('<div class="ov-stats-row">' +
    kpi(kpis.inProgress, '진행 중 태스크') + '<div class="ov-stat-div"></div>' +
    kpi(kpis.planned, '예정') + '<div class="ov-stat-div"></div>' +
    kpi(kpis.wipSites, '작업중 사이트') + '<div class="ov-stat-div"></div>' +
    kpi(kpis.reviewSites, '법인리뷰 사이트') + '<div class="ov-stat-div"></div>' +
    kpi(kpis.weeklyChanges, '금주 변경') + '<div class="ov-stat-div"></div>' +
    kpi(kpis.done, '완료 태스크') + '</div>');
  h.push('<div class="gr-ov-chips" role="group" aria-label="태스크 필터">');
  GR_OVERVIEW_CHIPS.forEach(function (chip) {
    var n = grOverviewChipCount(rows, chip.id);
    if (chip.id !== 'all' && !n) return;
    h.push('<button type="button" class="gr-ov-chip" data-filter="' + esc(chip.id) + '" aria-pressed="' +
      (chip.id === filter) + '" onclick="setGrOverviewFilter(this.dataset.filter)">' +
      esc(chip.label) + '<b>' + n + '</b></button>');
  });
  h.push('</div></div>');

  h.push('<div class="ov-card-new" style="margin-top:16px">');
  h.push('<div class="gr-ov-bar"><h2>태스크별 현황 <span>' + visible.length + '건</span></h2>');
  h.push('<select id="grOvSort" aria-label="정렬" onchange="setGrOverviewSort(this.value)">' +
    opt('week', '주차 높은순') + opt('owner', '담당자순') +
    opt('pct', '진행률 낮은순') + opt('weekly', '금주 변경순') + '</select></div>');
  h.push('<div class="gr-ov-table-wrap"><table class="gr-ov-table"><thead><tr>' +
    '<th>태스크</th><th>구분</th><th>담당</th><th>완료율</th><th>사이트</th><th>금주 변경</th><th>메모</th>' +
    '</tr></thead><tbody>');
  if (!visible.length) {
    h.push('<tr><td colspan="7" class="gr-ov-empty">조건에 맞는 태스크가 없습니다.</td></tr>');
  }
  visible.forEach(function (r) {
    var week = r.week ? ('W' + r.week) : '';
    h.push('<tr class="gr-ov-row" onclick="switchMenu(\'' + esc(r.key) + '\')">' +
      '<td><div class="gr-ov-title">' + esc(r.shortTitle || r.title) + '</div>' +
      '<div class="gr-ov-key">' + (week ? esc(week) + ' · ' : '') + esc(r.title) + '</div></td>' +
      '<td><span class="gr-ov-badge gr-ov-badge-' + esc(r.group) + '">' + esc(grOverviewGroupLabel(r.group)) + '</span></td>' +
      '<td>' + esc(r.owner || '—') + '</td>' +
      '<td class="gr-ov-num">' + r.pct + '%</td>' +
      '<td class="gr-ov-num">' + r.done + ' / ' + r.effective + '</td>' +
      '<td class="gr-ov-num">' + (r.weekly ? r.weekly : '—') + '</td>' +
      '<td class="gr-ov-memo" title="' + esc(r.memo) + '">' + esc(grOverviewOneLine(r.memo, 80) || '—') + '</td>' +
      '</tr>');
  });
  h.push('</tbody></table></div></div>');
  return h.join('');
}

function setGrOverviewFilter(id) {
  var cur = (typeof window !== 'undefined' && window.__grOvFilter) || 'active';
  if (typeof window !== 'undefined') window.__grOvFilter = (cur === id) ? 'active' : id;
  if (typeof renderContent === 'function') renderContent();
}

function setGrOverviewSort(sort) {
  if (typeof window !== 'undefined') window.__grOvSort = sort || 'week';
  if (typeof renderContent === 'function') renderContent();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GR_OVERVIEW_KEY: GR_OVERVIEW_KEY,
    GR_OVERVIEW_CHIPS: GR_OVERVIEW_CHIPS,
    grOverviewWeekOf: grOverviewWeekOf,
    grOverviewGroupLabel: grOverviewGroupLabel,
    grOverviewOneLine: grOverviewOneLine,
    grOverviewCollectRows: grOverviewCollectRows,
    grOverviewFilterRows: grOverviewFilterRows,
    grOverviewKpis: grOverviewKpis,
    grOverviewSortRows: grOverviewSortRows,
    grOverviewChipCount: grOverviewChipCount,
    grOverviewRenderHtml: grOverviewRenderHtml,
  };
}
