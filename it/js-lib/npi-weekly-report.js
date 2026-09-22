// IT/ID NPI 현황 — 등록 모수와 진행 스냅샷을 섞지 않는 집계.
//
// 등록 모수(data/npi.json)의 bu는 네 갈래다.
//   IT  = IT B2B + IT B2C
//   ID  = Information Display
//   MS(ID&IT), Monitor 는 어느 쪽에도 넣지 않는다. 나누면 양쪽 모수가 틀린다.
// 진행 스냅샷(data/npi-product-status.json)은 IT 제품 현황 42건뿐이라 ID 화면에 단계를 만들지 않는다.
// 등록 건수와 진행 건수는 다른 파일이므로 합산하지 않는다.

var NPI_WEEKLY_IT_BU = { 'IT B2B': 1, 'IT B2C': 1 };
var NPI_WEEKLY_ID_BU = { 'Information Display': 1 };

function npiWeeklyEscape(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function npiWeeklyDeptOfBu(bu) {
  if (NPI_WEEKLY_IT_BU[bu]) return 'IT';
  if (NPI_WEEKLY_ID_BU[bu]) return 'ID';
  return '';
}

function npiWeeklyStatusKey(status) {
  var s = String(status == null ? '' : status).trim();
  if (s === 'Registered') return 'registered';
  if (s === 'Un-registered') return 'unregistered';
  if (s === 'Cancelled') return 'cancelled';
  return 'blank';
}

function npiWeeklyEachRegistrationRow(npiJson, visit) {
  (npiJson && npiJson.months || []).forEach(function (month) {
    (month.rows || []).forEach(function (row) {
      visit(month.month || '', row || {});
    });
  });
}

function npiWeeklyExcludedCatalog(npiJson) {
  var counts = {};
  npiWeeklyEachRegistrationRow(npiJson, function (_month, row) {
    if (npiWeeklyDeptOfBu(row.bu)) return;
    var key = row.bu || '(bu 없음)';
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.keys(counts).sort().map(function (bu) {
    return { bu: bu, total: counts[bu] };
  });
}

function npiWeeklyRegistrationSummary(npiJson, dept, monthFilter) {
  var months = {};
  var monthOrder = [];
  var bus = {};
  var buOrder = [];
  var summary = {
    dept: dept,
    month: monthFilter || '',
    total: 0,
    registered: 0,
    unregistered: 0,
    cancelled: 0,
    blank: 0,
    months: [],
    bus: [],
  };
  npiWeeklyEachRegistrationRow(npiJson, function (month, row) {
    if (npiWeeklyDeptOfBu(row.bu) !== dept) return;
    if (monthFilter && month !== monthFilter) return;
    summary.total += 1;
    summary[npiWeeklyStatusKey(row.status)] += 1;
    if (!months[month]) {
      months[month] = { month: month, total: 0, registered: 0, unregistered: 0, cancelled: 0, blank: 0 };
      monthOrder.push(month);
    }
    months[month].total += 1;
    months[month][npiWeeklyStatusKey(row.status)] += 1;
    var bu = row.bu || '(bu 없음)';
    if (!bus[bu]) {
      bus[bu] = { bu: bu, total: 0, registered: 0, unregistered: 0, cancelled: 0, blank: 0 };
      buOrder.push(bu);
    }
    bus[bu].total += 1;
    bus[bu][npiWeeklyStatusKey(row.status)] += 1;
  });
  summary.months = monthOrder.map(function (month) { return months[month]; });
  summary.bus = buOrder.map(function (bu) { return bus[bu]; });
  return summary;
}

function npiWeeklyRegistrationMonths(npiJson, dept) {
  var seen = {};
  var out = [];
  npiWeeklyEachRegistrationRow(npiJson, function (month, row) {
    if (npiWeeklyDeptOfBu(row.bu) !== dept || seen[month]) return;
    seen[month] = 1;
    out.push(month);
  });
  return out;
}

function npiWeeklyAuditRegistration(summary) {
  var problems = [];
  var statusSum = summary.registered + summary.unregistered + summary.cancelled + summary.blank;
  if (statusSum !== summary.total) {
    problems.push('상태 합 ' + statusSum + '건이 전체 ' + summary.total + '건과 다릅니다.');
  }
  var monthSum = 0;
  (summary.months || []).forEach(function (month) { monthSum += month.total; });
  if (monthSum !== summary.total) {
    problems.push('월별 합 ' + monthSum + '건이 전체 ' + summary.total + '건과 다릅니다.');
  }
  var buSum = 0;
  (summary.bus || []).forEach(function (bu) { buSum += bu.total; });
  if (buSum !== summary.total) {
    problems.push('본부 합 ' + buSum + '건이 전체 ' + summary.total + '건과 다릅니다.');
  }
  return problems;
}

// gp1/v5 Spec Assignment 인정 값. IT 제품 현황 Readiness 기준과 같다.
var NPI_WEEKLY_ASSIGN_OK = {
  'assigned': { gp1: true, v5: true },
  'pdr assigned': { gp1: true, v5: true },
  'new pdr spec - ⓝ': { gp1: true, v5: true },
  'spec need publish': { gp1: true, v5: true },
  'need assign': { gp1: false, v5: true },
  'no pdr spec': { gp1: false, v5: false },
  'no spec': { gp1: false, v5: false },
};

function npiWeeklyStack(row) {
  var tip = String((row && row.readinessTip) || '');
  var matched = tip.match(/·\s*(gp1|v5)\s*$/i);
  return matched ? matched[1].toLowerCase() : '';
}

function npiWeeklyField(row, name) {
  var fields = (row && row.readinessFields) || {};
  return String(fields[name] == null ? '' : fields[name]).trim();
}

function npiWeeklyAssignAccepted(value, stack) {
  var rule = NPI_WEEKLY_ASSIGN_OK[String(value || '').trim().toLowerCase()];
  if (!rule || !stack) return false;
  return !!rule[stack];
}

// Not Ready 행의 실패한 조건만 돌려준다. 라이브이거나 Ready면 빈 배열.
// Local Asset Review 미기재는 실패가 아니다. Need Assign은 v5에서만 인정된다.
function npiWeeklyGaps(row) {
  if (!row || row.stage === 'live' || row.readinessCheck === 'Ready') return [];
  if (row.readinessCheck !== 'Not Ready') return [];
  var stack = npiWeeklyStack(row);
  var gaps = [];
  if (npiWeeklyField(row, 'Spec Status').toUpperCase() !== 'Y') {
    gaps.push('Spec Status');
  }
  var keyFeature = parseInt(npiWeeklyField(row, 'Key Feature'), 10);
  if (!keyFeature || keyFeature < 1) gaps.push('Key Feature');
  if (!npiWeeklyField(row, 'UFN')) gaps.push('UFN');
  var assignment = npiWeeklyField(row, 'Spec Assignment');
  if (!npiWeeklyAssignAccepted(assignment, stack)) {
    gaps.push(stack ? ('Spec Assignment (' + assignment + ', ' + stack + ')') : 'Spec Assignment (스택 미상)');
  }
  var lar = npiWeeklyField(row, 'Local Asset Review').toLowerCase();
  if (lar && lar !== 'confirmed') gaps.push('Local Asset Review');
  if (!gaps.length) gaps.push('Not Ready로 기록됐지만 필드에서 이유를 재현하지 못함');
  return gaps;
}

function npiWeeklyProgressSummary(productStatus) {
  var stage = {};
  var readiness = { Ready: 0, 'Not Ready': 0, '미판정': 0 };
  var rows = [];
  var gaps = [];
  ((productStatus && productStatus.groups) || []).forEach(function (group) {
    (group.rows || []).forEach(function (row) {
      var stageKey = row.stage || 'etc';
      stage[stageKey] = (stage[stageKey] || 0) + 1;
      var verdict = row.readinessCheck || '미판정';
      if (!readiness[verdict] && verdict !== 'Ready' && verdict !== 'Not Ready') verdict = '미판정';
      readiness[verdict] = (readiness[verdict] || 0) + 1;
      var item = {
        stage: stageKey,
        readiness: row.readinessCheck || '미판정',
        model: row.model || '',
        locale: row.locale || '',
        detail: row.detailKr || '',
        gaps: npiWeeklyGaps(row),
      };
      rows.push(item);
      if (item.gaps.length) gaps.push(item);
    });
  });
  var total = rows.length;
  var generatedAt = (productStatus && productStatus.generatedAt) || '';
  return {
    total: total,
    generatedAt: generatedAt,
    sourceFile: (productStatus && productStatus.sourceFile) || '',
    cut: npiWeeklyCut(generatedAt),
    stage: stage,
    readiness: readiness,
    rows: rows,
    gaps: gaps,
  };
}

function npiWeeklyCut(generatedAt) {
  var matched = String(generatedAt || '').match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!matched) return { date: '', week: 0, label: '' };
  var date = new Date(Date.UTC(+matched[1], +matched[2] - 1, +matched[3]));
  var shifted = new Date(date.getTime());
  var day = shifted.getUTCDay() || 7;
  shifted.setUTCDate(shifted.getUTCDate() + 4 - day);
  var yearStart = new Date(Date.UTC(shifted.getUTCFullYear(), 0, 1));
  var week = Math.ceil((((shifted - yearStart) / 86400000) + 1) / 7);
  return {
    date: matched[1] + '-' + matched[2] + '-' + matched[3],
    week: week,
    label: 'W' + String(week),
  };
}

// 법인: 리뷰 단계(client_review, clarify)와 Not Ready. CNX: in_progress, precheck.
// 한 행이 양쪽에 있을 수 있다. 두 목록을 더해 전체 건수로 쓰지 않는다.
function npiWeeklyActions(summary) {
  var subsidiary = [];
  var cnx = [];
  ((summary && summary.rows) || []).forEach(function (item) {
    if (item.stage === 'live' || item.stage === 'cancelled') return;
    if (item.stage === 'in_progress' || item.stage === 'precheck') cnx.push(item);
    if (item.stage === 'client_review' || item.stage === 'clarify' || (item.gaps && item.gaps.length)) {
      subsidiary.push(item);
    }
  });
  return { subsidiary: subsidiary, cnx: cnx };
}

function npiWeeklyAuditActions(summary, actions) {
  var problems = [];
  ((summary && summary.rows) || []).forEach(function (item) {
    if (item.stage === 'live' || item.stage === 'cancelled') return;
    var inSubsidiary = actions.subsidiary.indexOf(item) >= 0;
    var inCnx = actions.cnx.indexOf(item) >= 0;
    if (!inSubsidiary && !inCnx) {
      problems.push('미완료 행이 법인·CNX 목록에 없습니다: ' + (item.locale || '') + ' ' + (item.model || ''));
    }
  });
  return problems;
}

function npiWeeklyAuditProgress(summary) {
  var problems = [];
  if (!summary) return problems;
  var stageSum = 0;
  Object.keys(summary.stage).forEach(function (key) { stageSum += summary.stage[key]; });
  if (stageSum !== summary.total) {
    problems.push('단계 합 ' + stageSum + '건이 진행 스냅샷 ' + summary.total + '건과 다릅니다.');
  }
  var readySum = summary.readiness.Ready + summary.readiness['Not Ready'] + summary.readiness['미판정'];
  if (readySum !== summary.total) {
    problems.push('Readiness 합 ' + readySum + '건이 진행 스냅샷 ' + summary.total + '건과 다릅니다.');
  }
  return problems;
}

function npiWeeklyCountCells(row) {
  return [row.total, row.registered, row.unregistered, row.cancelled, row.blank].map(function (value) {
    return '<td style="padding:8px 10px">' + value + '</td>';
  }).join('');
}

function npiWeeklyTable(headers, body) {
  return '<div style="overflow-x:auto;border:1px solid #E2E8F0;border-radius:10px">' +
    '<table style="width:100%;border-collapse:collapse;font-size:12.5px">' +
    '<thead><tr style="background:#F8FAFC">' + headers.map(function (header) {
      return '<th style="text-align:left;padding:8px 10px;color:#64748B;font-weight:700">' + npiWeeklyEscape(header) + '</th>';
    }).join('') + '</tr></thead><tbody>' + body + '</tbody></table></div>';
}

function npiWeeklyStackForLocale(stacks, locale) {
  var key = String(locale || '').toUpperCase();
  var stack = stacks && stacks[key];
  if (stack === 'gp1' || stack === 'v5') return stack;
  // PIM locale BE는 be_fr·be_nl이고, 둘 다 gp1이다.
  if (key === 'BE') return 'gp1';
  return '';
}

function npiWeeklyCutGaps(row, stack) {
  var gaps = [];
  if (String(row.specStatus || '').trim().toUpperCase() !== 'Y') gaps.push('Spec Status');
  var keyFeature = parseInt(row.keyFeature, 10);
  if (!keyFeature || keyFeature < 1) gaps.push('Key Feature');
  if (!String(row.ufn || '').trim()) gaps.push('UFN');
  var assignment = String(row.specAssignment || '').trim();
  var rule = NPI_WEEKLY_ASSIGN_OK[assignment.toLowerCase()];
  var accepted = false;
  if (rule && stack) accepted = !!rule[stack];
  else if (rule && !stack) accepted = !!(rule.gp1 && rule.v5);
  if (!accepted) {
    gaps.push('Spec Assignment (' + (assignment || '빈값') + (stack ? ', ' + stack : ', 스택 미상') + ')');
  }
  var lar = String(row.localAsset || '').trim().toLowerCase();
  if (lar && lar !== 'confirmed') gaps.push('Local Asset Review');
  return gaps;
}

// 2026-09-14 Readiness 컷. Publish는 완료.
// In Progress는 CNX. Review와 Pre-Check 미충족은 법인. Pre-Check인데 Readiness가 끝나면 CNX 착수.
function npiWeeklyCutActions(cut, dept) {
  var stacks = (cut && cut.stacks) || {};
  var subsidiary = [];
  var cnx = [];
  var published = 0;
  var rows = ((cut && cut.rows) || []).filter(function (row) { return row && row.dept === dept; });
  rows.forEach(function (row) {
    var status = row.status || '';
    if (status === 'Publish') {
      published += 1;
      return;
    }
    var gaps = npiWeeklyCutGaps(row, npiWeeklyStackForLocale(stacks, row.locale));
    var item = {
      locale: row.locale || '',
      site: row.site || '',
      model: row.productId || '',
      stage: status || '미기재',
      detail: row.npiType || '',
      gaps: gaps,
    };
    if (status === 'In Progress') cnx.push(item);
    if (status === 'Review' || status === 'In Progress') {
      if (status === 'Review' || gaps.length) subsidiary.push(item);
    } else if (gaps.length) {
      subsidiary.push(item);
    } else {
      cnx.push(item);
    }
  });
  return {
    total: rows.length,
    published: published,
    subsidiary: subsidiary,
    cnx: cnx,
    rows: rows,
  };
}

function npiWeeklyAuditCut(actions) {
  var problems = [];
  var listed = {};
  actions.subsidiary.concat(actions.cnx).forEach(function (item, index) {
    listed[item.locale + '|' + item.model + '|' + item.stage + '|' + index] = 1;
  });
  var open = actions.total - actions.published;
  var seen = {};
  actions.subsidiary.forEach(function (item) { seen[item.locale + '|' + item.model] = 1; });
  actions.cnx.forEach(function (item) { seen[item.locale + '|' + item.model] = 1; });
  if (Object.keys(seen).length !== open) {
    problems.push('미완료 ' + open + '건 중 담당 목록에 들어간 제품은 ' + Object.keys(seen).length + '건입니다.');
  }
  return problems;
}

var NPI_WEEKLY_STAGES = [
  ['notReady', 'STEP 1', 'Not Ready'],
  ['authoringReady', 'STEP 2', 'Authoring Ready'],
  ['inProgress', 'STEP 3', 'In Progress'],
  ['onHold', 'STEP 4', 'On-Hold'],
  ['underReview', 'STEP 5', 'Under Review'],
  ['published', 'STEP 6', 'Published / Cancelled'],
];

function npiWeeklyTrackerStage(row, gaps) {
  var status = String((row && row.status) || '');
  if (status === 'Publish') return 'published';
  if (status === 'Cancelled') return 'cancelled';
  if (/on-?hold/i.test(status)) return 'onHold';
  if (status === 'Review' || status === 'Under Review') return 'underReview';
  if (status === 'In Progress') return 'inProgress';
  if (gaps && gaps.length) return 'notReady';
  return 'authoringReady';
}

function npiWeeklyActionPhrase(gap) {
  var text = String(gap || '');
  if (text.indexOf('Spec Status') === 0) return 'Spec Status : Ask HQ sales to assign Spec in PDR';
  if (text.indexOf('Spec Assignment') === 0) return 'Spec Assignment : Ask HQ sales to assign Spec in PDR';
  if (text.indexOf('UFN') === 0) return 'UFN: Update in NPI Readiness Check in PIM 2.0';
  if (text.indexOf('Key Feature') === 0) return 'Key Feature : Add Key Feature in PIM 2.0';
  if (text.indexOf('Local Asset') === 0) return 'Local Asset Review : Confirm in PIM 2.0';
  if (text === 'Under Review') return 'Need to review and confirm';
  if (text === 'On-Hold') return 'Need to confirm';
  return text;
}

function npiWeeklyTracker(cut, dept) {
  var stacks = (cut && cut.stacks) || {};
  var buckets = {
    notReady: [], authoringReady: [], inProgress: [], onHold: [], underReview: [], published: [], cancelled: [],
  };
  var rows = ((cut && cut.rows) || []).filter(function (row) { return row && row.dept === dept; });
  rows.forEach(function (row) {
    var gaps = npiWeeklyCutGaps(row, npiWeeklyStackForLocale(stacks, row.locale));
    var stage = npiWeeklyTrackerStage(row, gaps);
    buckets[stage].push({
      locale: row.locale || '',
      site: row.site || '',
      model: row.productId || '',
      npiType: row.npiType || '',
      stage: stage,
      status: row.status || '',
      gaps: gaps,
      specStatus: row.specStatus || '',
      ufn: row.ufn || '',
      keyFeature: row.keyFeature || '',
      specAssignment: row.specAssignment || '',
      localAsset: row.localAsset || '',
    });
  });
  var subsidiary = buckets.notReady.concat(buckets.underReview, buckets.onHold);
  return { total: rows.length, buckets: buckets, subsidiary: subsidiary };
}

function npiWeeklyAuditTracker(tracker) {
  var problems = [];
  var buckets = tracker.buckets;
  var sum = 0;
  Object.keys(buckets).forEach(function (key) { sum += buckets[key].length; });
  if (sum !== tracker.total) problems.push('단계 합 ' + sum + '건이 전체 ' + tracker.total + '건과 다릅니다.');
  var expected = buckets.notReady.length + buckets.underReview.length + buckets.onHold.length;
  if (tracker.subsidiary.length !== expected) {
    problems.push('법인 액션 ' + tracker.subsidiary.length + '건이 Not Ready·Under Review·On-Hold ' + expected + '건과 다릅니다.');
  }
  return problems;
}

function npiWeeklyCutDateLabel(iso) {
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var matched = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matched) return iso || '—';
  return parseInt(matched[3], 10) + ' ' + months[parseInt(matched[2], 10) - 1] + ' ' + matched[1];
}

function npiWeeklyReportHtml(options) {
  var opts = options || {};
  var dept = opts.dept === 'ID' ? 'ID' : 'IT';
  var tracker = opts.weeklyCut ? npiWeeklyTracker(opts.weeklyCut, dept) : null;
  var summary = npiWeeklyRegistrationSummary(opts.registration, dept, opts.month || '');
  var cutActions = tracker ? null : (opts.weeklyCut ? npiWeeklyCutActions(opts.weeklyCut, dept) : null);
  var actions = cutActions || (dept === 'IT' && opts.progressSummary ? npiWeeklyActions(opts.progressSummary) : { subsidiary: [], cnx: [] });
  var problems = (tracker ? npiWeeklyAuditTracker(tracker) : npiWeeklyAuditRegistration(summary)).concat(
    tracker ? [] : (
      cutActions ? npiWeeklyAuditCut(cutActions) : (
        dept === 'IT' && opts.progressSummary
          ? npiWeeklyAuditProgress(opts.progressSummary).concat(npiWeeklyAuditActions(opts.progressSummary, actions))
          : []
      )
    )
  );
  if (tracker) return npiWeeklyTrackerHtml(dept, opts.weeklyCut, tracker, problems);

  var excluded = npiWeeklyExcludedCatalog(opts.registration);
  var months = npiWeeklyRegistrationMonths(opts.registration, dept);
  var title = dept === 'ID' ? 'ID NPI 현황' : 'IT NPI 현황';
  var scope = dept === 'ID'
    ? 'Information Display 만 집계합니다.'
    : 'IT B2B 와 IT B2C 만 집계합니다.';

  var html = '<div style="padding:16px 24px 28px">';
  html += cutActions
    ? npiWeeklyCutCard(dept, opts.weeklyCut, cutActions)
    : npiWeeklyActionCard(dept, opts.progressSummary, actions);
  html += '<div class="ov-card-new" style="margin-top:14px"><div class="ov-head-new"><div class="ov-head-title">';
  html += '<div class="ov-head-eyebrow">NPI · 등록 모수 · 별도 원천</div>';
  html += '<div class="ov-head-name">' + title + '</div>';
  html += '<div style="font-size:var(--fs-caption);font-weight:500;color:#64748B;margin-top:4px;line-height:1.6">' +
    npiWeeklyEscape(scope) + ' 기간 축은 NPI 월입니다. 이 파일에는 주 단위 컷이 없어 주차로 바꾸지 않습니다.</div>';
  html += '</div><div class="ov-head-total"><div class="ov-head-total-num">총 <strong>' + summary.total + '</strong>건</div></div></div>';

  html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0;align-items:center">';
  html += '<label style="font-size:12px;font-weight:700;color:#64748B">NPI 월 ' +
    '<select aria-label="NPI month" onchange="npiWeeklySetMonth(this.value)" style="margin-left:6px;font-size:12px;font-weight:700;padding:5px 8px;border:1px solid #E2E8F0;border-radius:6px">';
  html += '<option value=""' + (opts.month ? '' : ' selected') + '>전체</option>';
  months.forEach(function (month) {
    html += '<option value="' + npiWeeklyEscape(month) + '"' + (opts.month === month ? ' selected' : '') + '>' + npiWeeklyEscape(month) + '</option>';
  });
  html += '</select></label>';
  [
    ['Registered', summary.registered],
    ['Un-registered', summary.unregistered],
    ['Cancelled', summary.cancelled],
    ['미기재', summary.blank],
  ].forEach(function (pair) {
    html += '<span style="border:1px solid #E2E8F0;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;color:#334155">' +
      pair[0] + ' ' + pair[1] + '</span>';
  });
  html += '</div>';

  if (problems.length) {
    html += '<div role="alert" style="margin-bottom:12px;padding:10px 12px;border-radius:8px;background:#FEF2F2;color:#991B1B;font-size:12.5px">' +
      problems.map(npiWeeklyEscape).join('<br>') + '</div>';
  } else {
    html += '<div role="status" style="margin-bottom:12px;padding:10px 12px;border-radius:8px;background:#F0FDF4;color:#166534;font-size:12.5px">상태 합, 월 합, 본부 합이 전체 ' +
      summary.total + '건과 같습니다.</div>';
  }

  html += npiWeeklyTable(
    ['NPI 월', '전체', 'Registered', 'Un-registered', 'Cancelled', '미기재'],
    summary.months.map(function (month) {
      return '<tr style="border-top:1px solid #E2E8F0"><td style="padding:8px 10px">' + npiWeeklyEscape(month.month || '—') + '</td>' + npiWeeklyCountCells(month) + '</tr>';
    }).join('')
  );
  html += '<div style="height:10px"></div>';
  html += npiWeeklyTable(
    ['본부', '전체', 'Registered', 'Un-registered', 'Cancelled', '미기재'],
    summary.bus.map(function (bu) {
      return '<tr style="border-top:1px solid #E2E8F0"><td style="padding:8px 10px">' + npiWeeklyEscape(bu.bu) + '</td>' + npiWeeklyCountCells(bu) + '</tr>';
    }).join('')
  );

  html += '<div style="margin-top:12px;font-size:12px;color:#64748B;line-height:1.6">이 화면에서 뺀 행: ';
  html += excluded.length
    ? excluded.map(function (item) { return npiWeeklyEscape(item.bu) + ' ' + item.total + '건'; }).join(' · ')
    : '없음';
  html += '. MS(ID&amp;IT)는 ID와 IT가 한 값이라 나누지 않습니다. 이 등록 건수는 위의 주간 액션 건수와 더하지 않습니다.</div>';
  html += '</div></div>';
  return html;
}

function npiWeeklyActionRows(items, owner) {
  return items.map(function (item) {
    var reason = owner === 'cnx' ? 'CNX 진행' : '법인 확인';
    if (item.gaps && item.gaps.length) reason += ' · ' + item.gaps.join(', ');
    return '<tr style="border-top:1px solid #E2E8F0">' +
      '<td style="padding:8px 10px">' + npiWeeklyEscape(item.locale) + '</td>' +
      '<td style="padding:8px 10px">' + npiWeeklyEscape(item.model) + '</td>' +
      '<td style="padding:8px 10px">' + npiWeeklyEscape(item.stage) + '</td>' +
      '<td style="padding:8px 10px">' + npiWeeklyEscape(reason) + '</td>' +
      '<td style="padding:8px 10px">' + npiWeeklyEscape(item.detail || '—') + '</td></tr>';
  }).join('');
}

function npiWeeklyTrackerHtml(dept, cut, tracker, problems) {
  var meta = (cut && cut.cut) || {};
  var buckets = tracker.buckets;
  var publishedN = buckets.published.length;
  var cancelledN = buckets.cancelled.length;
  var sites = {};
  function ensureSite(site) {
    if (!sites[site]) {
      sites[site] = { total: 0, notReady: 0, authoringReady: 0, inProgress: 0, onHold: 0, underReview: 0, published: 0, cancelled: 0 };
    }
    return sites[site];
  }
  Object.keys(buckets).forEach(function (stage) {
    buckets[stage].forEach(function (item) {
      var bucket = ensureSite(item.site || '—');
      bucket.total += 1;
      bucket[stage] += 1;
    });
  });
  var scope = dept === 'ID' ? 'PIM Category2 = ID' : 'PIM Category2 = IT, Site = B2B 또는 B2C';
  var html = '<div style="padding:16px 24px 28px">';
  html += '<div class="ov-card-new"><div class="ov-head-new"><div class="ov-head-title">';
  html += '<div class="ov-head-eyebrow">NPI Weekly Status Report</div>';
  html += '<div class="ov-head-name">' + (dept === 'ID' ? 'ID' : 'IT') + '</div>';
  html += '<div style="font-size:12px;font-weight:500;color:#64748B;margin-top:4px;line-height:1.6">Action-focused view by Owner'
    + ' · Data Cut ' + npiWeeklyEscape(npiWeeklyCutDateLabel(meta.date)) + ' ' + npiWeeklyEscape(meta.label || '')
    + ' · NPI Month ' + npiWeeklyEscape(meta.month || '—')
    + ' · ' + npiWeeklyEscape(scope)
    + ' · ' + npiWeeklyEscape(meta.sourceFile || '') + '</div>';
  html += '</div><div class="ov-head-total"><div class="ov-head-total-label">Total NPI</div><div class="ov-head-total-num">' + tracker.total + '</div></div></div>';
  html += '<div style="display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin-top:8px">';
  NPI_WEEKLY_STAGES.forEach(function (stage) {
    var count = stage[0] === 'published' ? publishedN + cancelledN : buckets[stage[0]].length;
    html += '<div style="border:1px solid #E8EAF2;border-radius:12px;padding:10px 12px;background:#fff">';
    html += '<div style="font-size:10px;font-weight:800;letter-spacing:.06em;color:#A50034">' + stage[1] + '</div>';
    html += '<div style="font-size:12px;font-weight:700;color:#334155;margin-top:2px">' + stage[2] + '</div>';
    html += '<div style="font-size:22px;font-weight:800;color:#1A1D2E;margin-top:4px">' + count + '</div></div>';
  });
  html += '</div></div>';

  if (problems.length) {
    html += '<div role="alert" style="margin-top:12px;padding:10px 12px;border-radius:8px;background:#FEF2F2;color:#991B1B;font-size:12.5px">' +
      problems.map(npiWeeklyEscape).join('<br>') + '</div>';
  }

  html += '<div class="ov-card-new" style="margin-top:14px">';
  html += '<div class="ov-head-name" style="font-size:16px">1. NPI Progress Overview</div>';
  var siteKeys = Object.keys(sites).sort();
  var overviewRows = siteKeys.map(function (site) {
    var row = sites[site];
    return '<tr style="border-top:1px solid #E2E8F0"><td style="padding:8px 10px">' + npiWeeklyEscape(site) + '</td>' +
      '<td style="padding:8px 10px">' + row.total + '</td>' +
      '<td style="padding:8px 10px">' + row.notReady + '</td>' +
      '<td style="padding:8px 10px">' + row.authoringReady + '</td>' +
      '<td style="padding:8px 10px">' + row.inProgress + '</td>' +
      '<td style="padding:8px 10px">' + row.onHold + '</td>' +
      '<td style="padding:8px 10px">' + row.underReview + '</td>' +
      '<td style="padding:8px 10px">' + (row.published + row.cancelled) + ' (' + row.published + ' / ' + row.cancelled + ')</td></tr>';
  }).join('');
  overviewRows += '<tr style="border-top:1px solid #E2E8F0;font-weight:800"><td style="padding:8px 10px">Total</td>' +
    '<td style="padding:8px 10px">' + tracker.total + '</td>' +
    '<td style="padding:8px 10px">' + buckets.notReady.length + '</td>' +
    '<td style="padding:8px 10px">' + buckets.authoringReady.length + '</td>' +
    '<td style="padding:8px 10px">' + buckets.inProgress.length + '</td>' +
    '<td style="padding:8px 10px">' + buckets.onHold.length + '</td>' +
    '<td style="padding:8px 10px">' + buckets.underReview.length + '</td>' +
    '<td style="padding:8px 10px">' + (publishedN + cancelledN) + ' (' + publishedN + ' / ' + cancelledN + ')</td></tr>';
  html += npiWeeklyTable(['Site', 'Total', 'Not Ready', 'Authoring Ready', 'In Progress', 'On-Hold', 'Under Review', 'Published / Cancelled'], overviewRows);
  html += '</div>';

  html += '<div class="ov-card-new" style="margin-top:14px">';
  html += '<div class="ov-head-name" style="font-size:16px">2. Action Needed by Owner &amp; Product</div>';
  html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0">';
  html += '<span style="border:1px solid #E2E8F0;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700">Total NPI ' + tracker.total + '</span>';
  html += '<span style="border:1px solid #FDE68A;background:#FFFBEB;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;color:#92400E">Subsidiary Action Needed ' + tracker.subsidiary.length + '</span>';
  html += '<span style="border:1px solid #BBF7D0;background:#F0FDF4;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;color:#166534">Live Completed ' + publishedN + '</span>';
  html += '</div>';
  html += '<div style="font-size:13px;font-weight:800;color:#92400E;margin:8px 0">SUBSIDIARY ACTION NEEDED · ' + tracker.subsidiary.length + ' products</div>';
  html += tracker.subsidiary.length
    ? npiWeeklyTable(['#', 'Site', 'Product ID', 'NPI Type', 'Current Status', 'Action To Do'], tracker.subsidiary.map(function (item, index) {
      var status = item.stage === 'notReady' ? 'Not Ready' : (item.stage === 'underReview' ? 'Under Review' : 'On-Hold');
      var action = (item.gaps && item.gaps.length)
        ? item.gaps.map(npiWeeklyActionPhrase).join('<br>')
        : npiWeeklyActionPhrase(status);
      return '<tr style="border-top:1px solid #E2E8F0">' +
        '<td style="padding:8px 10px">' + (index + 1) + '</td>' +
        '<td style="padding:8px 10px">' + npiWeeklyEscape(item.site) + '</td>' +
        '<td style="padding:8px 10px">' + npiWeeklyEscape(item.model) + '</td>' +
        '<td style="padding:8px 10px">' + npiWeeklyEscape(item.npiType) + '</td>' +
        '<td style="padding:8px 10px">' + status + '</td>' +
        '<td style="padding:8px 10px">' + action + '</td></tr>';
    }).join(''))
    : '<p style="font-size:13px;color:#334155">법인 액션이 없습니다.</p>';
  html += '</div>';

  html += '<div class="ov-card-new" style="margin-top:14px">';
  html += '<div class="ov-head-name" style="font-size:16px">3. Not Ready - Product Readiness Detail</div>';
  html += '<div style="font-size:12px;color:#64748B;margin:8px 0 12px">STEP 1 Not Ready ' + buckets.notReady.length + '건. 값이 비거나 조건에 안 맞는 항목이 액션입니다.</div>';
  html += buckets.notReady.length
    ? npiWeeklyTable(['Site', 'Product ID', 'Spec Status', 'UFN', 'Key Feature', 'Spec Assignment', 'Local Asset Review', 'Exact Action To Do'], buckets.notReady.map(function (item) {
      var action = item.gaps.map(npiWeeklyActionPhrase).join('<br>');
      return '<tr style="border-top:1px solid #E2E8F0">' +
        '<td style="padding:8px 10px">' + npiWeeklyEscape(item.site) + '</td>' +
        '<td style="padding:8px 10px">' + npiWeeklyEscape(item.model) + '</td>' +
        '<td style="padding:8px 10px">' + npiWeeklyEscape(item.specStatus || '—') + '</td>' +
        '<td style="padding:8px 10px">' + npiWeeklyEscape(item.ufn || '—') + '</td>' +
        '<td style="padding:8px 10px">' + npiWeeklyEscape(item.keyFeature || '—') + '</td>' +
        '<td style="padding:8px 10px">' + npiWeeklyEscape(item.specAssignment || '—') + '</td>' +
        '<td style="padding:8px 10px">' + npiWeeklyEscape(item.localAsset || '—') + '</td>' +
        '<td style="padding:8px 10px">' + action + '</td></tr>';
    }).join(''))
    : '<p style="font-size:13px;color:#334155">Not Ready 제품이 없습니다.</p>';
  html += '</div></div>';
  return html;
}

function npiWeeklyCutCard(dept, cut, actions) {
  var meta = (cut && cut.cut) || {};
  var sites = {};
  (actions.rows || []).forEach(function (row) {
    var site = row.site || '—';
    sites[site] = (sites[site] || 0) + 1;
  });
  var html = '<div class="ov-card-new"><div class="ov-head-new"><div class="ov-head-title">';
  html += '<div class="ov-head-eyebrow">NPI · 주간 데이터 컷 · PIM Readiness</div>';
  html += '<div class="ov-head-name">' + (dept === 'ID' ? 'ID' : 'IT') + ' 담당 액션</div>';
  html += '<div style="font-size:var(--fs-caption);font-weight:500;color:#64748B;margin-top:4px;line-height:1.6">데이터 컷 ' +
    npiWeeklyEscape(meta.date || '—') + ' ' + npiWeeklyEscape(meta.label || '') +
    ' · NPI 월 ' + npiWeeklyEscape(meta.month || '—') +
    ' · ' + npiWeeklyEscape(meta.sourceFile || '') +
    '. ' + (dept === 'ID' ? 'PIM Category2 = ID' : 'PIM Category2 = IT, Site = B2B 또는 B2C') +
    '. Publish ' + actions.published + '건은 완료라 목록에서 뺐습니다. 전체 ' + actions.total + '건.</div>';
  html += '</div></div>';
  html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0">';
  html += '<span style="border:1px solid #FDE68A;background:#FFFBEB;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;color:#92400E">법인 액션 ' +
    actions.subsidiary.length + '</span>';
  html += '<span style="border:1px solid #BFDBFE;background:#EFF6FF;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;color:#1E40AF">CNX 액션 ' +
    actions.cnx.length + '</span>';
  Object.keys(sites).sort().forEach(function (site) {
    html += '<span style="border:1px solid #E2E8F0;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700">' +
      npiWeeklyEscape(site) + ' ' + sites[site] + '</span>';
  });
  html += '</div>';
  html += '<div style="font-size:13px;font-weight:800;color:#92400E;margin:8px 0">법인 액션 ' + actions.subsidiary.length + '건</div>';
  html += actions.subsidiary.length
    ? npiWeeklyTable(['Locale', 'Site', 'Product ID', 'NPI Status', '이유'], npiWeeklyActionRows(actions.subsidiary, 'subsidiary'))
    : '<p style="font-size:13px;color:#334155">법인 액션이 없습니다.</p>';
  html += '<div style="font-size:13px;font-weight:800;color:#1E40AF;margin:14px 0 8px">CNX 액션 ' + actions.cnx.length + '건</div>';
  html += actions.cnx.length
    ? npiWeeklyTable(['Locale', 'Site', 'Product ID', 'NPI Status', '이유'], npiWeeklyActionRows(actions.cnx, 'cnx'))
    : '<p style="font-size:13px;color:#334155">CNX 액션이 없습니다.</p>';
  html += '</div>';
  return html;
}

function npiWeeklyActionCard(dept, progress, actions) {
  var html = '<div class="ov-card-new"><div class="ov-head-new"><div class="ov-head-title">';
  html += '<div class="ov-head-eyebrow">NPI · 주간 데이터 컷</div>';
  html += '<div class="ov-head-name">' + (dept === 'ID' ? 'ID' : 'IT') + ' 담당 액션</div>';
  if (dept !== 'IT' || !progress) {
    var idCut = (progress && progress.cut) || { date: '', label: '' };
    html += '<div style="font-size:var(--fs-caption);font-weight:500;color:#64748B;margin-top:4px;line-height:1.6">데이터 컷 ' +
      npiWeeklyEscape(idCut.date || '—') + ' ' + npiWeeklyEscape(idCut.label || '') +
      ' 진행 스냅샷은 ' + npiWeeklyEscape((progress && progress.sourceFile) || 'IT 제품 현황') +
      ' ' + ((progress && progress.total) || 0) + '건입니다. 본부 컬럼이 없어 ID로 거르지 않았고, 이 행으로 법인 액션과 CNX 액션을 만들지 않습니다.</div>';
    html += '</div></div>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0">';
    html += '<span style="border:1px solid #FDE68A;background:#FFFBEB;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;color:#92400E">법인 액션 —</span>';
    html += '<span style="border:1px solid #BFDBFE;background:#EFF6FF;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;color:#1E40AF">CNX 액션 —</span>';
    html += '</div></div>';
    return html;
  }
  var cut = progress.cut || { date: '', label: '' };
  html += '<div style="font-size:var(--fs-caption);font-weight:500;color:#64748B;margin-top:4px;line-height:1.6">데이터 컷 ' +
    npiWeeklyEscape(cut.date || progress.generatedAt || '—') + ' ' + npiWeeklyEscape(cut.label || '') +
    '. 단계 합과 Readiness 합은 각각 ' + progress.total + '건입니다. 법인 목록과 CNX 목록은 서로 더하지 않습니다.</div>';
  html += '</div></div>';
  html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0">';
  html += '<span style="border:1px solid #FDE68A;background:#FFFBEB;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;color:#92400E">법인 액션 ' +
    actions.subsidiary.length + '</span>';
  html += '<span style="border:1px solid #BFDBFE;background:#EFF6FF;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;color:#1E40AF">CNX 액션 ' +
    actions.cnx.length + '</span>';
  Object.keys(progress.stage).forEach(function (key) {
    html += '<span style="border:1px solid #E2E8F0;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700">' +
      npiWeeklyEscape(key) + ' ' + progress.stage[key] + '</span>';
  });
  html += '</div>';
  html += '<div style="font-size:13px;font-weight:800;color:#92400E;margin:8px 0">법인 액션 ' + actions.subsidiary.length + '건</div>';
  html += actions.subsidiary.length
    ? npiWeeklyTable(['Country', 'Model', '단계', '이유', '스냅샷 액션'], npiWeeklyActionRows(actions.subsidiary, 'subsidiary'))
    : '<p style="font-size:13px;color:#334155">법인 액션이 없습니다.</p>';
  html += '<div style="font-size:13px;font-weight:800;color:#1E40AF;margin:14px 0 8px">CNX 액션 ' + actions.cnx.length + '건</div>';
  html += actions.cnx.length
    ? npiWeeklyTable(['Country', 'Model', '단계', '이유', '스냅샷 액션'], npiWeeklyActionRows(actions.cnx, 'cnx'))
    : '<p style="font-size:13px;color:#334155">CNX 액션이 없습니다.</p>';
  html += '</div>';
  return html;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    npiWeeklyDeptOfBu: npiWeeklyDeptOfBu,
    npiWeeklyRegistrationSummary: npiWeeklyRegistrationSummary,
    npiWeeklyAuditRegistration: npiWeeklyAuditRegistration,
    npiWeeklyExcludedCatalog: npiWeeklyExcludedCatalog,
    npiWeeklyGaps: npiWeeklyGaps,
    npiWeeklyProgressSummary: npiWeeklyProgressSummary,
    npiWeeklyAuditProgress: npiWeeklyAuditProgress,
    npiWeeklyCut: npiWeeklyCut,
    npiWeeklyActions: npiWeeklyActions,
    npiWeeklyAuditActions: npiWeeklyAuditActions,
    npiWeeklyCutGaps: npiWeeklyCutGaps,
    npiWeeklyCutActions: npiWeeklyCutActions,
    npiWeeklyAuditCut: npiWeeklyAuditCut,
    npiWeeklyStackForLocale: npiWeeklyStackForLocale,
    npiWeeklyReportHtml: npiWeeklyReportHtml,
    npiWeeklyTracker: npiWeeklyTracker,
    npiWeeklyAuditTracker: npiWeeklyAuditTracker,
  };
}
