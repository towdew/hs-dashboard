// ════════ 🔒 ACCESS CONTROL ════════
const ACCESS_KEY = 'lg_hs_ops_authed';
const ACCESS_PWD = 'lg1234';

/* 로그인 화면 제거됨 — 인증 없이 바로 대시보드 표시 */

function centerLockCard() {
  const card = document.querySelector('.lock-card');
  if (!card) return;
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const vw = window.innerWidth || document.documentElement.clientWidth;

  // 좌우 여백 강제 적용 (최대폭 460px, 양쪽 24px 마진)
  const sideMargin = 24;
  const maxW = 460;
  const availW = Math.max(0, vw - sideMargin * 2);
  const cardW = Math.min(availW, maxW);
  const horizSpace = (vw - cardW) / 2;
  card.style.width = cardW + 'px';
  card.style.marginLeft = horizSpace + 'px';
  card.style.marginRight = horizSpace + 'px';
  card.style.boxSizing = 'border-box';

  // 상하 중앙 정렬
  const cardH = card.offsetHeight;
  if (cardH < vh) {
    const vSpace = Math.max(0, (vh - cardH) / 2);
    card.style.marginTop = vSpace + 'px';
    card.style.marginBottom = vSpace + 'px';
  }
}

function checkPassword() {
  const input = document.getElementById('lockPassword');
  const wrap  = document.getElementById('lockInputWrap');
  const error = document.getElementById('lockError');
  const val   = input.value.trim();

  if (val === ACCESS_PWD) {
    try { sessionStorage.setItem(ACCESS_KEY, 'true'); } catch(e) {}
    const lock = document.getElementById('lockScreen');
    const app  = document.querySelector('.app');
    if (app) app.style.display = '';  // 대시보드 다시 표시
    if (lock) lock.classList.add('hidden');
    setTimeout(() => {
      if (lock) lock.style.display = 'none';
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }, 400);
  } else {
    wrap.classList.add('error');
    error.classList.add('show');
    input.value = '';
    setTimeout(() => wrap.classList.remove('error'), 500);
    setTimeout(() => input.focus(), 100);
  }
}

function clearLockError() {
  document.getElementById('lockError').classList.remove('show');
}

/* ===== moved from inline <script> block 2 ===== */

// ── DATA ─────────────────────────────────────────────────────
/* DATA 데이터는 json.js로 분리됨 */

/* BG_WEEKS 데이터는 json.js로 분리됨 */

/* 현재 날짜 기준 주차 자동 계산 */
function getISOWeekLabel(date) {
  var d = date ? new Date(date) : new Date();
  d.setHours(0, 0, 0, 0);
  // ISO week: Thursday 기준으로 연도/주차 계산
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  var week1 = new Date(d.getFullYear(), 0, 4);
  var week = 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return 'W' + String(week).padStart(2, '0');
}
function weekNumberOf(w) {
  var m = String(w || '').match(/W(\d+)/i);
  return m ? parseInt(m[1], 10) : 0;
}
function latestWeekKey(obj) {
  if (!obj) return '';
  return Object.keys(obj).sort(function(a, b){ return weekNumberOf(a) - weekNumberOf(b); }).pop() || '';
}
function ensureWeekData(obj, targetWeek) {
  if (!obj || !targetWeek || obj[targetWeek]) return;
  var src = latestWeekKey(obj);
  if (src && obj[src]) obj[targetWeek] = obj[src];
}
// 기본 대시보드는 오늘 기준 현재 주차의 -1주차를 기본값으로 사용
var AUTO_WEEK = getISOWeekLabel(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
function ensureAutoWeekDatasets() {
  ensureWeekData(typeof BG_WEEKS !== 'undefined' ? BG_WEEKS : null, AUTO_WEEK);
  ensureWeekData(typeof ARTICLE_WEEKS !== 'undefined' ? ARTICLE_WEEKS : null, AUTO_WEEK);
  ensureWeekData(typeof ICE_WEEKS !== 'undefined' ? ICE_WEEKS : null, AUTO_WEEK);
  ensureWeekData(typeof MICROSITE_WEEKS !== 'undefined' ? MICROSITE_WEEKS : null, AUTO_WEEK);
  ensureWeekData(typeof WASHTOWER_WEEKS !== 'undefined' ? WASHTOWER_WEEKS : null, AUTO_WEEK);
  ensureWeekData(typeof ALTTEXT_WEEKS !== 'undefined' ? ALTTEXT_WEEKS : null, AUTO_WEEK);
  ensureWeekData(typeof FAQ_WEEKS !== 'undefined' ? FAQ_WEEKS : null, AUTO_WEEK);
  ensureWeekData(typeof PDP_WEEKS !== 'undefined' ? PDP_WEEKS : null, AUTO_WEEK);
  ensureWeekData(typeof VACUUM_WEEKS !== 'undefined' ? VACUUM_WEEKS : null, AUTO_WEEK);
  ensureWeekData(typeof WMO_FAQ_WEEKS !== 'undefined' ? WMO_FAQ_WEEKS : null, AUTO_WEEK);
}
ensureAutoWeekDatasets();

var bgWeek = AUTO_WEEK;
/* ARTICLE_WEEKS 데이터는 json.js로 분리됨 */

var articleWeek = AUTO_WEEK;
/* ICE_WEEKS 데이터는 json.js로 분리됨 */

var iceWeek = AUTO_WEEK;
/* MICROSITE_WEEKS 데이터는 json.js로 분리됨 */

var micrositeWeek = AUTO_WEEK;
/* WASHTOWER_WEEKS 데이터는 json.js로 분리됨 */

var washtowerWeek = AUTO_WEEK;
/* ALTTEXT_WEEKS 데이터는 json.js로 분리됨 */

var alttextWeek = AUTO_WEEK;
/* FAQ_WEEKS 데이터는 json.js로 분리됨 */

var faqWeek = AUTO_WEEK;
/* PDP_WEEKS 데이터는 json.js로 분리됨 */

var pdpWeek = AUTO_WEEK;
/* VACUUM_WEEKS 데이터는 json.js로 분리됨 */

var vacuumWeek = AUTO_WEEK;
/* WMO_FAQ_WEEKS 데이터는 json.js로 분리됨 */

var wmoWeek = AUTO_WEEK;
DATA.wmo_faq = { title: 'MWO PLP FAQ', icon: '', isNew: true, items: [], stats: { Done:0,'Corp. Review':0,'In Progress':0,'Pre-Review':0,Cancel:0,Total:0 } };
/* COL_FULL 데이터는 json.js로 분리됨 */


// ── 🚌 세그먼트 진행 바 (다음지도 스타일) ─────────────────────
// counts: { 'Pre-Review':n, 'In Progress':n, 'Corp. Review':n, 'Done':n }
// opts: { compact: bool, showNumbers: bool, showIcons: bool }
function buildSegmentedBar(counts, opts) {
  opts = opts || {};
  const total = (counts['Pre-Review']||0) + (counts['In Progress']||0) +
                (counts['Corp. Review']||0) + (counts['Done']||0) + (counts['Cancel']||0);
  if (total === 0) return '<div class="seg-bar seg-empty"></div>';

  // 파이프라인 순서: 사전검토 → 작업중 → 법인리뷰 → 완료
  const order = ['Pre-Review','In Progress','Corp. Review','Done','Cancel'];
  const icons = { 'Pre-Review':'P', 'In Progress':'W', 'Corp. Review':'C', 'Done':'✓', 'Cancel':'×' };

  const segs = order
    .filter(st => (counts[st]||0) > 0)
    .map(st => {
      const c = counts[st];
      const w = (c / total) * 100;
      const cfg = SC[st] || { dot:'#94A3B8', label:st };
      const label = ({
        'Pre-Review':'사전검토','In Progress':'작업중',
        'Corp. Review':'법인리뷰','Done':'완료','Cancel':'취소'
      })[st] || st;
      const showNum = opts.showNumbers && w >= 6;
      return `<div class="seg" style="width:${w}%;background:${cfg.dot}" data-tooltip="${label} ${c}건">
        ${showNum ? `<span class="seg-num">${c}</span>` : ''}
      </div>`;
    }).join('');

  const cls = 'seg-bar' + (opts.compact ? ' seg-compact' : '');
  return `<div class="${cls}">${segs}</div>`;
}

// item.statuses 배열에서 카운트 객체 생성
function countsFromStatuses(statuses) {
  const c = {'Pre-Review':0,'In Progress':0,'Corp. Review':0,'Done':0};
  (statuses||[]).forEach(s => { if (c[s] !== undefined) c[s]++; });
  return c;
}

// ── 💎 Toss 스타일 4-Stage 파이프라인 ────────────────────────
function buildTossPipeline(stats, total) {
  const stages = [
    { key:'Pre-Review',   label:'사전검토', color:'#94A3B8' },
    { key:'In Progress',  label:'작업중',   color:'#3B82F6' },
    { key:'Corp. Review', label:'법인리뷰', color:'#F59E0B' },
    { key:'Done',         label:'완료',     color:'#10B981' },
  ];

  // 최다 stage 찾기
  let maxIdx = 0, maxCnt = 0;
  stages.forEach((st, i) => {
    const c = stats[st.key] || 0;
    if (c > maxCnt) { maxCnt = c; maxIdx = i; }
  });
  // 핀 위치: 각 stage가 25% 영역 (4분할) → 중앙 = (idx * 25 + 12.5)%
  const pinPos = (maxIdx * 25) + 12.5;

  const segHtml = stages.map((st, i) => {
    const cnt = stats[st.key] || 0;
    const pct = total > 0 ? Math.round(cnt/total*100) : 0;
    const isActive = (i === maxIdx);
    return `
    <div class="toss-stage ${isActive?'toss-active':''}" data-tooltip="${st.label} ${cnt}건 · ${pct}%">
      <div class="toss-bar" style="background:${st.color}"></div>
      <div class="toss-name" style="color:${st.color}">${st.label}</div>
      <div class="toss-cnt">${cnt.toLocaleString()}</div>
      <div class="toss-pct">${pct}%</div>
    </div>`;
  }).join('<div class="toss-gap"></div>');

  return `
  <div class="toss-pipeline">
    <div class="toss-pin" style="left:${pinPos}%">
      <span class="toss-pin-pill">최다</span>
    </div>
    ${segHtml}
  </div>`;
}

/* STALLED_DAYS 데이터는 json.js로 분리됨 */

window.STALLED_DAYS = STALLED_DAYS;

/* LOCALE_MAP 데이터는 json.js로 분리됨 */


/* REGION_CFG 데이터는 json.js로 분리됨 */

/* REGION_ORDER 데이터는 json.js로 분리됨 */


/* ART_ABBR 데이터는 json.js로 분리됨 */


/* SC 데이터는 json.js로 분리됨 */


// ── STATE ────────────────────────────────────────────────────
let currentKey = (window.__DASHBOARD_KEYS && window.__DASHBOARD_KEYS[0]) || 'buying_guide';
let currentView = 'grid';
let currentTab = 'all';
let filterRegion = '';
let filterPhase = '';
let bgSearchQuery = '';
let sidebarCollapsed = false;

// ── SIDEBAR TOGGLE ───────────────────────────────────────────
function toggleSidebar() {
  sidebarCollapsed = !sidebarCollapsed;
  document.getElementById('sidebar').classList.toggle('collapsed', sidebarCollapsed);
}

// ── MOBILE SIDEBAR ───────────────────────────────────────────
function openMobileSidebar() {
  document.getElementById('sidebar').classList.add('mobile-open');
  document.getElementById('sbBackdrop').classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('mobile-open');
  document.getElementById('sbBackdrop').classList.remove('show');
  document.body.style.overflow = '';
}

// ── 🔍 국가별 현황 조회 ────────────────────────────────────
function openCountryListModal() {
  const d = DATA[currentKey];

  const statusOrder = ['Pre-Review','In Progress','Corp. Review','Done'];
  const statusMeta = {
    'Pre-Review':   { label:'사전검토' },
    'In Progress':  { label:'작업중' },
    'Corp. Review': { label:'법인리뷰' },
    'Done':         { label:'완료' },
  };

  // ── 탭별로 locale → status 맵 생성 ──
  let localeMap = {}; // { locale: status }

  if (currentKey === 'article_list') {
    // Article: 로케일 기준으로 집계 (각 로케일에서 가장 많은 상태)
    const locs = d.locales || [];
    const arts = d.articles || [];
    locs.forEach(loc => {
      if (loc === 'CMR아티클' || loc === 'hub제작국가' || loc === '진행사항' || loc === 'URL') return;
      const cnts = { Done:0, 'Corp. Review':0, 'In Progress':0, 'Pre-Review':0 };
      arts.forEach(a => { const s = a.statuses && a.statuses[loc]; if (s && cnts[s] !== undefined) cnts[s]++; });
      const total = cnts.Done + cnts['Corp. Review'] + cnts['In Progress'] + cnts['Pre-Review'];
      if (!total) return;
      if (cnts.Done === total) localeMap[loc] = 'Done';
      else if (cnts['Corp. Review'] > 0) localeMap[loc] = 'Corp. Review';
      else if (cnts['In Progress'] > 0) localeMap[loc] = 'In Progress';
      else localeMap[loc] = 'Pre-Review';
    });
  } else {
    // items 기반 탭: locale 추출 + 상태
    const items = d.items || [];
    // 중복 국가 확인 (SA-ar, SA-en → SA_ar, SA_en)
    const ccCount = {};
    items.forEach(x => {
      let l = x.locale || '';
      if (l.includes(' - ')) l = l.split(' - ').pop();
      const base = l.split('-')[0].toUpperCase();
      ccCount[base] = (ccCount[base]||0) + 1;
    });
    items.forEach(x => {
      let l = x.locale || '';
      if (l.includes(' - ')) l = l.split(' - ').pop();
      const base = l.split('-')[0].toUpperCase();
      const loc = ccCount[base] > 1 ? l.replace('-','_') : base;
      if (!loc) return;
      const st = x.overall || x.status || 'Pre-Review';
      const cur = localeMap[loc];
      if (!cur) { localeMap[loc] = st; return; }
      const pri = ['Pre-Review','In Progress','Corp. Review','Done'];
      if (pri.indexOf(st) < pri.indexOf(cur)) localeMap[loc] = st;
    });
  }

  const entries = Object.entries(localeMap);
  if (!entries.length) return;

  const groups = statusOrder.map((st, idx) => {
    const cfg = SC[st] || { dot:'#94A3B8', bg:'#F5F6FA', tc:'#6B7280' };
    const locs = entries.filter(([_,s]) => s === st).map(([loc]) => loc).sort();
    if (!locs.length) return '';
    const chips = locs.map(loc => {
      const safeLabel = loc.replace(/'/g, "\\'");
      return `<button class="country-chip"
        style="border-color:${cfg.dot};color:${cfg.tc};background:${cfg.bg}"
        onclick="pickCountry('${safeLabel}')">
        ${loc}
      </button>`;
    }).join('');
    return `
    <div class="cl-group ${idx > 0 ? 'cl-group-divider' : ''}">
      <div class="cl-group-head">
        <div class="cl-group-title">
          <span>${statusMeta[st].label}<span class="cl-group-count-inline">(${d.stats && d.stats[st] != null ? d.stats[st] : locs.length})</span></span>
        </div>
      </div>
      <div class="country-chips">${chips}</div>
    </div>`;
  }).join('');

  const total = entries.length;
  const modalHtml = `
  <div class="modal-overlay" id="countryListModal" onclick="if(event.target===this)closeCountryListModal()">
    <div class="modal-card country-list-card" onclick="event.stopPropagation()">

      <!-- 모던 헤더 -->
      <div class="cl-header">
        <div>
          <div class="cl-eyebrow">REQUEST OVERVIEW</div>
          <div class="cl-title">국가 현황 조회</div>
        </div>
        <button class="modal-close-btn" onclick="closeCountryListModal()"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg></button>
      </div>

      <!-- 국가 그룹 -->
      <div class="modal-body cl-body">
        ${groups}
      </div>
    </div>
  </div>`;

  const existing = document.getElementById('countryListModal');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  requestAnimationFrame(() => {
    setTimeout(() => { const m = document.getElementById('countryListModal'); if (m) m.classList.add('modal-show'); }, 10);
  });
  if (window._listModalEscHandler) document.removeEventListener('keydown', window._listModalEscHandler);
  window._listModalEscHandler = e => { if (e.key === 'Escape') closeCountryListModal(); };
  document.addEventListener('keydown', window._listModalEscHandler);
}

function closeCountryListModal() {
  if (window._listModalEscHandler) {
    document.removeEventListener('keydown', window._listModalEscHandler);
    window._listModalEscHandler = null;
  }
  const m = document.getElementById('countryListModal');
  if (!m) return;
  m.classList.remove('modal-show');
  setTimeout(() => { if (m.parentNode) m.remove(); }, 280);
}

function pickCountry(locale) {
  try {
    closeCountryListModal();
    window._returnToCountryList = true;  // 닫기 시 리스트로 복귀 플래그
    setTimeout(() => {
      try { showCountryModal(locale); }
      catch(e) { console.error('showCountryModal error:', e); }
    }, 300);
  } catch(e) {
    console.error('pickCountry error:', e);
  }
}

// ── 🌍 국가 상세 모달 ────────────────────────────────────
function showCountryModal(locale) {
  const d = DATA[currentKey];
  if (!d) return;
  const allItems = d.items || d.articles || [];

  // locale 코드로 아이템 찾기 (short code → full locale 역매칭)
  function toShort(fullLocale) {
    let l = fullLocale || '';
    if (l.includes(' - ')) l = l.split(' - ').pop();
    return l.split('-')[0].toUpperCase();
  }
  let item = allItems.find(x => x.locale === locale);
  if (!item) item = allItems.find(x => toShort(x.locale) === locale.toUpperCase());
  if (!item) item = allItems.find(x => {
    let l = x.locale || '';
    if (l.includes(' - ')) l = l.split(' - ').pop();
    return l.replace('-','_') === locale;
  });
  if (!item) item = allItems.find(x => x.locale && x.locale.includes(locale));
  if (!item && d.articles) {
    // Article: locale 칩 → 해당 로케일의 아티클별 상태 보여주기
    const arts = d.articles.filter(a => a.statuses && a.statuses[locale] != null);
    if (arts.length) {
      const statusCfg = k => SC[k] || SC['Pre-Review'];
      const cnt = { Done:0,'Corp. Review':0,'In Progress':0,'Pre-Review':0 };
      arts.forEach(a => { const s=a.statuses[locale]; if(s&&cnt[s]!==undefined) cnt[s]++; });
      const total = cnt.Done+cnt['Corp. Review']+cnt['In Progress']+cnt['Pre-Review'];
      const overallSt = cnt.Done===total?'Done':cnt['Corp. Review']?'Corp. Review':cnt['In Progress']?'In Progress':'Pre-Review';
      const oCfg = statusCfg(overallSt);
      const donePct = total ? Math.round(cnt.Done/total*100) : 0;

      const rows = arts.map(a => {
        const st = a.statuses[locale];
        if (!st) return '';
        const c = statusCfg(st);
        const lbl = {'Done':'✓ 완료','Corp. Review':'법인리뷰','In Progress':'작업중','Pre-Review':'○ 사전검토'}[st]||st||'-';
        const redDot = st === 'Corp. Review' ? `<span class="cell-days-ind"><span class="cell-days-dot"></span>${a.corp}건</span>` : '';
        return `
      <div class="country-cell-row">
        <div class="country-cell-left">
          <span class="country-cell-code">#${a.no}</span>
          <span class="country-cell-fullname">${a.title}</span>
        </div>
        <div class="country-cell-right-wrap">
          ${redDot}
          <span class="country-cell-badge" style="background:${c.bg};color:${c.tc}">${lbl}</span>
        </div>
      </div>`;
      }).filter(Boolean).join('');

      const html = `
      <div class="modal-overlay" id="countryModal" onclick="if(event.target===this)closeCountryModal()">
        <div class="modal-card" style="max-width:500px" onclick="event.stopPropagation()">

          <div class="country-modal-header">
            <div class="country-modal-info">
              <div class="country-modal-title">${locale}</div>
              <div class="country-modal-meta">
                <span class="country-modal-status" style="background:${oCfg.bg};color:${oCfg.tc}">${oCfg.label}</span>
                <span style="font-size:11px;color:#9BA3BF">${total}개 아티클</span>
              </div>
            </div>
            <button class="modal-close-btn" onclick="closeCountryModal()"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg></button>
          </div>

          <div class="country-modal-progress">
            <div class="country-prog-row">
              <span class="country-prog-label">아티클 진행률</span>
              <span class="country-prog-stat">${cnt.Done}/${total}
                <span style="color:${oCfg.tc};font-weight:800;font-size:15px;margin-left:6px">${donePct}%</span>
              </span>
            </div>
            ${buildSegmentedBar(cnt, {showNumbers:true, showIcons:true})}
            <div style="font-size:11px;color:#9BA3BF;margin-top:8px">
              ${cnt.Done?'완료 '+cnt.Done+'건 · ':''}${cnt['Corp. Review']?'법인리뷰 '+cnt['Corp. Review']+'건 · ':''}${cnt['In Progress']?'작업중 '+cnt['In Progress']+'건 · ':''}${cnt['Pre-Review']?'사전검토 '+cnt['Pre-Review']+'건':''}
            </div>
          </div>

          <!-- 신호등 현황 -->
          <div class="tl-section">
            <div class="tl-header"><span class="tl-title">신호등 현황</span></div>
            <div class="tl-dots-grid">
              ${arts.map(a => {
                const s = a.statuses[locale];
                if (!s) return '';
                const tlc = {
                  'Done':        {color:'#10B981',glow:'rgba(16,185,129,.35)',pulse:false},
                  'Corp. Review':{color:'#EF4444',glow:'rgba(239,68,68,.35)',pulse:true},
                  'In Progress': {color:'#F59E0B',glow:'rgba(245,158,11,.35)',pulse:false},
                  'Pre-Review':  {color:'#D1D5DB',glow:'transparent',pulse:false},
                }[s] || {color:'#D1D5DB',glow:'transparent',pulse:false};
                return '<div class="tl-dot-wrap"><div class="tl-dot '+(tlc.pulse?'tl-dot-pulse':'')+'" style="background:'+tlc.color+';box-shadow:0 2px 8px '+tlc.glow+'"></div><div class="tl-dot-label">#'+a.no+'</div></div>';
              }).filter(Boolean).join('')}
            </div>
          </div>

          <div class="country-modal-cells">
            <div class="country-cells-title">아티클별 현황 (${total}개 항목)</div>
            ${rows}
          </div>

          <div class="country-modal-actions">
            <div style="width:100%;padding:4px 0;font-size:12px;color:#9BA3BF;text-align:center">
              ${overallSt==='Corp. Review'?'🔴 법인 승인 대기 아티클 있음':overallSt==='In Progress'?'🟡 아티클 제작 진행 중':overallSt==='Done'?'🟢 전체 아티클 완료':'⚪ 사전 검토 단계'}
            </div>
          </div>

        </div>
      </div>`;
      const existing = document.getElementById('countryModal');
      if (existing) existing.remove();
      document.body.insertAdjacentHTML('beforeend', html);
      requestAnimationFrame(() => { setTimeout(() => { const m = document.getElementById('countryModal'); if (m) m.classList.add('modal-show'); }, 10); });
      return;
    }
    return;
  }
  if (!item) return;

  // ── BG 스타일 (statuses 배열) vs Simple 스타일 (단일 status) 분기 ──
  const isBG = Array.isArray(item.statuses) && item.statuses.length > 1 && item.cols;
  const status = item.overall || item.status || 'Pre-Review';
  const cfg = SC[status] || SC['Pre-Review'];

  if (!isBG) {
    // ═══ Simple 탭용 모달 — BG 완전 동일 구조 ═══
    const TL_S = {
      'Done':        { color:'#10B981', glow:'rgba(16,185,129,.35)',  label:'완료',    pulse:false },
      'Corp. Review':{ color:'#EF4444', glow:'rgba(239,68,68,.35)',   label:'법인리뷰', pulse:true  },
      'In Progress': { color:'#F59E0B', glow:'rgba(245,158,11,.35)',  label:'작업중',  pulse:false },
      'Pre-Review':  { color:'#D1D5DB', glow:'transparent',           label:'사전검토', pulse:false },
    };
    const tl  = TL_S[status] || TL_S['Pre-Review'];
    const pct = status==='Done'?100:status==='Corp. Review'?75:status==='In Progress'?50:5;
    const crCount = allItems.filter(x=>(x.status||x.overall)==='Corp. Review').length;

    // 진행률 바 — 단일 상태 직접 렌더 (segmented bar 대신 단순 바)
    const progressBar = `
      <div style="height:8px;border-radius:4px;background:#F0F1F8;overflow:hidden;margin-top:8px">
        <div style="width:${pct}%;height:100%;background:${tl.color};border-radius:4px;transition:width .35s ease"></div>
      </div>`;

    // 신호등 도트 — 해당 국가 단일
    const tlDot = `
    <div class="tl-dot-wrap">
      <div class="tl-dot ${tl.pulse?'tl-dot-pulse':''}"
        style="background:${tl.color};box-shadow:0 2px 8px ${tl.glow}"></div>
      <div class="tl-dot-label">${locale}</div>
    </div>`;

    // 상세 필드 — PTT 제외, BG cell-row 패턴
    const fieldDefs = [
      ['Region',  item.region||''],
      ['Country', item.country||''],
      ['Pages',   item.pages ? item.pages+'페이지' : ''],
      ['Remark',  item.remark||''],
      ['완료일',   item.date||''],
    ].filter(([,v])=>v);

    const urlVal = item.url && item.url.startsWith('http') ? item.url : '';

    const cellRows = fieldDefs.map(([key, val]) => `
    <div class="country-cell-row">
      <div class="country-cell-left">
        <span class="country-cell-code">${key}</span>
      </div>
      <div class="country-cell-right-wrap">
        <span class="country-cell-badge" style="background:#F5F6FA;color:#1A1D2E">${val}</span>
      </div>
    </div>`).join('') + (urlVal ? `
    <div class="country-cell-row">
      <div class="country-cell-left"><span class="country-cell-code">URL</span></div>
      <div class="country-cell-right-wrap">
        <a href="${urlVal}" target="_blank" style="font-size:10px;color:#3B82F6">${urlVal.length>40?urlVal.slice(0,40)+'…':urlVal}</a>
      </div>
    </div>` : '');

    const simpleHtml = `
    <div class="modal-overlay" id="countryModal" onclick="if(event.target===this)closeCountryModal()">
      <div class="modal-card" style="max-width:500px" onclick="event.stopPropagation()">

        <!-- 헤더 — BG 동일 -->
        <div class="country-modal-header">
          <div class="country-modal-info">
            <div class="country-modal-title">${locale}</div>
            <div class="country-modal-meta">
              ${item.region ? `<span class="country-modal-region">${item.region}</span>` : ''}
              <span class="country-modal-status" style="background:${cfg.bg};color:${cfg.tc}">${cfg.label}</span>
            </div>
          </div>
          <button class="modal-close-btn" onclick="closeCountryModal()"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg></button>
        </div>

        <!-- 진행률 — BG 동일 -->
        <div class="country-modal-progress">
          <div class="country-prog-row">
            <span class="country-prog-label">진행률</span>
            <span class="country-prog-stat">
              <span style="color:${tl.color};font-weight:800;font-size:15px">${pct}%</span>
            </span>
          </div>
          ${progressBar}
          <div style="font-size:11px;color:#9BA3BF;margin-top:8px">
            ${status==='Corp. Review' ? `법인리뷰 대기 ${crCount}건 중 1건` : status==='In Progress' ? '콘텐츠 제작 진행 중' : status==='Done' ? '등록 완료' : '사전 검토 단계'}
          </div>
        </div>

        <!-- 신호등 현황 — BG 동일 -->
        <div class="tl-section">
          <div class="tl-header"><span class="tl-title">신호등 현황</span></div>
          <div class="tl-dots-grid">${tlDot}</div>
        </div>

        <!-- 상세 현황 — BG cell-row 동일 -->
        ${(fieldDefs.length || urlVal) ? `
        <div class="country-modal-cells">
          <div class="country-cells-title">상세 정보 (${fieldDefs.length + (urlVal?1:0)}개 항목)</div>
          ${cellRows}
        </div>` : ''}

        <!-- 액션 — BG 동일 -->
        <div class="country-modal-actions">
          ${status === 'Done' && d.dam
            ? `<button class="country-action-btn top3-dam-btn" style="flex:1;justify-content:center" onclick="window.open('${d.dam}','_blank')">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                DAM 경로 열기
               </button>`
            : `<div style="width:100%;padding:4px 0;font-size:12px;color:#9BA3BF;text-align:center">
                ${status==='Corp. Review' ? '🔴 법인 승인 대기 — 담당 PM에게 즉시 독려 필요' : status==='In Progress' ? '🟡 콘텐츠 제작 진행 중' : status==='Done' ? '🟢 등록 완료' : '⚪ 사전 검토 단계'}
               </div>`}
        </div>

      </div>
    </div>`;

    const existing = document.getElementById('countryModal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', simpleHtml);
    requestAnimationFrame(() => {
      setTimeout(() => { const m = document.getElementById('countryModal'); if (m) m.classList.add('modal-show'); }, 10);
    });
    return;
  }

  // ═══ BG 스타일 (11컬럼 상세) ═══

  // 안전 가드: statuses/cols 필수
  const safeStatuses = Array.isArray(item.statuses) ? item.statuses : [];
  const cols  = (Array.isArray(item.cols) && item.cols.length) ? item.cols
              : ['Kit','Ldy','Hub','RT','RF','RS','WT','WF','WS','IK','IL'];

  const bgCfg  = SC[item.overall] || SC['Pre-Review'];
  const counts = countsFromStatuses(safeStatuses);
  const pct    = Math.round((item.done || 0) / 11 * 100);
  const isDone = item.overall === 'Done';
  const days   = (window.STALLED_DAYS && window.STALLED_DAYS[locale]) || null;

  const phaseSt = item.phase === 'Phase 1'
    ? 'background:#EEF2FF;color:#1A2B5E'
    : 'background:#FFF0F2;color:#A50034';

  // 🚦 신호등 색상 정의
  const TL = {
    'Done':         { color:'#10B981', glow:'rgba(16,185,129,.35)',  label:'완료',    pulse:false },
    'In Progress':  { color:'#F59E0B', glow:'rgba(245,158,11,.35)',  label:'작업중',  pulse:false },
    'Corp. Review': { color:'#EF4444', glow:'rgba(239,68,68,.35)',   label:'법인리뷰', pulse:true },
    'Pre-Review':   { color:'#D1D5DB', glow:'transparent',           label:'사전검토', pulse:false },
  };

  const hasRed    = safeStatuses.some(s => s === 'Corp. Review');
  const hasYellow = safeStatuses.some(s => s === 'In Progress');

  const tlBadge = hasRed
    ? `<span class="tl-status-badge" style="color:#EF4444">🔴${days ? ` ${days}일 지연` : ' 법인리뷰 적체'}</span>`
    : hasYellow
    ? `<span class="tl-status-badge" style="color:#D97706">🟡 작업 진행중</span>`
    : isDone
    ? `<span class="tl-status-badge" style="color:#047857">🟢 전체 완료</span>`
    : `<span class="tl-status-badge" style="color:#9BA3BF">⚪ 미시작</span>`;

  const tlDots = cols.map((col, i) => {
    const s  = safeStatuses[i];
    const tl = TL[s] || TL['Pre-Review'];
    return `
    <div class="tl-dot-wrap" data-tooltip="${col} · ${COL_FULL[col]||col} · ${tl.label}">
      <div class="tl-dot ${tl.pulse?'tl-dot-pulse':''}"
        style="background:${tl.color};box-shadow:0 2px 8px ${tl.glow}"></div>
      <div class="tl-dot-label">${col}</div>
    </div>`;
  }).join('');

  const cellRows = cols.map((col, i) => {
    const s    = safeStatuses[i];
    const sCfg = SC[s] || { bg:'#F5F6FA', tc:'#9BA3BF' };
    const lbl  = {'Done':'완료','Corp. Review':'법인리뷰','In Progress':'작업중','Pre-Review':'사전검토'}[s] || s;
    // 법인리뷰 배지는 기존 그대로 유지 (· 일수 미포함)
    let badgeText;
    if (s === 'Done')              badgeText = `✓ ${lbl}`;
    else if (s === 'Pre-Review')   badgeText = `○ ${lbl}`;
    else                            badgeText = lbl;  // Corp.Review, In Progress

    // 법인리뷰 셀: 앞쪽에 🔴 빨간 동그라미 + 일수 텍스트
    const daysInd = (s === 'Corp. Review' && days)
      ? `<span class="cell-days-ind"><span class="cell-days-dot"></span>${days}</span>`
      : '';

    return `
    <div class="country-cell-row">
      <div class="country-cell-left">
        <span class="country-cell-code">${col}</span>
        <span class="country-cell-fullname">${COL_FULL[col]||col}</span>
      </div>
      <div class="country-cell-right-wrap">
        ${daysInd}
        <span class="country-cell-badge" style="background:${sCfg.bg};color:${sCfg.tc}">${badgeText}</span>
      </div>
    </div>`;
  }).join('');

  const summaryParts = [];
  if (counts['Done'])         summaryParts.push(`완료 ${counts['Done']}건`);
  if (counts['Corp. Review']) summaryParts.push(`법인리뷰 대기 ${counts['Corp. Review']}건`);
  if (counts['In Progress'])  summaryParts.push(`작업중 ${counts['In Progress']}건`);
  if (counts['Pre-Review'])   summaryParts.push(`사전검토 ${counts['Pre-Review']}건`);

  const modalHtml = `
  <div class="modal-overlay" id="countryModal" onclick="if(event.target===this)closeCountryModal()">
    <div class="modal-card" style="max-width:500px" onclick="event.stopPropagation()">

      <!-- 헤더 (flag 박스 제거) -->
      <div class="country-modal-header">
        <div class="country-modal-info">
          <div class="country-modal-title">${locale}</div>
          <div class="country-modal-meta">
            <span class="modal-phase-tag" style="${phaseSt}">${item.phase}</span>
            <span class="country-modal-status" style="background:${bgCfg.bg};color:${bgCfg.tc}">${bgCfg.label}</span>
          </div>
        </div>
        <button class="modal-close-btn" onclick="closeCountryModal()"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg></button>
      </div>

      <!-- 진행률 -->
      <div class="country-modal-progress">
        <div class="country-prog-row">
          <span class="country-prog-label">콘텐츠 진행률</span>
          <span class="country-prog-stat">
            <span style="color:${bgCfg.dot};font-weight:800;font-size:15px">${pct}%</span>
          </span>
        </div>
        ${buildSegmentedBar(counts, {showNumbers:true, showIcons:true})}
        <div style="font-size:11px;color:#9BA3BF;margin-top:8px">${summaryParts.join(' · ')}</div>
      </div>

      <!-- 셀 상세 -->
      <div class="country-modal-cells">
        ${cellRows}
      </div>

      <!-- 액션: Done일 때만 DAM 버튼 -->
      ${isDone ? `<div class="country-modal-actions">
        <button class="country-action-btn top3-dam-btn" style="flex:1;justify-content:center" onclick="copyDAMPath(this,'${locale}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
          DAM 경로 복사
        </button>
      </div>` : ''}
    </div>
  </div>`;

  const existing = document.getElementById('countryModal');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  requestAnimationFrame(() => {
    setTimeout(() => {
      const m = document.getElementById('countryModal');
      if (m) m.classList.add('modal-show');
    }, 10);
  });
  // 이전 핸들러가 있다면 먼저 제거 (다중 등록 방지)
  if (window._countryModalEscHandler) {
    document.removeEventListener('keydown', window._countryModalEscHandler);
  }
  window._countryModalEscHandler = function(e) {
    if (e.key === 'Escape') { closeCountryModal(); }
  };
  document.addEventListener('keydown', window._countryModalEscHandler);
}

function closeCountryModal() {
  try {
    // ESC 핸들러 정리
    if (window._countryModalEscHandler) {
      document.removeEventListener('keydown', window._countryModalEscHandler);
      window._countryModalEscHandler = null;
    }
    const m = document.getElementById('countryModal');
    if (!m) return;

    // 리스트에서 진입한 경우 복귀 플래그 확인 후 즉시 클리어
    const shouldReturnToList = window._returnToCountryList === true;
    window._returnToCountryList = false;

    m.classList.remove('modal-show');
    setTimeout(() => {
      try {
        if (m.parentNode) m.remove();
        // 국가 리스트 팝업으로 복귀
        if (shouldReturnToList && typeof openCountryListModal === 'function') {
          openCountryListModal();
        }
      } catch(e) { console.error('modal remove error:', e); }
    }, 280);
  } catch(e) {
    console.error('closeCountryModal error:', e);
  }
}
// ── DAM 경로 복사 ──────────────────────────────────────────
function copyDAMPath(btn, locale) {
  const d = DATA[currentKey] || {};
  // 실제 DAM URL 사용 (데이터에 저장된 AEM 경로)
  const damUrl = d.dam || '';
  const copyText = damUrl || ('/content/dam/lg-electronics/' + (currentKey||'buying-guide') + '/' + (locale||'').toLowerCase().replace(/_/g,'-') + '/');

  const orig = btn.innerHTML;
  const reset = () => { btn.innerHTML = orig; btn.classList.remove('copied'); };

  function doFallback() {
    // textarea 방식 폴백 (인앱 브라우저 호환)
    const ta = document.createElement('textarea');
    ta.value = copyText;
    ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try {
      document.execCommand('copy');
      btn.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> 복사됨!`;
      btn.classList.add('copied');
      setTimeout(reset, 2000);
    } catch(e) {
      prompt('DAM 경로를 직접 복사하세요:', copyText);
    }
    document.body.removeChild(ta);
  }

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(copyText).then(() => {
      btn.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> 복사됨!`;
      btn.classList.add('copied');
      setTimeout(reset, 2000);
    }).catch(doFallback);
  } else {
    doFallback();
  }
}

// ── 📦 STATUS DETAIL MODAL ───────────────────────────────────
function showStatusModal(statusKey) {
  const d = DATA[currentKey];
  const cfg = SC[statusKey] || { dot:'#94A3B8', bg:'#F8FAFC', tc:'#6B7280', label: statusKey };
  const isBG = currentKey === 'buying_guide';

  // 해당 상태 아이템 필터
  let filteredItems = [];
  if (d.items) {
    filteredItems = d.items.filter(x => (x.overall || x.status) === statusKey);
  }

  // 긴급도 설정
  const urgency = {
    'Corp. Review': { icon:'🔴', hint:`${filteredItems.length}개국 법인 승인 대기 — 즉시 독려 필요` },
    'In Progress':  { icon:'🟡', hint:`${filteredItems.length}개국 콘텐츠 제작 진행 중` },
    'Pre-Review':   { icon:'⚪', hint:`${filteredItems.length}개국 아직 제작 시작 전 단계` },
    'Done':         { icon:'✅', hint:`${filteredItems.length}개국 콘텐츠 완료` },
  }[statusKey] || { icon:'ℹ️', hint:'' };

  const cellCount = d.stats?.[statusKey] || filteredItems.length;

  // 행 HTML 생성
  const rowsHtml = filteredItems.length
    ? filteredItems.map(item => {
        if (isBG) {
          const counts = countsFromStatuses(item.statuses || []);
          const phaseSt = item.phase === 'Phase 1'
            ? 'background:#EEF2FF;color:#1A2B5E'
            : 'background:#FFF0F2;color:#A50034';
          return `
          <div class="country-cell-row">
            <div class="country-cell-left" style="flex-direction:column;align-items:flex-start;gap:4px">
              <div style="display:flex;align-items:center;gap:8px">
                <span class="country-cell-code">${item.locale}</span>
                <span class="modal-phase-tag" style="${phaseSt};font-size:9px;padding:2px 6px;border-radius:4px">${item.phase}</span>
                <span style="font-size:10px;color:#9BA3BF">${item.region}</span>
              </div>
              <div style="width:120px">${buildSegmentedBar(counts,{compact:true})}</div>
              <span style="font-size:9px;color:#9BA3BF">${item.done}/11 cells</span>
              ${statusKey === 'Done' ? `<button class="top3-dam-btn" onclick="copyDAMPath(this,'${item.locale}')" style="margin-top:4px">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                DAM 경로 복사
              </button>` : ''}
            </div>
            <div class="country-cell-right-wrap">
              <span class="s-badge" style="color:${cfg.tc}">${cfg.label}</span>
            </div>
          </div>`;
        } else {
          const locale = item.locale || item.country || '';
          return `
          <div class="country-cell-row" onclick="closeModal();setTimeout(()=>showCountryModal('${locale}'),300)" style="cursor:pointer">
            <div class="country-cell-left">
              <span class="country-cell-code">${locale}</span>
              <span class="country-cell-fullname" style="font-size:11px;color:#9BA3BF">${item.region||''}</span>
            </div>
            <div class="country-cell-right-wrap">
              <span class="s-badge" style="color:${cfg.tc}">${cfg.label}</span>
            </div>
          </div>`;
        }
      }).join('')
    : '<div style="padding:28px;text-align:center;color:#9BA3BF;font-size:13px">해당 항목이 없습니다</div>';

  const urgencyMsg = {
    'Corp. Review': '🔴 법인 승인 대기 — 담당 PM에게 즉시 독려 필요',
    'In Progress':  '🟡 콘텐츠 제작 진행 중',
    'Pre-Review':   '⚪ 사전 검토 단계',
    'Done':         '🟢 등록 완료',
  }[statusKey] || '';

  const modalHtml = `
  <div class="modal-overlay" id="statusModal" onclick="if(event.target===this)closeModal()">
    <div class="modal-card" onclick="event.stopPropagation()">

      <!-- 헤더 — BG 스킬 패턴 -->
      <div class="cl-header">
        <div>
          <div class="cl-eyebrow">STATUS OVERVIEW</div>
          <div class="cl-title" style="display:flex;align-items:center;gap:10px">
            ${cfg.label}
            <span style="font-size:14px;color:#9BA3BF;font-weight:600">${filteredItems.length}개국</span>
          </div>
        </div>
        <button class="modal-close-btn" onclick="closeModal()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- 아이템 목록 — country-cell-row 패턴 -->
      <div class="country-modal-cells" style="max-height:60vh;overflow-y:auto">
        <div class="country-cells-title">${cfg.label} 국가 목록 (${filteredItems.length}개 항목)</div>
        ${rowsHtml}
      </div>

      <!-- 푸터 없음 -->

    </div>
  </div>`;

  const existing = document.getElementById('statusModal');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  requestAnimationFrame(() => {
    setTimeout(() => { const m = document.getElementById('statusModal'); if (m) m.classList.add('modal-show'); }, 10);
  });
  if (window._statusModalEscHandler) document.removeEventListener('keydown', window._statusModalEscHandler);
  window._statusModalEscHandler = e => { if (e.key === 'Escape') closeModal(); };
  document.addEventListener('keydown', window._statusModalEscHandler);
}

function closeModal() {
  if (window._statusModalEscHandler) {
    document.removeEventListener('keydown', window._statusModalEscHandler);
    window._statusModalEscHandler = null;
  }
  const m = document.getElementById('statusModal');
  if (!m) return;
  m.classList.remove('modal-show');
  setTimeout(() => { if (m.parentNode) m.remove(); }, 280);
}

// ── LOGOUT ───────────────────────────────────────────────────
function logout(){
  try {
    // 1. 세션 인증 정보 즉시 삭제
    try { sessionStorage.removeItem(ACCESS_KEY); } catch(e) {}
    try { localStorage.removeItem(ACCESS_KEY); } catch(e) {} // 혹시 모를 잔존 데이터까지 정리

    // 2. 모바일 사이드바/백드롭 즉시 닫기
    const sb = document.getElementById('sidebar');
    const bd = document.getElementById('sbBackdrop');
    if (sb) sb.classList.remove('mobile-open');
    if (bd) bd.classList.remove('show');
    document.body.style.overflow = '';
  } catch(e) {
    // 무시 — 다음 단계 reload가 모든 것을 해결
  }

  // 3. 페이지 리로드 → 잠금 화면 자동 노출 (가장 확실한 방법)
  // setTimeout으로 약간 지연하여 모바일 환경에서도 확실히 실행
  setTimeout(function(){
    window.location.reload();
  }, 50);
}


function getDashboardDisplayTitle(d) {
  // 화면에 표시되는 이름은 무조건 각 시트의 B1 값(displayTitle)을 사용합니다.
  // Google Sheet 탭명은 더 이상 표시명/보정명으로 사용하지 않습니다.
  return String((d && d.displayTitle) || '').trim();
}

function normalizeDashboardSheetTitle(title) {
  return String(title || '').trim();
}


function normalizeSheetStatKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9가-힣#]/g, '');
}

function pickSheetRowValue(row, names) {
  row = row || {};
  var keys = Object.keys(row);
  for (var i = 0; i < names.length; i++) {
    var target = normalizeSheetStatKey(names[i]);
    for (var k = 0; k < keys.length; k++) {
      if (normalizeSheetStatKey(keys[k]) === target && row[keys[k]] !== '') return row[keys[k]];
    }
  }
  for (var i2 = 0; i2 < names.length; i2++) {
    var target2 = normalizeSheetStatKey(names[i2]);
    for (var k2 = 0; k2 < keys.length; k2++) {
      if (normalizeSheetStatKey(keys[k2]).indexOf(target2) >= 0 && row[keys[k2]] !== '') return row[keys[k2]];
    }
  }
  return '';
}

function toSheetStatNumber(value) {
  var m = String(value == null ? '' : value).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  var n = Number(m ? m[0] : '');
  return isNaN(n) ? 0 : n;
}

function detectSheetStatusValue(value) {
  var raw = String(value == null ? '' : value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!raw) return '';
  var compact = raw.toLowerCase().replace(/[\s_\-/.]+/g, ' ').trim();
  var noSpace = compact.replace(/\s+/g, '');

  if (['완료','등록완료','done','complete','completed','closed'].indexOf(compact) >= 0 || ['완료','등록완료'].indexOf(noSpace) >= 0) return 'Done';
  if (['법인리뷰','법인 리뷰','corp review','corp. review','client review'].indexOf(compact) >= 0 || noSpace === '법인리뷰' || noSpace === 'corpreview' || noSpace === 'clientreview') return 'Corp. Review';
  if (['진행중','작업중','in progress','wip','working'].indexOf(compact) >= 0 || noSpace === '진행중' || noSpace === '작업중' || noSpace === 'inprogress') return 'In Progress';
  if (['사전검토','사전 검토','pre review','pre-review'].indexOf(compact) >= 0 || noSpace === '사전검토' || noSpace === 'prereview') return 'Pre-Review';
  if (['취소','cancel','cancelled','canceled'].indexOf(compact) >= 0 || noSpace === '취소') return 'Cancel';
  return '';
}

function countStatusCellsInSheetRow(row, sheetData) {
  var counts = { Done:0, 'Corp. Review':0, 'In Progress':0, 'Pre-Review':0, Cancel:0, total:0 };
  var exceptionRules = window.SHEET_EXCEPTION_RULES || null;
  var isExceptionSheet = !!(exceptionRules && typeof exceptionRules.isExceptionSheet === 'function' && exceptionRules.isExceptionSheet(sheetData));
  var isDamHeaderFn = exceptionRules && typeof exceptionRules.isDamHeader === 'function' ? exceptionRules.isDamHeader : null;

  Object.keys(row || {}).forEach(function(k) {
    if (k === '__styles') return;

    var rawValue = row[k];
    var st = detectSheetStatusValue(rawValue);

    // 예외 시트에서는 URL 값 자체를 화면에서 완료 pill로 바꾸기 때문에,
    // Page# 컬럼이 없을 때 URL 셀 1개도 완료 1 Page로 집계합니다.
    // DAM 링크는 완료 카운트가 아니므로 제외합니다.
    if (!st && isExceptionSheet && isUrlLikeSheetValue(rawValue)) {
      var isDam = isDamHeaderFn ? isDamHeaderFn(k) : /dam/i.test(String(k || ''));
      if (!isDam) st = 'Done';
    }

    if (!st) return;
    if (counts[st] == null) counts[st] = 0;
    counts[st] += 1;
    counts.total += 1;
  });
  return counts;
}

function isUrlLikeSheetValue(value) {
  var text = String(value == null ? '' : value).trim();
  if (!text) return false;
  if (/^https?:\/\//i.test(text)) return true;
  // 이미 HTML 링크로 렌더링된 값이 다시 들어온 경우도 대비
  return /href=["']https?:\/\//i.test(text);
}

function getSheetPageCountInfo(d) {
  d = d || {};
  var rows = Array.isArray(d.tableRows) ? d.tableRows : [];
  var items = Array.isArray(d.items) ? d.items : [];
  var pageCandidates = ['Page#', 'Pg#', 'Pages', 'Page', 'Total Page#', 'Total Pages'];
  var statusCandidates = ['Status', 'status', '진행상태', '상태', 'Task Status in PTT', 'Result'];
  var info = {
    hasPages: false,
    hasPageColumn: false,
    isStatusFallback: false,
    total: 0,
    byStatus: { Done:0, 'Corp. Review':0, 'In Progress':0, 'Pre-Review':0, Cancel:0 }
  };

  function addCount(status, count) {
    status = normalizeStatus(status);
    count = Number(count || 0);
    if (info.byStatus[status] == null) info.byStatus[status] = 0;
    info.byStatus[status] += count;
    info.total += count;
  }

  if (rows.length) {
    rows.forEach(function(row) {
      var rawPage = pickSheetRowValue(row, pageCandidates);
      if (rawPage === '') return;
      info.hasPageColumn = true;
      info.hasPages = true;
      addCount(pickSheetRowValue(row, statusCandidates), toSheetStatNumber(rawPage));
    });

    // Page# 컬럼이 없는 시트는 표 안의 실제 Status 값 개수를 Page# 정보로 대체 집계합니다.
    // 완료 / 법인리뷰 / 진행중 / 사전검토 같은 상태값 셀 1개 = 1 Page로 계산합니다.
    if (!info.hasPageColumn) {
      rows.forEach(function(row) {
        var cellCounts = countStatusCellsInSheetRow(row, d);
        if (!cellCounts.total) return;
        info.hasPages = true;
        info.isStatusFallback = true;
        Object.keys(cellCounts).forEach(function(st) {
          if (st === 'total' || !cellCounts[st]) return;
          addCount(st, cellCounts[st]);
        });
      });
    }
  } else {
    items.forEach(function(item) {
      if (!item || item.pages == null || item.pages === '') return;
      info.hasPageColumn = true;
      info.hasPages = true;
      addCount(item.overall || item.status || 'Pre-Review', toSheetStatNumber(item.pages));
    });

    if (!info.hasPageColumn && items.length) {
      items.forEach(function(item) {
        if (!item) return;
        var st = detectSheetStatusValue(item.overall || item.status || '');
        if (!st) return;
        info.hasPages = true;
        info.isStatusFallback = true;
        addCount(st, 1);
      });
    }
  }
  return info;
}

function splitSheetCountrySiteValues(value) {
  var raw = String(value == null ? '' : value).trim();
  if (!raw) return [];
  return raw
    .split(/\s*(?:\r?\n|\/|,|;)\s*/)
    .map(function(v) { return String(v || '').trim(); })
    .filter(Boolean);
}

function findCountryValueHeaderForCount(d) {
  d = d || {};
  var preferred = ['contry', 'country', 'pdpcountry', 'locale', 'market', '국가', '법인', 'subsidiary'];
  var headers = Array.isArray(d.tableHeaders) ? d.tableHeaders : [];
  var rows = Array.isArray(d.tableRows) ? d.tableRows : [];
  var keys = headers.length ? headers.slice() : (rows[0] ? Object.keys(rows[0]) : []);

  function scoreHeader(h) {
    var n = normalizeSheetHeaderName(h);
    if (!n || n === 'region' || n === '__styles') return 999;
    if (n === 'contry') return 0;
    if (n === 'country') return 1;
    if (n === 'countryname') return 2;
    if (n === 'pdpcountry') return 3;
    if (n === 'locale') return 4;
    if (n === 'market' || n === '국가' || n === '법인' || n === 'subsidiary') return 5;
    if (n.indexOf('contry') >= 0) return 6;
    if (n.indexOf('country') >= 0) return 7;
    if (n.indexOf('locale') >= 0) return 8;
    return 999;
  }

  var best = '';
  var bestScore = 999;
  keys.forEach(function(h) {
    var sc = scoreHeader(h);
    if (sc < bestScore) {
      bestScore = sc;
      best = h;
    }
  });
  return bestScore < 999 ? best : '';
}

function countSheetCountrySites(d) {
  d = d || {};

  // Sheet-specific exception: 일부 시트는 국가가 body Country 컬럼이 아니라 thead(th) 컬럼으로 구성됩니다.
  // 예외 규칙에서 Site 수를 반환하면 그 값을 우선 사용합니다.
  var exceptionRules = window.SHEET_EXCEPTION_RULES || null;
  if (exceptionRules && typeof exceptionRules.getSiteCount === 'function') {
    var exceptionCount = exceptionRules.getSiteCount(d);
    if (exceptionCount != null && !isNaN(Number(exceptionCount))) return Number(exceptionCount) || 0;
  }

  var rows = Array.isArray(d.tableRows) ? d.tableRows : [];
  var items = Array.isArray(d.items) ? d.items : [];
  var count = 0;

  // Sheet 기반 대시보드는 실제 표의 Country/Contry 컬럼에 표시되는 값만 Sites로 계산합니다.
  // 중복 제거하지 않으며, 빈 값은 제외합니다. CA-fr, SA_ar도 각각 1 Site입니다.
  if (rows.length) {
    var countryHeader = findCountryValueHeaderForCount(d);
    if (!countryHeader) return 0;
    rows.forEach(function(row) {
      var c = row && row[countryHeader];
      if (!c) return;
      var parts = splitSheetCountrySiteValues(c);
      count += parts.length || 1;
    });
    return count;
  }

  items.forEach(function(x) {
    var c = x && (x.country || x.locale);
    if (!c) return;
    var parts = splitSheetCountrySiteValues(c);
    count += parts.length || 1;
  });
  return count || 0;
}

function getSheetOverviewTotalInfo(d) {
  d = d || {};
  var rows = Array.isArray(d.tableRows) ? d.tableRows : [];
  var items = Array.isArray(d.items) ? d.items : [];

  var pageInfo = getSheetPageCountInfo(d);
  // Sites는 표의 Country/Contry/PDP Country/Locale 컬럼에 실제로 나오는 값 개수만 사용합니다.
  // row 수 fallback을 쓰면 Country 수와 달라지므로 제거했습니다.
  var sites = countSheetCountrySites(d) || 0;
  var text = sites.toLocaleString() + ' Sites';
  if (pageInfo.hasPages) text += ' / ' + pageInfo.total.toLocaleString() + ' Pages';
  return { sites: sites, pages: pageInfo.total, hasPages: pageInfo.hasPages, text: text };
}


function getWeeklyUpdateItems(d) {
  d = d || {};
  var items = [];

  function isWeeklyNA(value) {
    var v = String(value == null ? '' : value).replace(/\u00a0/g, ' ').trim();
    return !v || /^N\/?A$/i.test(v) || /^NA$/i.test(v) || v === '-' || v === '—';
  }

  // B2 is a fixed management cell outside the Head table.
  // Read every possible copy saved by sheet-loader, then rawMatrix B2 as a last resort.
  var candidates = [
    d.weeklyUpdateB2,
    d.weeklyUpdateText,
    d.metaCells && d.metaCells.B2,
    d.rawMatrix && d.rawMatrix[1] && d.rawMatrix[1][1],
    d.matrix && d.matrix[1] && d.matrix[1][1]
  ];

  var sourceText = '';
  for (var ci = 0; ci < candidates.length; ci++) {
    var candidate = String(candidates[ci] == null ? '' : candidates[ci]).replace(/\u00a0/g, ' ').trim();
    if (candidate && !isWeeklyNA(candidate)) { sourceText = candidate; break; }
  }

  if (sourceText) {
    items = parseWeeklyUpdateTextForDisplay(sourceText);
    if (!items.length) items = [{ country: '신규 항목', url: '', text: sourceText }];
  } else if (Array.isArray(d.weeklyUpdates) && d.weeklyUpdates.length) {
    items = d.weeklyUpdates.slice();
  }

  if (!items.length) return [];

  var seen = {};
  return items.map(function(item) {
    var country = String(item && item.country || '').trim();
    var url = String(item && item.url || '').trim();
    var text = String(item && (item.text || item.label || item.title) || '').trim();
    var isCancelled = !!(item && item.isCancelled);
    var cancelCount = isCancelled ? Math.max(1, Number(item && item.cancelCount) || getWeeklyUpdateCancelCount(text)) : 0;
    if (!text && url) text = url;
    if (isWeeklyNA(text) && !url) return null;
    var key = country + '|' + url + '|' + text + '|' + (isCancelled ? 'cancelled' : 'completed');
    if (seen[key]) return null;
    seen[key] = true;
    return {
      country: country || '신규 항목',
      url: url,
      text: text,
      isCancelled: isCancelled,
      cancelCount: cancelCount
    };
  }).filter(Boolean);
}

function getWeeklyUpdateCancelMeta(value) {
  var raw = String(value == null ? '' : value).replace(/\u00a0/g, ' ').trim();
  var match = raw.match(/^(취소|cancel(?:led)?)(?:\s*[-:：]\s*|\s+|$)(.*)$/i);
  if (!match) return { isCancelled: false, text: raw, cancelCount: 0 };

  var text = String(match[2] || '').trim();
  return {
    isCancelled: true,
    text: text,
    cancelCount: getWeeklyUpdateCancelCount(text || raw)
  };
}

function getWeeklyUpdateCancelCount(value) {
  var match = String(value == null ? '' : value).match(/(\d+)\s*건/);
  var count = match ? parseInt(match[1], 10) : 1;
  return (!isNaN(count) && count > 0) ? count : 1;
}

function splitWeeklyUpdateDisplayChunks(raw) {
  raw = String(raw || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
  if (!raw) return [];

  var lines = raw.split(/\n+/).map(function(v){ return v.trim(); }).filter(Boolean);
  var chunks = [];

  lines.forEach(function(line) {
    // B2가 줄바꿈 없이 "CA-en : url... CA-fr : url..."처럼 들어온 경우도 보정합니다.
    var markerRe = /(^|\s)([^:：\n]{1,40}?)\s*[：:]\s*(?=https?:\/\/)/ig;
    var markers = [];
    var m;
    while ((m = markerRe.exec(line))) {
      markers.push({ index: m.index + (m[1] ? m[1].length : 0) });
    }

    if (markers.length > 1) {
      for (var i = 0; i < markers.length; i++) {
        var part = line.slice(markers[i].index, i + 1 < markers.length ? markers[i + 1].index : line.length).trim();
        if (part) chunks.push(part);
      }
    } else {
      chunks.push(line);
    }
  });

  // 세미콜론으로 여러 항목을 넣은 경우도 분리합니다. URL 내부의 문자는 건드리지 않습니다.
  var expanded = [];
  chunks.forEach(function(chunk) {
    String(chunk || '').split(/\s*;\s*/).forEach(function(part) {
      part = part.trim();
      if (part) expanded.push(part);
    });
  });
  return expanded;
}

function parseWeeklyUpdateTextForDisplay(value) {
  var raw = String(value == null ? '' : value)
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
  if (!raw) return [];

  var chunks = splitWeeklyUpdateDisplayChunks(raw);
  var out = [];

  chunks.forEach(function(part) {
    var text = String(part || '').trim();
    if (!text) return;

    // 국가 : URL 또는 국가 : 취소 - 설명 형태를 지원합니다.
    var kv = text.match(/^([^:：]{1,40})\s*[：:]\s*(.+)$/);
    if (kv) {
      var country = kv[1].trim() || '신규 항목';
      var rawBody = kv[2].trim();
      var cancelMeta = getWeeklyUpdateCancelMeta(rawBody);
      var body = cancelMeta.text;
      var urlRe = /https?:\/\/[^\s,;]+/ig;
      var matches = [];
      var m;
      while ((m = urlRe.exec(body))) matches.push(m[0].replace(/[),.;]+$/g, ''));

      if (matches.length) {
        matches.forEach(function(url) {
          out.push({
            country: country,
            url: url,
            text: url,
            isCancelled: cancelMeta.isCancelled,
            cancelCount: cancelMeta.isCancelled ? 1 : 0
          });
        });
      } else {
        out.push({
          country: country,
          url: '',
          text: body || rawBody || text,
          isCancelled: cancelMeta.isCancelled,
          cancelCount: cancelMeta.cancelCount
        });
      }
      return;
    }

    var singleCancelMeta = getWeeklyUpdateCancelMeta(text);
    if (singleCancelMeta.isCancelled) {
      out.push({
        country: '신규 항목',
        url: '',
        text: singleCancelMeta.text || text,
        isCancelled: true,
        cancelCount: singleCancelMeta.cancelCount
      });
      return;
    }

    var singleUrl = text.match(/https?:\/\/\S+/i);
    if (singleUrl) {
      var url = singleUrl[0].replace(/[),.;]+$/g, '');
      var before = text.slice(0, singleUrl.index).replace(/[：:>-]+\s*$/g, '').trim();
      out.push({ country: before || '신규 항목', url: url, text: url, isCancelled: false, cancelCount: 0 });
      return;
    }

    out.push({ country: '신규 항목', url: '', text: text, isCancelled: false, cancelCount: 0 });
  });

  return out.filter(Boolean);
}

function getRequestWeekFromSheetData(d) {
  var v = d && (d.requestWeek || d.requestWeekB4 || (d.metaCells && d.metaCells.B4));
  v = String(v == null ? '' : v).replace(/ /g, ' ').trim();
  if (!v || /^N\/?A$/i.test(v) || /^NA$/i.test(v) || v === '-' || v === '—') return '';
  return v;
}

function renderRequestWeekMeta(d) {
  var week = getRequestWeekFromSheetData(d);
  if (!week) return '';
  return '<div class="request-week-meta" title="Excel B4 요청주차">' +
    '<span class="request-week-label">Week of Request</span>' +
    '<span class="request-week-value">' + escapeHtmlSheet(week) + '</span>' +
  '</div>';
}

function renderWeeklyUpdateSection(d) {
  var items = getWeeklyUpdateItems(d);
  if (!items.length) return '';

  // 취소 문구는 완료 카운트에서 제외하고, 목록에는 취소 항목으로 별도 표시합니다.
  var completedCount = items.filter(function(item) {
    return !item.isCancelled;
  }).length;

  // 같은 국가에 URL이 여러 개 있는 경우, 국가는 한 번만 노출하고 URL만 옆으로 나열합니다.
  var groups = [];
  var groupMap = {};
  items.forEach(function(item) {
    var country = String(item && item.country || '신규 항목').trim() || '신규 항목';
    var key = country.toLowerCase();
    if (!groupMap[key]) {
      groupMap[key] = { country: country, items: [] };
      groups.push(groupMap[key]);
    }
    groupMap[key].items.push(item);
  });

  function shortUrlLabel(url, fallback) {
    var label = String(url || fallback || '').trim();
    if (url) label = String(url).replace(/^https?:\/\//i, '').replace(/^www\./i, '');
    if (label.length > 78) label = label.slice(0, 78) + '…';
    return label;
  }

  var list = groups.map(function(group) {
    var country = group.country || '신규 항목';
    // "신규 항목" 같은 라벨은 국가명 변환하지 않고 그대로 둡니다.
    var displayCountry = /^(신규|new|update|공지|항목)/i.test(country) ? country : displayCountryFullName(country);
    var links = group.items.map(function(item) {
      var text = shortUrlLabel(item.url, item.text || item.url || '');

      if (item.isCancelled) {
        return '<span class="weekly-update-url weekly-update-url-cancelled" title="취소된 항목">' +
          '<span class="weekly-update-cancel-badge">취소</span>' +
          '<span class="weekly-update-line-text">' + escapeHtmlSheet(text) + '</span>' +
        '</span>';
      }

      if (item.url) {
        return '<a class="weekly-update-url" href="' + escapeAttrSheet(item.url) + '" target="_blank" rel="noopener" title="' + escapeAttrSheet(item.url) + '">' +
          '<span class="weekly-update-line-text">' + escapeHtmlSheet(text) + '</span>' +
          '<span class="weekly-update-line-open" aria-hidden="true">↗</span>' +
        '</a>';
      }
      return '<span class="weekly-update-url weekly-update-url-text">' + escapeHtmlSheet(text) + '</span>';
    }).join('');

    var cancelOnlyClass = group.items.length && group.items.every(function(item) {
      return !!item.isCancelled;
    }) ? ' is-cancel-only' : '';

    return '<div class="weekly-update-group' + cancelOnlyClass + '">' +
      '<span class="weekly-update-line-country">' + escapeHtmlSheet(displayCountry) + '</span>' +
      '<span class="weekly-update-url-list">' + links + '</span>' +
    '</div>';
  }).join('');

  return '' +
    '<section class="weekly-update-section" aria-label="이번주 업데이트 사항">' +
      '<div class="weekly-update-notice">' +
        '<div class="weekly-update-mainline">' +
          '<span class="weekly-update-new-badge">NEW</span>' +
          '<span class="weekly-update-desc">이번 주에 새로 완료된 항목 ' + completedCount.toLocaleString() + '건입니다.</span>' +
        '</div>' +
        '<div class="weekly-update-items">' + list + '</div>' +
      '</div>' +
    '</section>';
}

function renderOverviewTotalInfo(d) {
  var info = getSheetOverviewTotalInfo(d);
  var pagesHtml = info.hasPages
    ? '<div class="ov-head-total-chip ov-head-total-chip-pages"><span class="ov-head-total-value">' + info.pages.toLocaleString() + '</span><span class="ov-head-total-unit">Pages</span></div>'
    : '';
  return '<div class="ov-head-total-stack">' +
    '<div class="ov-head-total-chip ov-head-total-chip-sites"><span class="ov-head-total-value">' + info.sites.toLocaleString() + '</span><span class="ov-head-total-unit">Sites</span></div>' +
    pagesHtml +
  '</div>';
}

function getPrevIsoWeekLabelForMeta() {
  try {
    if (typeof AUTO_WEEK !== 'undefined' && AUTO_WEEK) return AUTO_WEEK;
    if (typeof getISOWeekLabel === 'function') return getISOWeekLabel(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  } catch(e) {}
  return 'W--';
}

function updateTopbarTitle() {
  if ((!currentKey || !DATA[currentKey]) && window.__DASHBOARD_KEYS && window.__DASHBOARD_KEYS.length) {
    currentKey = window.__DASHBOARD_KEYS[0];
  }
  var t = document.getElementById('topTitle');
  var meta = document.getElementById('topMeta');
  if (t && DATA[currentKey]) t.textContent = getDashboardDisplayTitle(DATA[currentKey]);
  if (meta) meta.textContent = getPrevIsoWeekLabelForMeta();
}

// ── MENU SWITCH ──────────────────────────────────────────────
function switchMenu(el) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  el.classList.add('active');
  currentKey = el.dataset.key;
  currentTab = 'all'; currentView = 'grid'; filterRegion = ''; filterPhase = '';
  const d = DATA[currentKey];
  updateTopbarTitle();
  updateHQ();
  renderContent();
  // 모바일에서 메뉴 선택 시 자동으로 사이드바 닫기
  if (window.innerWidth <= 768) closeMobileSidebar();
}

// ── HQ INSIGHTS ──────────────────────────────────────────────
function updateHQ() {
  // HQ 스트립은 이제 날짜만 표시. 동적 업데이트 불필요.
}

// ── RENDER CONTENT ───────────────────────────────────────────
function renderContent() {
  updateTopbarTitle();
  const wrap = document.getElementById('contentWrap');
  wrap.innerHTML = '';

  const d = DATA[currentKey];
  const cs = contentStats(currentKey);
  const s = cs;
  const prevStats = d && d.prevWeekData ? contentStatsForData(d.prevWeekData, currentKey) : null;
  const done = cs.Done || 0, total = cs.total || 1;
  const pct = Math.round(done/total*100);
  // 블록형 통계: 국가 수 / 콘텐츠(항목) 수
  var _list = (currentKey==='article_list') ? (d.articles||[]) : (d.items||[]);
  var _ctryset = {};
  _list.forEach(function(x){ var c = x.country || x.locale; if(c) _ctryset[c]=1; });
  var countryCount = Object.keys(_ctryset).length;
  var contentCount = _list.length;

  // ── NEW Overall Status Card ──────────────────────────────
  const stats4 = ['Pre-Review','In Progress','Corp. Review','Done'];
  const statBoxes = stats4.map(k => {
    const v = s[k] || 0;
    const cfg = SC[k];
    const sharePct = total > 0 ? Math.round(v/total*100) : 0;
    // 로케일/국가 수 계산 (overall 또는 status 기준)
    const localeCount = d.items
      ? d.items.filter(x => (x.overall || x.status) === k).length
      : 0;
    return `
    <div class="stat-new" style="--sc:${cfg.dot}" >
      <div class="stat-new-head">
        <span class="stat-new-dot" style="background:${cfg.dot}"></span>
        <span class="stat-new-label">${cfg.label}</span>
        ${localeCount ? `<span class="stat-locale-info">(${localeCount}개국)</span>` : ''}
        
      </div>
      <div class="stat-new-value-row">
        <div class="stat-new-num">${v.toLocaleString()}</div>
        ${renderPrevWeekStatDelta(v, prevStats, k, cfg)}
      </div>
      <div class="stat-new-meta">
        <span class="stat-new-pct">${sharePct}%</span>
        <div class="stat-new-bar"><div class="stat-new-fill" style="width:${sharePct}%;background:${cfg.dot}"></div></div>
      </div>
    </div>`;
  }).join('');

  const regionOpts = getRegions().map(r => `<option value="${r}">${r}</option>`).join('');
  const phaseOpts  = getPhases().map(p => `<option value="${p}">${p}</option>`).join('');

  const overviewHtml = `
  <div style="padding:16px 24px 0;flex-shrink:0">
    <div class="ov-card-new">
      <!-- Header -->
      <div class="ov-head-new">
        <div class="ov-head-title">
          <div class="ov-head-eyebrow">Overall Status${renderRequestWeekMeta(d)}</div>
          <div class="ov-title-line">
            <div class="ov-head-name" style="display:flex;align-items:center;gap:9px">${getDashboardDisplayTitle(d)}${(currentKey==='buying_guide'||currentKey==='article_list') ? '<button onclick="openPagePreview()" title="페이지 미리보기" style="width:28px;height:28px;border:1.5px solid #E0E4F0;border-radius:8px;background:#fff;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0;flex-shrink:0"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg></button>' : ''}</div>
          </div>
        </div>
        <div class="ov-head-total">
          <div class="ov-head-total-label" style="display: none;">Total Request</div>
          <div class="ov-head-total-num ov-head-total-sites">${renderOverviewTotalInfo(d)}</div>
        </div>
      </div>

      <!-- Overall Progress — 세그먼트 파이프라인 바 -->
      <div class="ov-progress-new">
        <div class="ov-progress-row-new">
          <span class="ov-progress-label-new">Status Pipeline</span>
          <span class="ov-progress-pct-new">${pct}<span style="font-size:14px;font-weight:700">%</span></span>
        </div>
        ${buildSegmentedBar(s, {showNumbers:true, showIcons:true})}
        <div class="ov-progress-sub-new">전체 ${total.toLocaleString()}건 중 <strong style="color:#1A1D2E">${done.toLocaleString()}건 등록 완료</strong> · 잔여 ${(total-done).toLocaleString()}건 — 사전검토 → 작업중 → 법인검토 → 등록 완료</div>
      </div>

      <!-- Stat Cards -->
      <div class="stat-grid-new">${statBoxes}</div>
      ${renderCancelSummaryBelowStats(d, s)}
      ${renderWeeklyUpdateSection(d)}


            <!-- 필터는 각 render 함수에서 풀 테이블 위에 표시 -->
    </div>
  </div>`;
  wrap.insertAdjacentHTML('beforeend', overviewHtml);

  // ── Data area (탭바·필터는 각 render 함수 안에서 표시) ────
  wrap.insertAdjacentHTML('beforeend', '<div class="data-area" id="dataArea"></div>');
  renderTable();
  syncNavBadges();
  syncWeekSelector();
}

function buildTabs(s) {
  const d = DATA[currentKey];
  const allItems = d.items || d.articles || [];
  var pageCountInfo = getSheetPageCountInfo(d);
  let tabCounts = {
    all: pageCountInfo.hasPages ? (s.total || s.Total || pageCountInfo.total || 0) : allItems.length,
    Done: s.Done||0,
    'Corp. Review': s['Corp. Review']||0,
    'In Progress': s['In Progress']||0,
    'Pre-Review': s['Pre-Review']||0,
  };

  // stats가 셀 단위인 경우 → 아이템 단위로 재계산. Page#가 있는 시트는 Page# 합계 기준 유지.
  if (!pageCountInfo.hasPages && allItems.length && s.Total && s.Total !== allItems.length) {
    if (d.articles) {
      // Article List: 로케일 기준 카운트
      const locs = d.locales || [];
      function _locOv(loc) {
        let dn=0,cr=0,wp=0,pr=0;
        d.articles.forEach(a=>{ const s=a.statuses[loc]; if(s==='Done')dn++; else if(s==='Corp. Review')cr++; else if(s==='In Progress')wp++; else if(s==='Pre-Review')pr++; });
        if(!dn&&!cr&&!wp&&!pr) return null;
        if(cr>0) return 'Corp. Review';
        if(wp>0) return 'In Progress';
        if(dn>0&&!cr&&!wp&&!pr) return 'Done';
        return 'Pre-Review';
      }
      tabCounts.all = locs.length;
      tabCounts.Done = locs.filter(l=>_locOv(l)==='Done').length;
      tabCounts['Corp. Review'] = locs.filter(l=>_locOv(l)==='Corp. Review').length;
      tabCounts['In Progress'] = locs.filter(l=>_locOv(l)==='In Progress').length;
      tabCounts['Pre-Review'] = locs.filter(l=>_locOv(l)==='Pre-Review').length;
    } else {
      // BG / alttext / pdp_gallery / vacuum: 아이템 단위
      tabCounts.Done = allItems.filter(x => (x.overall||x.status) === 'Done').length;
      tabCounts['Corp. Review'] = allItems.filter(x => (x.overall||x.status) === 'Corp. Review').length;
      tabCounts['In Progress'] = allItems.filter(x => (x.overall||x.status) === 'In Progress').length;
      tabCounts['Pre-Review'] = allItems.filter(x => (x.overall||x.status) === 'Pre-Review').length;
    }
  }

  const tabs = [
    {key:'all', label:'All Status', cnt: tabCounts.all},
    {key:'Done', label:'완료', cnt: tabCounts.Done},
    {key:'Corp. Review', label:'법인리뷰', cnt: tabCounts['Corp. Review']},
    {key:'In Progress', label:'작업중', cnt: tabCounts['In Progress']},
    {key:'Pre-Review', label:'사전검토', cnt: tabCounts['Pre-Review']},
  ];
  return tabs.map(t => `
    <div class="tab ${currentTab===t.key?'active':''}" data-tab="${t.key}" onclick="switchTab(this)">
      ${t.label} <span class="tab-cnt">${t.cnt}</span>
    </div>`).join('');
}

// ── 필터바 HTML (풀 테이블 위 배치) ──────────────────────────
// ── Custom Styled Select Dropdown ────────────────────────────
function buildCustomSelect(id, allCount, options, selected) {
  // options: [{value, label, dot}]
  const selLabel = selected
    ? (options.find(o=>o.value===selected)||{}).label || selected
    : `전체 (${allCount}개국)`;

  const itemsHtml = options.map(o => {
    const isSel = o.value === selected;
    return `<div class="csd-item ${isSel?'selected':''}"
      onclick="csdSelect('${id}','${o.value}',this)"
      data-value="${o.value}">
      ${o.dot?`<span class="csd-dot" style="background:${o.dot}"></span>`:''}
      <span>${o.label}</span>
    </div>`;
  }).join('');

  return `<div class="csd-wrap" id="csd-${id}">
    <div class="csd-trigger ${selected?'':''}\" id="csd-trigger-${id}"
      onclick="csdToggle('${id}')">
      <span id="csd-label-${id}" style="overflow:hidden;text-overflow:ellipsis">${selLabel}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9BA3BF" stroke-width="2.5">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </div>
    <div class="csd-list" id="csd-list-${id}">
      <div class="csd-search">
        <input type="text" placeholder="검색..." oninput="csdFilter('${id}',this.value)">
      </div>
      <div class="csd-items" id="csd-items-${id}">
        <div class="csd-item-all ${!selected?'selected':''}" onclick="csdSelect('${id}','',this)" data-value="">
          전체 (${allCount}개국)
        </div>
        ${itemsHtml}
      </div>
    </div>
  </div>`;
}

function csdToggle(id) {
  const list = document.getElementById('csd-list-'+id);
  const trigger = document.getElementById('csd-trigger-'+id);
  const isOpen = list.classList.contains('open');
  // Close all open
  document.querySelectorAll('.csd-list.open').forEach(l=>l.classList.remove('open'));
  document.querySelectorAll('.csd-trigger.open').forEach(t=>t.classList.remove('open'));
  if (!isOpen) { list.classList.add('open'); trigger.classList.add('open'); }
}

function csdSelect(id, value, el) {
  bgSearchQuery = value;
  // Update label
  const label = el.dataset.value===''
    ? el.textContent.trim()
    : (el.querySelector('span:last-child') ? el.querySelector('span:last-child').textContent.trim() : value) || value;
  document.getElementById('csd-label-'+id).textContent = label;
  // Update selected state
  document.querySelectorAll(`#csd-items-${id} .csd-item, #csd-items-${id} .csd-item-all`)
    .forEach(i=>i.classList.remove('selected'));
  el.classList.add('selected');
  // Close
  { var _el = document.getElementById('csd-list-'+id); if(_el) _el.classList.remove('open'); };
  { var _el2 = document.getElementById('csd-trigger-'+id); if(_el2) _el2.classList.remove('open'); };
  renderTable();
}

function csdFilter(id, q) {
  const lq = q.toLowerCase();
  document.querySelectorAll(`#csd-items-${id} .csd-item`).forEach(el=>{
    el.style.display = el.textContent.toLowerCase().includes(lq) ? '' : 'none';
  });
}

// Click outside to close
document.addEventListener('click', e => {
  if (!e.target.closest('.csd-wrap')) {
    document.querySelectorAll('.csd-list.open').forEach(l=>l.classList.remove('open'));
    document.querySelectorAll('.csd-trigger.open').forEach(t=>t.classList.remove('open'));
  }
});


// ── VARIATION BY COUNTRY (TOP 8 ↔ 전체 스크롤 토글) ──────────
function buildCountryVariation(rows, opts) {
  opts = opts || {};
  if (!rows || !rows.length) return '';
  rows = rows.slice().sort(function(a,b){
    var pa = a.total>0?a.pub/a.total:0, pb = b.total>0?b.pub/b.total:0;
    if (pb !== pa) return pb - pa;
    return b.total - a.total;
  });
  var totalArticles = 0;
  for (var i=0;i<rows.length;i++) totalArticles += rows[i].total;

  function rowHtml(r) {
    var pct = r.total>0 ? Math.round(r.pub/r.total*100) : 0;
    return '<div style="display:flex;align-items:center;gap:12px;padding:7px 0">' +
      '<div style="width:128px;flex-shrink:0;font-size:11px;font-weight:700;color:#1A1D2E;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + r.name + '</div>' +
      '<div style="flex:1;height:5px;border-radius:3px;background:#EDEFF3;overflow:hidden">' +
        '<div style="height:100%;width:' + pct + '%;background:#22C55E;border-radius:3px"></div></div>' +
      '<div style="width:36px;flex-shrink:0;font-size:11px;font-weight:700;color:#6B7280;text-align:right">' + pct + '%</div>' +
      '<div style="width:34px;flex-shrink:0;text-align:center"><div style="font-size:8px;color:#9BA3BF;font-weight:700;letter-spacing:.05em">PUB</div><div style="font-size:12px;font-weight:800;color:#1A1D2E">' + r.pub + '</div></div>' +
      '<div style="width:38px;flex-shrink:0;text-align:center"><div style="font-size:8px;color:#9BA3BF;font-weight:700;letter-spacing:.05em">TOTAL</div><div style="font-size:12px;font-weight:800;color:#9BA3BF">' + r.total + '</div></div>' +
    '</div>';
  }

  var allRows = rows.map(rowHtml).join('');

  return '<div style="background:#fff;border:1px solid #E8EAF2;border-radius:14px;padding:16px 20px;flex:1;min-width:340px;display:flex;flex-direction:column">' +
    '<div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#1A1D2E;text-transform:uppercase">VARIATION BY COUNTRY</div>' +
    '<div style="font-size:10px;color:#9BA3BF;font-weight:600;margin-bottom:10px">' + rows.length + ' COUNTRIES / ' + totalArticles + ' ARTICLES</div>' +
    '<div style="height:300px;overflow-y:auto;padding-right:6px">' + allRows + '</div>' +
  '</div>';
}

// ── 주차별 진행 분석 메시지 ───────────────────────────────
function bgWeeklyInsight() {
  var weeks = Object.keys(BG_WEEKS).sort();
  if (weeks.length < 2) return null;
  var pcts = weeks.map(function(w){ var s=BG_WEEKS[w].stats||{}; return s.Total>0?Math.round(s.Done/s.Total*100):0; });
  var last = weeks[weeks.length-1], lastStats = BG_WEEKS[last].stats||{};
  var firstP = pcts[0], lastP = pcts[pcts.length-1];
  var delta = lastP - firstP;
  var p2 = BG_WEEKS[last].p2_stats || {};
  var p2pct = p2.Total>0?Math.round(p2.Done/p2.Total*100):0;
  var pre = lastStats['Pre-Review']||0, wip = lastStats['In Progress']||0;

  var level, msg;
  if (delta <= 0) {
    level = 'warn';
    msg = '<b>진행률 정체</b> — 최근 ' + weeks.length + '주간(' + weeks[0] + '~' + last + ') 진행률이 ' + lastP + '%로 변동이 없습니다. ' +
          'Phase 2(2차 국가) ' + p2pct + '% · 사전검토 ' + pre + '건 · 작업중 ' + wip + '건 — 진행 독려가 필요합니다.';
  } else if (delta < 5) {
    level = 'caution';
    msg = '<b>진행 더딤</b> — ' + weeks[0] + '~' + last + ' ' + delta + '%p 증가에 그쳤습니다. Phase 2 ' + p2pct + '%, 사전검토 ' + pre + '건 잔여.';
  } else {
    level = 'ok';
    var prevW = weeks[weeks.length-2];
    var prevDone = (BG_WEEKS[prevW].stats||{}).Done||0;
    var doneDelta = (lastStats.Done||0) - prevDone;
    var ppDelta = lastP - pcts[pcts.length-2];
    msg = '<b>진행 양호</b> — 전주차(' + prevW + ') 대비 ' + doneDelta + '건 진행되어 ' + ppDelta + '%p 상승했습니다 (현재 ' + lastP + '%). 잔여 사전검토 ' + pre + '건.';
  }
  return { level: level, msg: msg };
}

// ── 주차별 현황 차트 (번역비 소진현황 막대그래프 구조 참고) ──────
// ── 경고/완료 아이콘 ─────────────────────────────────────
function warnIcon(color) {
  return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:6px;flex-shrink:0"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
}
function okIcon(color) {
  return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:6px;flex-shrink:0"><polyline points="20 6 9 17 4 12"/></svg>';
}

// ── 토스트 + 클립보드 복사 ───────────────────────────────
function showToast(msg) {
  var t = document.getElementById('appToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'appToast';
    t.style.cssText = 'position:fixed;left:50%;bottom:32px;transform:translateX(-50%) translateY(20px);background:#1A1A1A;color:#fff;padding:11px 20px;border-radius:10px;font-size:13px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.25);z-index:10000;opacity:0;transition:opacity .2s,transform .2s;pointer-events:none;white-space:nowrap';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(t._timer);
  t._timer = setTimeout(function(){
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(20px)';
  }, 1800);
}
function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function(){ showToast('복사되었습니다.'); },
      function(){ fallbackCopy(text); });
  } else {
    fallbackCopy(text);
  }
}
function fallbackCopy(text) {
  try {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    showToast('복사되었습니다.');
  } catch(e) { showToast('복사에 실패했습니다.'); }
}

function bgBarTip(e) {
  var el = e.currentTarget;
  var d = el.dataset;
  var t = document.getElementById('bgBarTip');
  if (!t) {
    t = document.createElement('div');
    t.id = 'bgBarTip';
    t.style.cssText = 'position:fixed;z-index:9999;background:#1A1A1A;color:#fff;padding:8px 12px;border-radius:8px;font-size:11px;line-height:1.6;pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,.25);display:none;white-space:nowrap';
    document.body.appendChild(t);
  }
  t.innerHTML = '<div style="font-weight:800;margin-bottom:3px">' + d.wk + ' \u00b7 ' + d.pct + '%</div>' +
    '<div><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:' + d.color + ';margin-right:5px"></span>' + d.label + ': <b>' + d.val + '\uAC74</b></div>';
  t.style.display = 'block';
  var x = e.clientX + 14, y = e.clientY - 10;
  if (x + 180 > window.innerWidth) x = e.clientX - 190;
  t.style.left = x + 'px';
  t.style.top = y + 'px';
}
function bgBarTipHide() {
  var t = document.getElementById('bgBarTip');
  if (t) t.style.display = 'none';
}

// ── BG 테이블 분석 안내 (FULL DATA TABLE 상단) ──────────────
function bgTableInsight(items) {
  if (!items || !items.length) return '';
  var preCountries = [];
  for (var i=0;i<items.length;i++){
    if (items[i].overall === 'Pre-Review') preCountries.push(items[i].country || items[i].locale);
  }
  if (!preCountries.length) return '';
  var listTxt = preCountries.join(', ');
  return '<div style="background:#FEF6F0;border:1px solid #F59E0B33;border-left:3px solid #F59E0B;border-radius:8px;padding:11px 15px;margin-bottom:14px;font-size:11.5px;color:#92400E;line-height:1.6">' +
    '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">' +
      '<div style="flex:1">' +
        warnIcon('#F59E0B') +
        '<b>본부 액션 필요</b> — 사전검토 상태 <b>' + preCountries.length + '개국</b>은 법인 검토가 진행되지 않은 건으로, 본부에서 해당 법인에 검토·진행을 독려해야 합니다.<br>' +
        '<span style="display:inline-block;margin-top:5px;color:#7C4A12">대상 국가: <b>' + listTxt + '</b></span>' +
      '</div>' +
      '<button onclick="openActionModal()" style="flex-shrink:0;display:inline-flex;align-items:center;gap:5px;padding:7px 13px;border:1px solid #A50034;border-radius:6px;background:#A50034;color:#fff;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;transition:opacity .15s" onmouseover="this.style.opacity=0.88" onmouseout="this.style.opacity=1">' +
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>' +
        '독려 대상 상세보기' +
      '</button>' +
    '</div>' +
  '</div>';
}


// ── 공통 DAM 셀 (Article List 동일: 클릭 시 DAM 경로 복사 + 토스트) ──
function damCellTd(dam) {
  var path = dam || (DATA[currentKey] && DATA[currentKey].dam) || '';
  if (!path) return '<td style="text-align:center;width:56px"><span style="color:#E2E8F0;font-size:10px">\u2014</span></td>';
  var safe = path.replace(/'/g, "\\'").replace(/"/g, '&quot;');
  return '<td style="text-align:center;width:56px"><button onclick="copyToClipboard(\'' + safe + '\')" title="DAM \uacbd\ub85c \ubcf5\uc0ac" style="border:none;background:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;color:#A50034;padding:2px">' +
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
  '</button></td>';
}
function damHeadTh() { return '<th style="vertical-align:middle;width:56px">DAM</th>'; }

// ── 공통: 독려 대상(사전검토) 배너 + 모달 (전 메뉴 동일 규칙) ──
function getPreReviewItems(key) {
  var d = DATA[key]; if (!d) return [];
  if (key === 'article_list') {
    return (d.articles || []).filter(function(a){ return a.overall === 'Pre-Review'; });
  }
  return (d.items || []).filter(function(x){ return (x.status || x.overall) === 'Pre-Review'; });
}
function nameOfItem(key, it) {
  if (key === 'article_list') return it.title || it.locale || '';
  var lm = (typeof LOCALE_MAP!=='undefined' && LOCALE_MAP[it.locale]) ? LOCALE_MAP[it.locale] : {};
  return it.country || lm.country || it.locale || '';
}
// ── 이번 주차 신규 항목 감지 (직전 주차 대비 새로 등장) ──────────
function weeksMapFor(key){
  var MAP = {
    buying_guide: (typeof BG_WEEKS!=='undefined'?BG_WEEKS:null),
    article_list: (typeof ARTICLE_WEEKS!=='undefined'?ARTICLE_WEEKS:null),
    ice_solution: (typeof ICE_WEEKS!=='undefined'?ICE_WEEKS:null),
    microsite: (typeof MICROSITE_WEEKS!=='undefined'?MICROSITE_WEEKS:null),
    alttext: (typeof ALTTEXT_WEEKS!=='undefined'?ALTTEXT_WEEKS:null),
    faq_hub: (typeof FAQ_WEEKS!=='undefined'?FAQ_WEEKS:null),
    pdp_gallery: (typeof PDP_WEEKS!=='undefined'?PDP_WEEKS:null),
    vacuum: (typeof VACUUM_WEEKS!=='undefined'?VACUUM_WEEKS:null),
    wmo_faq: (typeof WMO_FAQ_WEEKS!=='undefined'?WMO_FAQ_WEEKS:null)
  };
  return MAP[key] || null;
}
function itemListOf(weekObj, key){
  if (!weekObj) return [];
  return (key==='article_list') ? (weekObj.articles||[]) : (weekObj.items||[]);
}
function itemIdOf(it, key){
  if (key==='article_list') return (it.title||'') ;
  return (it.locale||it.country||'');
}
function itemNameOf(it, key){
  if (key==='article_list') return it.title||'';
  var lm=(typeof LOCALE_MAP!=='undefined'&&LOCALE_MAP[it.locale])?LOCALE_MAP[it.locale]:{};
  return it.country||lm.country||it.locale||'';
}
// 현재 주차 신규 항목 id 집합
function newItemIds(key){
  var W = weeksMapFor(key);
  var wk = (typeof currentWeek!=='undefined')?currentWeek:AUTO_WEEK;
  if (!W || !W[wk]) return {};
  var weeks = Object.keys(W).sort();
  var idx = weeks.indexOf(wk);
  var ids = {};
  var curList = itemListOf(W[wk], key);
  if (idx<=0){
    // 직전 주차가 없으면(콘텐츠 자체가 이번 주 신규) 전체 신규로 보지 않고, 비교 불가 → 신규 없음 처리
    return {};
  }
  var prevList = itemListOf(W[weeks[idx-1]], key);
  var prevSet = {};
  prevList.forEach(function(it){ prevSet[itemIdOf(it,key)] = 1; });
  curList.forEach(function(it){
    var id = itemIdOf(it,key);
    if (id && !prevSet[id]) ids[id] = 1;
  });
  return ids;
}
// NEW 배너 (신규 있을 때만)
function buildNewBanner(){
  var key = currentKey;
  var wk = (typeof currentWeek!=='undefined')?currentWeek:AUTO_WEEK;
  var ids = newItemIds(key);
  var names = Object.keys(ids);
  if (!names.length) return '';
  var W = weeksMapFor(key);
  var curList = itemListOf(W[wk], key);
  var disp = [];
  curList.forEach(function(it){ if (ids[itemIdOf(it,key)]) disp.push(itemNameOf(it,key)); });
  var listTxt = disp.slice(0,20).join(', ') + (disp.length>20?(' 외 '+(disp.length-20)):'');
  return '<div style="background:#EEF6FF;border:1px solid #3B82F633;border-left:3px solid #3B82F6;border-radius:8px;padding:11px 15px;margin-bottom:14px;font-size:11.5px;color:#1E40AF;line-height:1.6">' +
    '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:16px;padding:0 5px;border-radius:4px;background:#3B82F6;color:#fff;font-size:9px;font-weight:800;margin-right:6px;vertical-align:middle">NEW</span>' +
    '<b>' + wk + ' 신규 업데이트</b> — 이번 주차에 새로 완료된 항목 <b>' + disp.length + '건</b>입니다.<br>' +
    '<span style="display:inline-block;margin-top:5px;color:#2952A3">신규 항목: <b>' + listTxt + '</b></span>' +
  '</div>';
}
// 행 NEW 배지 (id가 신규면 표시)
function newRowBadge(it, key, idsCache){
  var ids = idsCache || newItemIds(key);
  var id = itemIdOf(it, key);
  if (id && ids[id]) return '<span style="display:inline-block;margin-left:5px;padding:0 4px;height:14px;line-height:14px;border-radius:3px;background:#3B82F6;color:#fff;font-size:8px;font-weight:800;vertical-align:middle">N</span>';
  return '';
}

function buildActionBanner() {
  var key = currentKey;
  var pre = getPreReviewItems(key);
  if (!pre.length) return '';
  var unit = (key === 'article_list') ? '건' : '개국';
  return '<div style="background:#FEF6F0;border:1px solid #F59E0B33;border-left:3px solid #F59E0B;border-radius:8px;padding:11px 15px;margin-bottom:14px;font-size:11.5px;color:#92400E;line-height:1.6">' +
    '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">' +
      '<div style="flex:1">' +
        warnIcon('#F59E0B') +
        '<b>본부 액션 필요</b> — 사전검토 상태 <b>' + pre.length + unit + '</b>은 법인 검토가 진행되지 않은 건으로, 본부에서 해당 법인에 검토·진행을 독려해야 합니다.' +
      '</div>' +
      '<button onclick="openActionModal()" style="flex-shrink:0;display:inline-flex;align-items:center;gap:5px;padding:7px 13px;border:1px solid #A50034;border-radius:6px;background:#A50034;color:#fff;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;transition:opacity .15s" onmouseover="this.style.opacity=0.88" onmouseout="this.style.opacity=1">' +
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>' +
        '독려 대상 상세보기' +
      '</button>' +
    '</div>' +
  '</div>';
}
function dotColor(s){ return (s==='Done')?'#22C55E':(s==='Corp. Review'||s==='Cancel')?'#F59E0B':(s==='In Progress')?'#3B82F6':'#CBD5E1'; }
function openActionModal() {
  var key = currentKey;
  var d = DATA[key];
  var pre = getPreReviewItems(key);
  var body = document.getElementById('bgActionModalBody');
  var sub = document.getElementById('bgActionModalSub');
  var titleEl = document.getElementById('bgActionModalTitle');
  if (!body) return;
  if (titleEl) titleEl.textContent = getDashboardDisplayTitle(d) || '';
  var unit = (key === 'article_list') ? '건' : '개국';
  if (sub) sub.textContent = '사전검토 ' + pre.length + unit + ' · 법인 검토·진행 독려 대상';

  function dot(s){ return '<span style="display:inline-block;width:11px;height:11px;border-radius:50%;background:'+dotColor(s)+'"></span>'; }

  var html;
  // 매트릭스형 (BG): 컬럼별 신호등
  if (key === 'buying_guide') {
    var cols = (pre[0] && pre[0].cols) ? pre[0].cols : ['Kit','Ldy','Hub','RT','RF','RS','WT','WF','WS','IK','IL'];
    var head = '<tr>' +
      '<th style="text-align:center;padding:8px 10px;font-size:10px;color:#6B7280;white-space:nowrap">Region</th>' +
      '<th style="position:sticky;left:0;background:#F8FAFC;text-align:left;padding:8px 10px;font-size:10px;color:#6B7280;white-space:nowrap">Country</th>' +
      '<th style="padding:8px 8px;font-size:10px;color:#6B7280">차수</th>';
    for (var c=0;c<cols.length;c++){ head += '<th style="padding:8px 6px;font-size:9px;color:#6B7280;white-space:nowrap">'+(COL_FULL[cols[c]]||cols[c])+'</th>'; }
    head += '<th style="padding:8px 10px;font-size:10px;color:#6B7280">사전검토</th></tr>';
    // Region 그룹핑 (다른 메뉴 팝업과 동일)
    var RORDER = ['EU','ASIA','MEA','LATAM'];
    var grp = {}, ord = [];
    for (var gi=0; gi<pre.length; gi++){
      var rg = (pre[gi].region || 'Other').toUpperCase();
      if (!grp[rg]) { grp[rg] = []; ord.push(rg); }
      grp[rg].push(pre[gi]);
    }
    var sortedR = [];
    for (var ri=0; ri<RORDER.length; ri++){ if (grp[RORDER[ri]]) sortedR.push(RORDER[ri]); }
    for (var ri2=0; ri2<ord.length; ri2++){ if (sortedR.indexOf(ord[ri2])===-1) sortedR.push(ord[ri2]); }
    var rows = '';
    for (var si=0; si<sortedR.length; si++){
      var region = sortedR[si]; var gitems = grp[region];
      var rcfg = (typeof REGION_CFG!=='undefined' && REGION_CFG[region]) || {label:region,tc:'#6B7280',bg:'#F1F5F9',border:'#E0E4F0'};
      for (var ii=0; ii<gitems.length; ii++){
        var it = gitems[ii];
        var lm = (typeof LOCALE_MAP!=='undefined' && LOCALE_MAP[it.locale]) ? LOCALE_MAP[it.locale] : {};
        var name = it.country || lm.country || it.locale;
        var st = it.statuses || []; var tds='';
        for (var k=0;k<cols.length;k++){ tds += '<td style="text-align:center;padding:7px 6px">'+dot(st[k])+'</td>'; }
        var regionCell = (ii===0) ? '<td rowspan="'+gitems.length+'" style="text-align:center;vertical-align:middle;padding:7px 10px;background:'+rcfg.bg+';border-right:2px solid '+(rcfg.border||'#E0E4F0')+'"><span style="font-size:10px;font-weight:800;color:'+rcfg.tc+'">'+rcfg.label+'</span></td>' : '';
        rows += '<tr style="border-top:1px solid #F0F1F8">' +
          regionCell +
          '<td style="position:sticky;left:0;background:#fff;padding:7px 10px;font-size:11px;font-weight:700;color:#1A1D2E;white-space:nowrap">'+name+'</td>' +
          '<td style="text-align:center;padding:7px 8px;font-size:10px;color:#6B7280">'+(it.phase==='Phase 1'?'1차':(it.phase==='Phase 2'?'2차':(it.phase||'')))+'</td>' +
          tds +
          '<td style="text-align:center;padding:7px 10px;font-size:11px;font-weight:800;color:#94A3B8">'+(it.pre||0)+'/'+(it.total||0)+'</td>' +
        '</tr>';
      }
    }
    html = '<table style="border-collapse:collapse;width:100%;min-width:760px"><thead>'+head+'</thead><tbody>'+(rows||'')+'</tbody></table>';
  }
  // 아티클형: Title / 제품 / hub
  else if (key === 'article_list') {
    var head2 = '<tr><th style="text-align:left;padding:8px 10px;font-size:10px;color:#6B7280">제품</th><th style="text-align:left;padding:8px 10px;font-size:10px;color:#6B7280">Title</th><th style="padding:8px 10px;font-size:10px;color:#6B7280">진행사항</th></tr>';
    var rows2 = pre.map(function(a){
      return '<tr style="border-top:1px solid #F0F1F8"><td style="padding:7px 10px;font-size:10px;color:#475569;white-space:nowrap">'+(a.product||'')+'</td><td style="padding:7px 10px;font-size:11px;font-weight:600;color:#1A1D2E">'+(a.title||'')+'</td><td style="text-align:center;padding:7px 10px;font-size:10px;color:#6B7280">'+(a.progress||'사전검토')+'</td></tr>';
    }).join('');
    html = '<table style="border-collapse:collapse;width:100%;min-width:520px"><thead>'+head2+'</thead><tbody>'+(rows2||'')+'</tbody></table>';
  }
  // 플랫형 (Ice/Microsite/WashTower/FAQ/AltText/PDP/Vacuum/WMO) — Region별 그룹
  else {
    var hasPages = pre.some(function(x){ return typeof x.pages !== 'undefined' && x.pages; });
    var head3 = '<tr>' +
      '<th style="text-align:center;padding:8px 10px;font-size:10px;color:#6B7280;white-space:nowrap">Region</th>' +
      '<th style="text-align:left;padding:8px 10px;font-size:10px;color:#6B7280">Country</th>' +
      '<th style="padding:8px 10px;font-size:10px;color:#6B7280">상태</th>' +
      (hasPages?'<th style="padding:8px 10px;font-size:10px;color:#6B7280">Pg#</th>':'') +
    '</tr>';
    // Region 그룹핑
    var RORDER = ['EU','ASIA','MEA','LATAM'];
    var grp = {}, ord = [];
    for (var gi=0; gi<pre.length; gi++){
      var rg = (pre[gi].region || 'Other').toUpperCase();
      if (!grp[rg]) { grp[rg] = []; ord.push(rg); }
      grp[rg].push(pre[gi]);
    }
    var sortedR = [];
    for (var ri=0; ri<RORDER.length; ri++){ if (grp[RORDER[ri]]) sortedR.push(RORDER[ri]); }
    for (var ri2=0; ri2<ord.length; ri2++){ if (sortedR.indexOf(ord[ri2])===-1) sortedR.push(ord[ri2]); }
    var rows3 = '';
    for (var si=0; si<sortedR.length; si++){
      var region = sortedR[si]; var gitems = grp[region];
      var rcfg = (typeof REGION_CFG!=='undefined' && REGION_CFG[region]) || {label:region,tc:'#6B7280',bg:'#F1F5F9',border:'#E0E4F0'};
      for (var ii=0; ii<gitems.length; ii++){
        var it = gitems[ii];
        var regionCell = (ii===0) ? '<td rowspan="'+gitems.length+'" style="text-align:center;vertical-align:middle;padding:7px 10px;background:'+rcfg.bg+';border-right:2px solid '+(rcfg.border||'#E0E4F0')+'"><span style="font-size:10px;font-weight:800;color:'+rcfg.tc+'">'+rcfg.label+'</span></td>' : '';
        rows3 += '<tr style="border-top:1px solid #F0F1F8">' +
          regionCell +
          '<td style="padding:7px 10px;font-size:11px;font-weight:700;color:#1A1D2E;white-space:nowrap">'+(it.country||it.locale)+'</td>' +
          '<td style="text-align:center;padding:7px 10px"><span style="font-size:10px;color:#94A3B8">사전검토</span></td>' +
          (hasPages?('<td style="text-align:center;padding:7px 10px;font-size:11px;font-weight:700;color:#1A1D2E">'+(it.pages||0)+'</td>'):'') +
        '</tr>';
      }
    }
    html = '<table style="border-collapse:collapse;width:100%;min-width:420px"><thead>'+head3+'</thead><tbody>'+(rows3||'')+'</tbody></table>';
  }

  body.innerHTML = '<div style="overflow:auto;max-height:60vh">' + html + '</div>';
  var ov = document.getElementById('bgActionModal'); if (ov) ov.style.display='flex';
}
function closeActionModal(){ var ov=document.getElementById('bgActionModal'); if(ov)ov.style.display='none'; }

// ── 본부 확인·보고 필요 사항 (BG 번역비 의사결정) ──────────────
function buildBgActionSection() {
  return '<div style="background:#fff;border:1px solid #E8EAF2;border-top:3px solid #A50034;border-radius:14px;padding:20px 24px;margin-bottom:14px">' +
    // 헤더
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">' +
      '<span style="font-size:10px;font-weight:800;letter-spacing:.1em;color:#A50034;text-transform:uppercase">Action Required</span>' +
      '<span style="font-size:10px;font-weight:700;color:#fff;background:#A50034;padding:2px 8px;border-radius:5px">본부 확인 필요</span>' +
    '</div>' +
    '<div style="font-size:15px;font-weight:800;color:#1A1D2E;margin-bottom:14px">번역비 소진 관련 진행 방식 확인 요청 (Buying Guide)</div>' +

    // 현황 요약 (번역비 9% 배너)
    '<div style="background:#FEF6F0;border:1px solid #F59E0B33;border-left:3px solid #F59E0B;border-radius:8px;padding:11px 14px;margin-bottom:16px;font-size:12px;color:#92400E;line-height:1.6">' +
      warnIcon('#F59E0B') +
      '<b>번역비 잔여 9%</b> — 현재 번역비가 9%만 남은 상태로, 신규 번역 발생 시 예산 소진이 임박합니다.' +
    '</div>' +

    // 현황 정리
    '<div style="font-size:11px;font-weight:800;color:#1A1D2E;letter-spacing:.03em;margin-bottom:8px">■ 현황</div>' +
    '<ul style="margin:0 0 18px;padding-left:18px;font-size:12.5px;color:#374151;line-height:1.75">' +
      '<li><b>작업중 콘텐츠</b> : 이미 번역이 완료된 상태로 추가 번역비가 발생하지 않습니다.</li>' +
      '<li><b>사전검토 콘텐츠</b> : 번역이 필요한 건으로, <b>법인 확인 후 WPL에 요청</b>하는 시점부터 번역이 시작되며 <b>번역비가 발생</b>합니다.</li>' +
    '</ul>' +

    // 의사결정 필요 — 2개 옵션
    '<div style="font-size:11px;font-weight:800;color:#1A1D2E;letter-spacing:.03em;margin-bottom:10px">■ 확인·결정 필요 사항</div>' +
    '<div style="font-size:12.5px;color:#374151;line-height:1.6;margin-bottom:14px">사전검토 건의 번역 진행 방식에 대해 아래 두 가지 중 본부 방침 확인이 필요합니다.</div>' +
    '<div style="display:flex;gap:12px;flex-wrap:wrap">' +
      // Option A
      '<div style="flex:1;min-width:280px;border:1px solid #E8EAF2;border-radius:10px;padding:14px 16px;background:#FAFBFC">' +
        '<div style="display:flex;align-items:center;gap:7px;margin-bottom:8px">' +
          '<span style="width:22px;height:22px;border-radius:50%;background:#A50034;color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center">A</span>' +
          '<span style="font-size:12.5px;font-weight:800;color:#1A1D2E">전체 번역 진행</span>' +
        '</div>' +
        '<div style="font-size:12px;color:#4B5563;line-height:1.65">사전검토 건의 번역을 <b>법인에 요청</b>하여 진행하도록 <b>WPL에 공지</b>합니다. (즉시 번역 착수 → 번역비 추가 발생)</div>' +
      '</div>' +
      // Option B
      '<div style="flex:1;min-width:280px;border:1px solid #E8EAF2;border-radius:10px;padding:14px 16px;background:#FAFBFC">' +
        '<div style="display:flex;align-items:center;gap:7px;margin-bottom:8px">' +
          '<span style="width:22px;height:22px;border-radius:50%;background:#1A1D2E;color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center">B</span>' +
          '<span style="font-size:12.5px;font-weight:800;color:#1A1D2E">단계적 진행</span>' +
        '</div>' +
        '<div style="font-size:12px;color:#4B5563;line-height:1.65"><b>현재 글로벌 리퀘스트 건까지만</b> 진행하고, <b>이후 신규 글로벌 리퀘스트 건</b>에 한해 번역을 법인에 요청해 진행합니다. (번역비 점진 관리)</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function buildWeeklyChart() {
  var weeks = Object.keys(BG_WEEKS).sort();
  if (!weeks.length) return '';

  var series = [
    { key: 'pre',  label: '사전검토', color: SC['Pre-Review'].dot },
    { key: 'wip',  label: '작업중',   color: SC['In Progress'].dot },
    { key: 'corp', label: '법인리뷰', color: SC['Corp. Review'].dot },
    { key: 'done', label: '완료',     color: SC['Done'].dot }
  ];
  var wkData = weeks.map(function(wk){
    var s = BG_WEEKS[wk].stats || {};
    return { wk: wk,
      pre:  s['Pre-Review']  || 0,
      wip:  s['In Progress'] || 0,
      corp: s['Corp. Review']|| 0,
      done: s.Done || 0,
      total: s.Total || 0 };
  });

  var maxV = 0;
  wkData.forEach(function(d){ maxV = Math.max(maxV, d.total||0); });
  var yMax = maxV || 10;
  var chartH = 170;

  var grid = '', yLabels = '';
  for (var g = 0; g <= 4; g++) {
    var val = Math.round(yMax * g / 4);
    var bottom = (val / yMax) * chartH;
    grid += '<div style="position:absolute;left:0;right:0;bottom:' + bottom + 'px;border-top:1px solid #F0F1F8"></div>';
    yLabels += '<div style="position:absolute;right:0;bottom:' + (bottom - 6) + 'px;font-size:9px;color:#9BA3BF;font-weight:600">' + val + '건</div>';
  }

  var groups = wkData.map(function(d){
    var pct = d.total > 0 ? Math.round(d.done / d.total * 100) : 0;
    var bars = series.map(function(se){
      var v = d[se.key];
      var h = Math.max(Math.round((v / yMax) * chartH), v > 0 ? 2 : 0);
      return '<div data-wk="' + d.wk + '" data-pct="' + pct + '" data-label="' + se.label + '" data-val="' + v + '" data-color="' + se.color + '" ' +
        'onmouseenter="bgBarTip(event)" onmousemove="bgBarTip(event)" onmouseleave="bgBarTipHide()" ' +
        'onmouseover="this.style.opacity=0.75" onmouseout="this.style.opacity=1" ' +
        'style="width:11px;height:' + h + 'px;background:' + se.color + ';border-radius:3px 3px 0 0;cursor:pointer;transition:opacity .15s"></div>';
    }).join('');
    return '<div style="flex:1;height:100%;display:flex;align-items:flex-end;justify-content:center;gap:3px">' + bars + '</div>';
  }).join('');

  var weekLabels = wkData.map(function(d){
    var active = (d.wk === bgWeek);
    return '<div onclick="setBgWeek(\'' + d.wk + '\')" style="flex:1;text-align:center;font-size:11px;font-weight:' + (active?'800':'600') + ';color:' + (active?'#A50034':'#6B7280') + ';cursor:pointer">' + d.wk + '</div>';
  }).join('');

  var legend = series.map(function(se){
    return '<span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:#6B7280"><span style="width:12px;height:12px;border-radius:3px;background:' + se.color + '"></span>' + se.label + '</span>';
  }).join('');

  var ins = bgWeeklyInsight();
  var banner = '';
  if (ins) {
    var bc = { warn:{bg:'#FEF6F0',bd:'#F59E0B',tc:'#92400E',ic:'\u26A0'}, caution:{bg:'#FFFBEB',bd:'#FBBF24',tc:'#92400E',ic:'\u26A0'}, ok:{bg:'#F0FDF4',bd:'#22C55E',tc:'#166534',ic:'\u2713'} }[ins.level];
    banner = '<div style="background:' + bc.bg + ';border:1px solid ' + bc.bd + '33;border-left:3px solid ' + bc.bd + ';border-radius:8px;padding:10px 14px;margin-top:14px;font-size:11.5px;color:' + bc.tc + ';line-height:1.5">' +
      (ins.level==='ok'?okIcon(bc.bd):warnIcon(bc.bd)) + ins.msg + '</div>';
  }

  return '<div style="background:#fff;border:1px solid #E8EAF2;border-radius:14px;padding:16px 20px;flex:1;min-width:340px">' +
    '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px">' +
      '<div><div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#1A1D2E;text-transform:uppercase">주차별 현황</div>' +
      '<div style="font-size:10px;color:#9BA3BF;font-weight:600">WEEKLY PROGRESS</div></div>' +
      '<span style="font-size:11px;font-weight:800;color:#fff;background:#A50034;padding:3px 10px;border-radius:6px">2026</span>' +
    '</div>' +
    '<div style="display:flex;gap:8px;margin-top:18px">' +
      '<div style="position:relative;width:34px;height:' + chartH + 'px;flex-shrink:0">' + yLabels + '</div>' +
      '<div style="position:relative;flex:1;height:' + chartH + 'px">' + grid +
        '<div style="position:absolute;left:0;right:0;bottom:0;top:0;display:flex;align-items:flex-end">' + groups + '</div>' +
      '</div>' +
    '</div>' +
    // 주차 라벨 행 (Y축 너비만큼 들여쓰기)
    '<div style="display:flex;gap:8px;margin-top:8px">' +
      '<div style="width:34px;flex-shrink:0"></div>' +
      '<div style="flex:1;display:flex">' + weekLabels + '</div>' +
    '</div>' +
    '<div style="display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:18px;padding-top:12px;border-top:1px solid #F0F1F8">' + legend + '</div>' +
    banner +
  '</div>';
}

// ── BG 국가별 rows (국가 풀네임) ──────────────────────────
function bgCountryRows(items) {
  var rows = [];
  for (var i=0;i<items.length;i++){
    var it = items[i];
    var done = 0, total = 0;
    var arr = it.statuses || [];
    for (var j=0;j<arr.length;j++){ if(arr[j] && arr[j]!=='Cancel'){ total++; if(arr[j]==='Done') done++; } }
    rows.push({ name: it.country || it.locale, pub: done, total: total });
  }
  return rows;
}

// ── 리전별 진행 현황 요약 세션 (컨텐츠 개수 기준) ──────────────
// ── 페이지 미리보기 (lg.com 캡처 레이어) ──────────────────
/* BG_PREVIEW_URL 데이터는 json.js로 분리됨 */

/* PREVIEW_CFG 데이터는 json.js로 분리됨 */

/* BG_PREVIEW_IMG 데이터는 json.js로 분리됨 */


function normalizePreviewUrl(u) {
  u = (u || '').trim();
  if (!u) return '';
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  return u;
}
function capturePreview() {
  var input = document.getElementById('pagePreviewInput');
  var img = document.getElementById('pagePreviewImg');
  var loading = document.getElementById('pagePreviewLoading');
  var openA = document.getElementById('pagePreviewOpen');
  var url = normalizePreviewUrl(input ? input.value : '');
  if (!url) { if (loading) { loading.style.display = 'flex'; loading.textContent = 'URL을 입력해주세요.'; } return; }
  if (input) input.value = url;
  if (loading) { loading.style.display = 'flex'; loading.textContent = '화면을 캡처하는 중...'; }
  if (img) {
    img.style.display = 'block';
    // 기본 URL은 첨부 캡처 이미지, 그 외는 캡처 서비스 사용
    var cfg = currentPreviewCfg();
    if (url === cfg.url && cfg.useImg) {
      img.src = BG_PREVIEW_IMG;
    } else {
      img.src = 'https://image.thum.io/get/width/1280/crop/1400/noanimate/' + encodeURIComponent(url) + '?_=' + Date.now();
    }
  }
  if (openA) { openA.href = url; }
}
function currentPreviewCfg() { return PREVIEW_CFG[currentKey] || PREVIEW_CFG['buying_guide']; }
function openPagePreview() {
  var m = document.getElementById('pagePreviewModal');
  var input = document.getElementById('pagePreviewInput');
  if (!m) return;
  var cfg = currentPreviewCfg();
  if (input) input.value = cfg.url;
  m.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  capturePreview();
}
function closePagePreview() {
  var m = document.getElementById('pagePreviewModal');
  if (m) m.style.display = 'none';
  document.body.style.overflow = '';
}

// ── 주차 select box 동기화 (BG 탭에서만 표시) ──────────────
function syncWeekSelector() {
  AUTO_WEEK = getISOWeekLabel(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  ensureAutoWeekDatasets();
  var sel = document.getElementById('topWeekSel');
  if (!sel) return;
  // 전체 콘텐츠 주차 합집합 (글로벌 주차)
  var all = {};
  function add(o){ if(typeof o!=='undefined'){ Object.keys(o).forEach(function(w){ all[w]=1; }); } }
  add(typeof BG_WEEKS!=='undefined'?BG_WEEKS:undefined);
  add(typeof ARTICLE_WEEKS!=='undefined'?ARTICLE_WEEKS:undefined);
  add(typeof ICE_WEEKS!=='undefined'?ICE_WEEKS:undefined);
  add(typeof MICROSITE_WEEKS!=='undefined'?MICROSITE_WEEKS:undefined);
  add(typeof ALTTEXT_WEEKS!=='undefined'?ALTTEXT_WEEKS:undefined);
  add(typeof FAQ_WEEKS!=='undefined'?FAQ_WEEKS:undefined);
  add(typeof PDP_WEEKS!=='undefined'?PDP_WEEKS:undefined);
  add(typeof VACUUM_WEEKS!=='undefined'?VACUUM_WEEKS:undefined);
  add(typeof WMO_FAQ_WEEKS!=='undefined'?WMO_FAQ_WEEKS:undefined);
  var weeks = Object.keys(all).sort();
  if (!weeks.length) { sel.style.display = 'none'; return; }
  var cur = (typeof bgWeek!=='undefined' && all[bgWeek]) ? bgWeek : weeks[weeks.length-1];
  sel.innerHTML = weeks.map(function(w){
    return '<option value="' + w + '"' + (w===cur?' selected':'') + '>' + w + '</option>';
  }).join('');
  sel.style.display = '';
}


// ── Article List 주차 선택 ──────────────────────────────────
function setArticleWeek(w) {
  if (!ARTICLE_WEEKS[w]) return;
  articleWeek = w;
  var d = ARTICLE_WEEKS[w];
  DATA.article_list.articles = d.articles;
  DATA.article_list.locales = d.locales;
  DATA.article_list.stats = d.stats;
  renderContent();
}
(function initArticleWeek(){
  var d = ARTICLE_WEEKS[articleWeek];
  if (d) {
    DATA.article_list.articles = d.articles;
    DATA.article_list.locales = d.locales;
    DATA.article_list.stats = d.stats;
  }
})();



// ── 신규 콘텐츠 주차별 노출 제어 (예: WMO PLP FAQ는 W23부터 존재) ──
var NEW_CONTENT_WEEKS = { wmo_faq: (typeof WMO_FAQ_WEEKS!=='undefined' ? WMO_FAQ_WEEKS : {}) };
var currentWeek = AUTO_WEEK;
function updateNewContentVisibility(w) {
  if (window.__SHEET_DRIVEN_NAV) return;
  Object.keys(NEW_CONTENT_WEEKS).forEach(function(key){
    var exists = !!NEW_CONTENT_WEEKS[key][w];
    var el = document.querySelector('.nav-item[data-key="' + key + '"]');
    if (el) el.style.display = exists ? '' : 'none';
    if (!exists && currentKey === key) {
      currentKey = 'buying_guide';
      document.querySelectorAll('.nav-item').forEach(function(n){ n.classList.remove('active'); });
      var bg = document.querySelector('.nav-item[data-key="buying_guide"]');
      if (bg) bg.classList.add('active');
      var t = document.getElementById('topTitle');
      if (t) t.textContent = getDashboardDisplayTitle(DATA.buying_guide);
    }
  });
}

function applyWeekToAll(w) {
  // 모든 콘텐츠 타입의 데이터를 선택 주차로 동기화 (해당 주차가 있는 경우)
  if (typeof BG_WEEKS!=='undefined' && BG_WEEKS[w]) { bgWeek=w; var d=BG_WEEKS[w]; DATA.buying_guide.items=d.items; DATA.buying_guide.stats=d.stats; DATA.buying_guide.p1_stats=d.p1_stats; DATA.buying_guide.p2_stats=d.p2_stats; }
  if (typeof ARTICLE_WEEKS!=='undefined' && ARTICLE_WEEKS[w]) { articleWeek=w; var a=ARTICLE_WEEKS[w]; DATA.article_list.articles=a.articles; DATA.article_list.locales=a.locales; DATA.article_list.stats=a.stats; }
  if (typeof ICE_WEEKS!=='undefined' && ICE_WEEKS[w]) { iceWeek=w; var i=ICE_WEEKS[w]; DATA.ice_solution.items=i.items; DATA.ice_solution.stats=i.stats; DATA.ice_solution.dam=i.dam; }
  if (typeof MICROSITE_WEEKS!=='undefined' && MICROSITE_WEEKS[w]) { micrositeWeek=w; var m=MICROSITE_WEEKS[w]; DATA.microsite.items=m.items; DATA.microsite.stats=m.stats; DATA.microsite.dam=m.dam; }
  if (typeof ALTTEXT_WEEKS!=='undefined' && ALTTEXT_WEEKS[w]) { alttextWeek=w; var x=ALTTEXT_WEEKS[w]; DATA.alttext.items=x.items; DATA.alttext.stats=x.stats; }
  if (typeof FAQ_WEEKS!=='undefined' && FAQ_WEEKS[w]) { faqWeek=w; var f=FAQ_WEEKS[w]; DATA.faq_hub.items=f.items; DATA.faq_hub.stats=f.stats; }
  if (typeof PDP_WEEKS!=='undefined' && PDP_WEEKS[w]) { pdpWeek=w; var p=PDP_WEEKS[w]; DATA.pdp_gallery.items=p.items; DATA.pdp_gallery.stats=p.stats; }
  if (typeof VACUUM_WEEKS!=='undefined' && VACUUM_WEEKS[w]) { vacuumWeek=w; var v=VACUUM_WEEKS[w]; DATA.vacuum.items=v.items; DATA.vacuum.stats=v.stats; }
  if (typeof WMO_FAQ_WEEKS!=='undefined' && WMO_FAQ_WEEKS[w]) { wmoWeek=w; var q=WMO_FAQ_WEEKS[w]; DATA.wmo_faq.items=q.items; DATA.wmo_faq.stats=q.stats; }
}
function onWeekChange(w) {
  currentWeek = w;
  applyWeekToAll(w);
  updateNewContentVisibility(w);
  renderContent();
}

// ── Buying Guide 주차 선택 ──────────────────────────────────
function setBgWeek(w) {
  if (!BG_WEEKS[w]) return;
  bgWeek = w;
  var d = BG_WEEKS[w];
  DATA.buying_guide.items = d.items;
  DATA.buying_guide.stats = d.stats;
  DATA.buying_guide.p1_stats = d.p1_stats;
  DATA.buying_guide.p2_stats = d.p2_stats;
  DATA.buying_guide.dam = d.dam;
  renderContent();
}
// 초기 주차 데이터 적용 (최신 주차 기본)
(function initBgWeek(){
  var d = BG_WEEKS[bgWeek];
  if (d) {
    DATA.buying_guide.items = d.items;
    DATA.buying_guide.stats = d.stats;
    DATA.buying_guide.p1_stats = d.p1_stats;
    DATA.buying_guide.p2_stats = d.p2_stats;
    DATA.buying_guide.dam = d.dam;
  }
})();

// ── 컨텐츠 건수 기반 통계 (파이프라인·리전요약 공통 기준) ──────
function contentStatsForData(d, key) {
  d = d || {};
  var c = { Done:0,'Corp. Review':0,'In Progress':0,'Pre-Review':0,'Cancel':0, total:0 };
  function add(st, n) { if (c[st] !== undefined) c[st] += n; c.total += n; }
  var sheetPageInfo = getSheetPageCountInfo(d);
  if (sheetPageInfo.hasPages) {
    c.Done = sheetPageInfo.byStatus.Done || 0;
    c['Corp. Review'] = sheetPageInfo.byStatus['Corp. Review'] || 0;
    c['In Progress'] = sheetPageInfo.byStatus['In Progress'] || 0;
    c['Pre-Review'] = sheetPageInfo.byStatus['Pre-Review'] || 0;
    c.Cancel = sheetPageInfo.byStatus.Cancel || 0;
    c.total = sheetPageInfo.total || 0;
    c.done = c.Done;
    c.Total = c.total;
    return c;
  }
  var pagesTabs = { alttext:1, pdp_gallery:1, vacuum:1, wmo_faq:1 };
  if (key === 'buying_guide') {
    var its = d.items || [];
    for (var i=0;i<its.length;i++){ var a=its[i].statuses||[]; for(var j=0;j<a.length;j++){ if(a[j]) add(a[j],1); } }
  } else if (key === 'article_list') {
    if (d.stats && d.stats.Total) {
      // 엑셀 상단 공식 통계를 그대로 사용
      var st = d.stats;
      c['Done']=st['Done']||0; c['Corp. Review']=st['Corp. Review']||0;
      c['In Progress']=st['In Progress']||0; c['Pre-Review']=st['Pre-Review']||0;
      c['Cancel']=st['Cancel']||0; c.total=st['Total']||0;
      c.done=c.Done; c.Total=c.total;
      return c;
    }
    var arts = d.articles || [];
    for (var i2=0;i2<arts.length;i2++){ var m=arts[i2].statuses||{}; for(var loc in m){ if(m.hasOwnProperty(loc)&&m[loc]) add(m[loc],1); } }
  } else if (pagesTabs[key]) {
    var it3 = d.items || [];
    for (var i3=0;i3<it3.length;i3++){ add(it3[i3].status||'Pre-Review', parseInt(it3[i3].pages)||0); }
  } else {
    var it4 = d.items || [];
    for (var i4=0;i4<it4.length;i4++){ add(it4[i4].status||'Pre-Review', 1); }
  }
  c.done = c.Done; c.Total = c.total;
  return c;
}

function contentStats(key) {
  return contentStatsForData(DATA[key], key);
}

function renderPrevWeekStatDelta(currentValue, prevStats, statusKey, cfg) {
  if (!prevStats) return '';
  var prevValue = Number(prevStats[statusKey] || 0);
  var current = Number(currentValue || 0);
  var delta = current - prevValue;
  if (!delta) return '';

  var sign = delta > 0 ? '+' : '';
  var deltaColor = delta > 0 ? '#10B981' : '#E5484D';
  return '<div class="stat-prev-change" title="Last Week 대비 변동">' +
    '<span class="stat-prev-label">Last Week</span>' +
    '<span class="stat-prev-values">' +
      '<span class="stat-prev-value">' + prevValue.toLocaleString() + '</span>' +
      '<span class="stat-prev-delta" style="color:' + deltaColor + '">' + sign + delta.toLocaleString() + '</span>' +
    '</span>' +
  '</div>';
}


function getCancelSummaryInfo(d) {
  d = d || {};
  var rows = Array.isArray(d.tableRows) ? d.tableRows : [];
  var items = Array.isArray(d.items) ? d.items : [];
  var pageCandidates = ['Page#', 'Pg#', 'Pages', 'Page', 'Total Page#', 'Total Pages'];
  var statusCandidates = ['Status', 'status', '진행상태', '상태', 'Task Status in PTT', 'Result'];
  var info = { total: 0, countries: [] };
  var countryCounts = {};

  function addCountry(label, count) {
    count = Number(count || 0);
    if (!count) return;
    var name = displayCountryFullName(label || 'Unknown');
    if (!name) name = 'Unknown';
    countryCounts[name] = (countryCounts[name] || 0) + count;
    info.total += count;
  }

  if (rows.length) {
    var countryHeader = findCountryValueHeaderForCount(d) || findCountryHeader(d.tableHeaders || []);
    var hasPageColumn = false;
    rows.forEach(function(row) {
      if (pickSheetRowValue(row, pageCandidates) !== '') hasPageColumn = true;
    });

    rows.forEach(function(row) {
      if (!row) return;
      if (hasPageColumn) {
        var st = detectSheetStatusValue(pickSheetRowValue(row, statusCandidates));
        if (st !== 'Cancel') return;
        var pg = toSheetStatNumber(pickSheetRowValue(row, pageCandidates)) || 1;
        addCountry(countryHeader ? row[countryHeader] : '', pg);
        return;
      }

      var fallbackCountry = countryHeader ? row[countryHeader] : '';
      Object.keys(row).forEach(function(k) {
        if (k === '__styles') return;
        var st = detectSheetStatusValue(row[k]);
        if (st !== 'Cancel') return;
        // 국가가 th/header에 있는 예외 구조는 해당 header명을 국가로 사용합니다.
        // 일반 Country 컬럼이 있는 구조는 row의 Country 값을 우선 사용합니다.
        var label = fallbackCountry;
        if (!label || isCountryDisplayHeader(k)) label = k;
        addCountry(label, 1);
      });
    });
  } else {
    items.forEach(function(item) {
      if (!item) return;
      var st = detectSheetStatusValue(item.overall || item.status || '');
      if (st !== 'Cancel') return;
      addCountry(item.country || item.locale || '', item.pages ? toSheetStatNumber(item.pages) : 1);
    });
  }

  info.countries = Object.keys(countryCounts).map(function(name) {
    return { name: name, count: countryCounts[name] };
  }).sort(function(a, b) {
    return b.count - a.count || a.name.localeCompare(b.name);
  });
  return info;
}

function renderCancelSummaryBelowStats(d, stats) {
  var info = getCancelSummaryInfo(d);
  var total = info.total || (stats && stats.Cancel) || 0;
  if (!total) return '';
  var countryText = info.countries.length
    ? info.countries.map(function(x) { return escapeHtmlSheet(x.name) + (x.count > 1 ? ' ' + x.count.toLocaleString() : ''); }).join(', ')
    : 'Country 정보 없음';
  return '<div class="stat-cancel-desc">' +
    '<span class="stat-cancel-dot"></span>' +
    '<strong>취소 ' + Number(total).toLocaleString() + '건</strong>' +
    '<span class="stat-cancel-countries">' + countryText + '</span>' +
  '</div>';
}

// ── 사이드바 메뉴 진행률 뱃지 동기화 (contentStats 기준) ──────
function syncNavBadges() {
  var items = document.querySelectorAll('.nav-item[data-key]');
  items.forEach(function(el) {
    var key = el.getAttribute('data-key');
    if (!DATA[key]) return;
    var cs = contentStats(key);
    var pct = cs.total > 0 ? Math.round((cs.Done || 0) / cs.total * 100) : 0;
    var badge = el.querySelector('.ni-badge');
    if (!badge) return;
    badge.textContent = pct + '%';
    var bg, tc;
    if (pct >= 70) { bg = 'rgba(16,185,129,.2)'; tc = '#10B981'; }
    else if (pct >= 40) { bg = 'rgba(59,130,246,.2)'; tc = '#3B82F6'; }
    else if (pct >= 15) { bg = 'rgba(245,158,11,.2)'; tc = '#F59E0B'; }
    else { bg = 'rgba(148,163,184,.2)'; tc = '#94A3B8'; }
    badge.style.background = bg;
    badge.style.color = tc;
  });
}

function buildRegionSummary(items, opts) {
  opts = opts || {};
  var countMode = opts.countMode || 'simple'; // 'simple' | 'cells' | 'pages'
  var statusKey = opts.statusKey || 'status';
  var unitLabel = opts.unitLabel || '개';

  if (!items || !items.length) return '';

  function regionOf(item) {
    if (item.locale && LOCALE_MAP[item.locale]) {
      return (LOCALE_MAP[item.locale].region || item.region || 'Other').toUpperCase();
    }
    return (item.region || 'Other').toUpperCase();
  }

  // 리전별 컨텐츠 단위 집계
  var groups = {};
  function ensure(rgn) {
    if (!groups[rgn]) groups[rgn] = { total: 0, Done: 0, 'Corp. Review': 0, 'In Progress': 0, 'Pre-Review': 0, 'Cancel': 0 };
    return groups[rgn];
  }

  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var rgn = regionOf(item);
    var g = ensure(rgn);

    if (countMode === 'cells') {
      // BG/Article: statuses 배열의 각 셀을 컨텐츠 1개로 카운트
      var arr = item.statuses || [];
      for (var c = 0; c < arr.length; c++) {
        var st = arr[c];
        if (!st) continue; // 빈 셀 제외
        g.total++;
        if (g[st] !== undefined) g[st]++;
      }
    } else if (countMode === 'pages') {
      // Alt/PDP/Vacuum: pages 수만큼 컨텐츠 카운트, locale status 적용
      var pg = parseInt(item.pages) || 0;
      var s1 = item[statusKey] || 'Pre-Review';
      g.total += pg;
      if (g[s1] !== undefined) g[s1] += pg;
    } else {
      // simple: locale당 컨텐츠 1개
      var s2 = item[statusKey] || 'Pre-Review';
      g.total++;
      if (g[s2] !== undefined) g[s2]++;
    }
  }

  // 리전 순서
  var regionList = [];
  for (var ro = 0; ro < REGION_ORDER.length; ro++) {
    if (groups[REGION_ORDER[ro]]) regionList.push(REGION_ORDER[ro]);
  }
  for (var k in groups) {
    if (groups.hasOwnProperty(k) && regionList.indexOf(k) === -1) regionList.push(k);
  }

  // 전체 합계
  var grand = { total: 0, Done: 0, 'Corp. Review': 0, 'In Progress': 0, 'Pre-Review': 0 };
  for (var gk in groups) {
    if (!groups.hasOwnProperty(gk)) continue;
    grand.total += groups[gk].total;
    grand.Done += groups[gk].Done;
    grand['Corp. Review'] += groups[gk]['Corp. Review'];
    grand['In Progress'] += groups[gk]['In Progress'];
    grand['Pre-Review'] += groups[gk]['Pre-Review'];
  }

  // 리전 카드
  var cards = [];
  for (var ri = 0; ri < regionList.length; ri++) {
    var rgnName = regionList[ri];
    var gg = groups[rgnName];
    var rcfg = REGION_CFG[rgnName] || { label: rgnName, bg: '#F5F6FA', tc: '#6B7280', border: '#E0E4F0' };
    var pct = gg.total > 0 ? Math.round(gg.Done / gg.total * 100) : 0;

    var chips = [];
    var order = ['Done', 'Corp. Review', 'In Progress', 'Pre-Review'];
    for (var ci = 0; ci < order.length; ci++) {
      var sk = order[ci];
      var sc = SC[sk];
      var val = gg[sk] || 0;
      var clr = val > 0 ? sc.tc : '#C8CDD8';
      var dotClr = val > 0 ? sc.dot : '#D1D5DB';
      chips.push('<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;color:' + clr + '">' +
        '<span style="width:6px;height:6px;border-radius:50%;background:' + dotClr + '"></span>' +
        sc.label + ' <b style="font-weight:800">' + val + '</b></span>');
    }

    var bar = '<div style="height:6px;border-radius:4px;background:#EEF0F5;overflow:hidden;margin-top:8px">' +
      '<div style="height:100%;width:' + pct + '%;background:' + rcfg.tc + ';border-radius:4px"></div></div>';

    cards.push(
      '<div style="background:#fff;border:1px solid #E8EAF2;border-left:3px solid ' + rcfg.tc + ';border-radius:10px;padding:12px 14px">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">' +
          '<span style="font-size:11px;font-weight:800;color:' + rcfg.tc + ';background:' + rcfg.bg + ';padding:2px 8px;border-radius:5px">' + rcfg.label + '</span>' +
          '<span style="font-size:13px;font-weight:800;color:#1A1D2E">' + gg.Done + '<span style="color:#9BA3BF;font-weight:500">/' + gg.total + '</span> <span style="color:' + rcfg.tc + ';font-size:11px">(' + pct + '%)</span></span>' +
        '</div>' +
        bar +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:9px">' + chips.join('') + '</div>' +
      '</div>'
    );
  }

  var grandPct = grand.total > 0 ? Math.round(grand.Done / grand.total * 100) : 0;

  return '<div style="background:#fff;border:1px solid #E8EAF2;border-radius:14px;padding:16px 20px;margin-bottom:14px">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">' +
      '<div>' +
        '<div style="font-size:10px;font-weight:700;letter-spacing:.1em;color:#1A1D2E;text-transform:uppercase">Region Progress</div>' +
        '<div style="font-size:14px;font-weight:700;color:#1A1D2E;margin-top:2px">\uB9AC\uC804\uBCC4 \uC9C4\uD589 \uD604\uD669 <span style="font-size:11px;color:#9BA3BF;font-weight:500">(\uCEE8\uD150\uCE20 ' + unitLabel + ' \uAE30\uC900)</span></div>' +
      '</div>' +
      '<div style="text-align:right">' +
        '<div style="font-size:10px;color:#9BA3BF;font-weight:600">\uC804\uCCB4 \uC644\uB8CC\uC728</div>' +
        '<div style="font-size:18px;font-weight:800;color:#1A1D2E">' + grand.Done + '<span style="color:#9BA3BF;font-weight:500">/' + grand.total + '</span> <span style="color:#3B62E8;font-size:13px">(' + grandPct + '%)</span></div>' +
      '</div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">' + cards.join('') + '</div>' +
  '</div>';
}

function buildFilterBarHtml() {
  var regionOpts = REGION_ORDER.map(function(r) {
    var rcfg = REGION_CFG[r] || {};
    var sel = filterRegion === r ? 'selected' : '';
    return '<option value="' + r + '" ' + sel + '>' + (rcfg.label || r) + '</option>';
  }).join('');

  return '<div class="filter-bar-inline">' +
    '<span class="filter-bar-hint">항목을 클릭하면 상세 현황을 볼 수 있습니다</span>' +
    '<div class="filter-bar-controls">' +
      '<select class="filter-sel" id="regionFilter" onchange="filterRegion=this.value;renderTable()">' +
        '<option value=""' + (!filterRegion ? ' selected' : '') + '>All Regions</option>' +
        regionOpts +
      '</select>' +
    '</div>' +
  '</div>';
}

// ── 탭바 HTML (각 render 함수에서 호출) ──────────────────────
function buildTabBarHtml(filteredCount) {
  const d = DATA[currentKey];
  const s = d.stats || {};
  const totalItems = (filteredCount !== undefined) ? filteredCount :
                     (d.items ? d.items.length :
                      d.articles ? d.articles.length : (s.Total || 0));
  const tabs = buildTabs(s);
  return `
  <div class="tab-bar-inline">
    <div class="tab-nav">${tabs}</div>
  </div>`;
}

function switchTab(el) {
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  currentTab = el.dataset.tab;
  renderTable();
}

function setView(v) {
  currentView = v;
  { var gb=document.getElementById('gBtn'); if(gb) gb.classList.toggle('on', v==='grid'); };
  { var lb=document.getElementById('lBtn'); if(lb) lb.classList.toggle('on', v==='list'); };
  renderTable();
}

function resetFilters() {
  filterRegion=''; filterPhase='';
  const rf = document.getElementById('regionFilter');
  const pf = document.getElementById('phaseFilter');
  if(rf) rf.value='';
  if(pf) pf.value='';
  currentTab='all';
  document.querySelectorAll('.tab').forEach((t,i)=>t.classList.toggle('active',i===0));
  renderTable();
}

function getRegions() {
  if (window.__SHEET_DRIVEN_NAV && DATA[currentKey] && Array.isArray(DATA[currentKey].tableRows)) {
    var preferred = ['EU', 'ASIA', 'CIS', 'LATAM', 'MEA', 'INDIA', 'NA', 'ETC'];
    var seen = {};
    (DATA[currentKey].tableRows || []).forEach(function(row) {
      var r = normalizeDisplayRegion(row.Region || row.region || 'ETC');
      if (r) seen[r] = true;
    });
    var out = preferred.filter(function(r) { return seen[r]; });
    Object.keys(seen).sort().forEach(function(r) { if (out.indexOf(r) < 0) out.push(r); });
    return out;
  }
  return REGION_ORDER.slice();
}

function getPhases() {
  const d = DATA[currentKey];
  if (d.phases) return d.phases;
  if (d.items && (d.items[0] && d.items[0].phase)) return [...new Set(d.items.map(x=>x.phase))];
  return [];
}
function getRegionLabel() {
  return filterRegion || 'All Countries';
}

// ── MAIN RENDER TABLE ────────────────────────────────────────
function renderTable() {
  const area = document.getElementById('dataArea');
  if (!area) return;
  area.innerHTML = '';

  const d = DATA[currentKey];
  if (d && Array.isArray(d.tableHeaders) && d.tableHeaders.length) {
    renderSheetDrivenTable(area, d);
    return;
  }
  if (window.__SHEET_DRIVEN_NAV) {
    var msg = d && d.loadError ? d.loadError : '표시할 데이터가 없습니다. 해당 시트의 A열에 Head가 있는지 확인해주세요.';
    area.innerHTML = '<div class="empty-state">' + escapeHtmlSheet(msg) + '</div>';
    return;
  }

  const k = currentKey;

  if (k === 'buying_guide') renderBG(area);
  else if (k === 'article_list') renderArticle(area);
  else if (k === 'microsite') renderMicrosite(area);
  else if (k === 'washtower') renderWashTower(area);
  else if (k === 'ice_solution') renderIceSolution(area);
  else if (k === 'alttext') renderAltText(area);
  else if (k === 'faq_hub') renderFaqHub(area);
  else if (k === 'pdp_gallery') renderPdpGallery(area);
  else if (k === 'vacuum') renderVacuum(area);
  else if (k === 'wmo_faq') renderWmoFaq(area);
}

// ── BUYING GUIDE ─────────────────────────────────────────────
function renderBG(area) {
  var d = DATA.buying_guide;
  var allItems = d.items;

  // ── 필터링
  var items = allItems.slice();
  if (currentTab !== 'all') items = items.filter(function(x) { return x.overall === currentTab; });
  if (filterRegion) {
    items = items.filter(function(x) {
      var lm = LOCALE_MAP[x.locale] || {};
      var rgn = lm.region || x.region || '';
      return rgn === filterRegion;
    });
  }

  var cols = ['Kit','Ldy','Hub','RT','RF','RS','WT','WF','WS','IK','IL'];
  var COL_TOOLTIP_BG = {
    Kit:'Kitchen', Ldy:'Laundry', Hub:'Hub',
    RT:'REF Type', RF:'REF Feature', RS:'REF Size',
    WT:'WM Type',  WF:'WM Feature', WS:'WM Size',
    IK:'Kitchen', IL:'Laundry'
  };
  var COL_GROUPS = [
    { label:'CATEGORY',       cols:['Kit','Ldy'],                     bg:'#DBEAFE', tc:'#1E40AF', border:'#BFDBFE' },
    { label:'BUYING GUIDE',   cols:['Hub','RT','RF','RS','WT','WF'],  bg:'#DCFCE7', tc:'#166534', border:'#BBF7D0' },
    { label:'INSTALL. GUIDE', cols:['WS','IK','IL'],                  bg:'#FEF3C7', tc:'#92400E', border:'#FDE68A' },
  ];

  // ── 셀 렌더
  function cellHtmlBG(s, url) {
    if (!s) return '<td style="text-align:center"><span style="color:#E2E8F0;font-size:10px">\u2014</span></td>';
    if (s==='Done') {
      // URL 있으면 클릭 가능한 초록 동그라미, 없으면 정적 초록 동그라미
      var dot = '<span style="display:inline-block;width:13px;height:13px;border-radius:50%;background:#22C55E"></span>';
      if (url) {
        return '<td style="text-align:center"><a href="'+url+'" target="_blank" rel="noopener" title="'+url+'" style="display:inline-flex;align-items:center;justify-content:center;cursor:pointer">'+dot+'</a></td>';
      }
      return '<td style="text-align:center">'+dot+'</td>';
    }
    if (s==='Corp. Review')
      return '<td style="text-align:center"><span style="font-size:10px;font-weight:800;color:#F59E0B">\uBC95\uC778\uB9AC\uBDF0</span></td>';
    if (s==='Cancel')
      return '<td style="text-align:center"><span style="font-size:10px;font-weight:800;color:#F59E0B">Cancel</span></td>';
    if (s==='In Progress')
      return '<td style="text-align:center"><span style="font-size:10px;font-weight:700;color:#3B82F6">\uC791\uC5C5\uC911</span></td>';
    // Pre-Review
    return '<td style="text-align:center"><span style="font-size:10px;color:#94A3B8">\uC0AC\uC804\uAC80\uD1A0</span></td>';
  }

  // ── 헤더 행1
  var hdrRow1 = '<th rowspan="2" style="vertical-align:middle;white-space:nowrap;min-width:52px">Region</th>';
  hdrRow1 += '<th rowspan="2" style="vertical-align:middle;white-space:nowrap;max-width:140px;text-align:left;padding-left:10px">Country</th>';
  hdrRow1 += '<th rowspan="2" style="vertical-align:middle;white-space:nowrap">차수</th>';
  hdrRow1 += '<th rowspan="2" style="vertical-align:middle;max-width:80px">Status</th>';
  hdrRow1 += '<th rowspan="2" style="vertical-align:middle">Done</th>';
  for (var gi=0; gi<COL_GROUPS.length; gi++) {
    var g = COL_GROUPS[gi];
    hdrRow1 += '<th colspan="'+g.cols.length+'" style="background:'+g.bg+';color:'+g.tc+';border-bottom:2px solid '+g.border+';text-align:center">'+g.label+'</th>';
  }
  hdrRow1 += '<th rowspan="2" style="vertical-align:middle">Remark</th>';

  // ── 헤더 행2: 컬럼 약어
  var hdrRow2 = '';
  for (var gi2=0; gi2<COL_GROUPS.length; gi2++) {
    var g2 = COL_GROUPS[gi2];
    for (var ci=0; ci<g2.cols.length; ci++) {
      var col = g2.cols[ci];
      hdrRow2 += '<th style="background:'+g2.bg+';color:'+g2.tc+';font-weight:700;white-space:nowrap;font-size:10px;padding:5px 7px">'+(COL_TOOLTIP_BG[col]||col)+'</th>';
    }
  }

  // ── 리전별 그룹핑
  var regionGroups = {};
  var regionOrder = [];
  for (var ri=0; ri<items.length; ri++) {
    var itm = items[ri];
    var lm  = LOCALE_MAP[itm.locale] || {};
    var rgn = lm.region || itm.region || 'Other';
    if (!regionGroups[rgn]) { regionGroups[rgn] = []; regionOrder.push(rgn); }
    regionGroups[rgn].push(itm);
  }
  // REGION_ORDER 순서 적용
  var sortedRegions = [];
  for (var ro=0; ro<REGION_ORDER.length; ro++) {
    if (regionGroups[REGION_ORDER[ro]]) sortedRegions.push(REGION_ORDER[ro]);
  }
  for (var ro2=0; ro2<regionOrder.length; ro2++) {
    if (sortedRegions.indexOf(regionOrder[ro2]) === -1) sortedRegions.push(regionOrder[ro2]);
  }

  // ── 데이터 행
  var bgRows = [];
  for (var sri=0; sri<sortedRegions.length; sri++) {
    var region = sortedRegions[sri];
    var regionItems = regionGroups[region];
    if (!regionItems || !regionItems.length) continue;
    var rcfg = REGION_CFG[region] || { label:region, bg:'#F5F6FA', tc:'#6B7280', border:'#E0E4F0' };

    for (var ii=0; ii<regionItems.length; ii++) {
      var item = regionItems[ii];
      var lmm  = LOCALE_MAP[item.locale] || {};
      var countryName = lmm.country || item.locale;
      var cfg = SC[item.overall] || SC['Pre-Review'];
      var remarkTxt = item.remark || '\u2014';
      var remarkColor = item.remark ? '#6B7280' : '#D1D5DB';

      var phasePill = item.phase === 'Phase 1'
        ? '<span style="font-size:9px;font-weight:700;padding:2px 6px;border-radius:3px;background:#EEF2FF;color:#1A2B5E">1차</span>'
        : '<span style="font-size:9px;font-weight:700;padding:2px 6px;border-radius:3px;background:#FFF0F2;color:#A50034">2차</span>';
      var statusPill = '<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px;background:'+cfg.bg+';color:'+cfg.tc+'">'+cfg.label+'</span>';

      // 11컬럼 셀
      var cells = '';
      for (var ci2=0; ci2<cols.length; ci2++) {
        cells += cellHtmlBG(item.statuses[ci2], (item.urls && item.urls[ci2]) || '');
      }

      var regionCell = '';
      if (ii === 0) {
        regionCell = '<td rowspan="'+regionItems.length+'" style="text-align:center;font-size:10px;font-weight:800;background:'+rcfg.bg+';color:'+rcfg.tc+';border-right:2px solid '+rcfg.border+';vertical-align:middle;white-space:nowrap">'+rcfg.label+'</td>';
      }

      bgRows.push('<tr>' +
        regionCell +
        '<td style="font-weight:600;color:#1A1D2E;font-size:11px;white-space:nowrap;max-width:140px;padding-left:10px">'+countryName+'</td>' +
        '<td style="text-align:center">'+phasePill+'</td>' +
        '<td style="text-align:center">'+statusPill+'</td>' +
        '<td style="text-align:center;font-weight:800;color:'+cfg.tc+';font-size:11px">'+item.done+'<span style="color:#9BA3BF;font-weight:400">/11</span></td>' +
        cells +
        '<td style="font-size:11px;color:'+remarkColor+';text-align:center;max-width:100px;white-space:normal">'+remarkTxt+'</td>' +
      '</tr>');
    }
  }

  // ── Phase 1/2 요약 카드
  var p1 = d.p1_stats || {};
  var p2 = d.p2_stats || {};
  var p1Items = allItems.filter(function(x) { return x.phase === 'Phase 1'; });
  var p2Items = allItems.filter(function(x) { return x.phase === 'Phase 2'; });
  var p1Pct = p1.Total ? Math.round(p1.Done / p1.Total * 100) : 0;
  var p2Pct = p2.Total ? Math.round(p2.Done / p2.Total * 100) : 0;

  function phaseBar(st, total) {
    if (!total) return '';
    var segs = ['Done','Corp. Review','In Progress','Pre-Review'].map(function(k) {
      var v = st[k] || 0;
      var w = Math.round(v / total * 100);
      var c = SC[k] ? SC[k].dot : '#ddd';
      return w > 0 ? '<div style="width:'+w+'%;background:'+c+';height:8px"></div>' : '';
    }).join('');
    return '<div style="display:flex;border-radius:4px;overflow:hidden;background:#eee">'+segs+'</div>';
  }
  function phaseLegend(st) {
    return ['Done','Corp. Review','In Progress','Pre-Review'].map(function(k) {
      var v = st[k] || 0;
      if (!v) return '';
      var c = SC[k] || {};
      return '<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;color:'+(c.tc||'#555')+'"><span style="width:6px;height:6px;border-radius:50%;background:'+(c.dot||'#ddd')+'"></span>'+(c.label||k)+' '+v+'</span>';
    }).filter(Boolean).join('<span style="color:#ddd;margin:0 4px">\u00b7</span>');
  }

  var phaseSummaryHtml = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-bottom:16px">' +
    '<div style="background:#fff;border:1px solid #E8EAF2;border-radius:12px;padding:18px;border-top:3px solid #047857">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px"><div>' +
        '<div style="font-size:10px;font-weight:700;color:#047857;letter-spacing:.06em;text-transform:uppercase">PHASE 1 \u00b7 1\ucc28 \uad6d\uac00</div>' +
        '<div style="font-size:12px;color:#6B7280;margin-top:3px">'+p1Items.length+'\uac1c Locale \u00b7 '+(p1.Total||0)+'\uac74</div>' +
      '</div><div style="font-size:28px;font-weight:800;color:#047857">'+p1Pct+'%</div></div>' +
      phaseBar(p1, p1.Total) +
      '<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px">'+phaseLegend(p1)+'</div>' +
    '</div>' +
    '<div style="background:#fff;border:1px solid #E8EAF2;border-radius:12px;padding:18px;border-top:3px solid #3B82F6">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px"><div>' +
        '<div style="font-size:10px;font-weight:700;color:#3B82F6;letter-spacing:.06em;text-transform:uppercase">PHASE 2 \u00b7 2\ucc28 \uad6d\uac00</div>' +
        '<div style="font-size:12px;color:#6B7280;margin-top:3px">'+p2Items.length+'\uac1c Locale \u00b7 '+(p2.Total||0)+'\uac74</div>' +
      '</div><div style="font-size:28px;font-weight:800;color:#3B82F6">'+p2Pct+'%</div></div>' +
      phaseBar(p2, p2.Total) +
      '<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px">'+phaseLegend(p2)+'</div>' +
    '</div>' +
  '</div>';

  // ── 테이블 HTML
  var tableHtml = '<div style="background:#fff;border:1px solid #E8EAF2;border-radius:14px;padding:16px 20px 8px">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px">' +
      '<div>' +
        '<div style="font-size:10px;font-weight:700;letter-spacing:.1em;color:#1A1D2E;text-transform:uppercase">Full Data Table</div>' +
        '<div style="font-size:14px;font-weight:700;color:#1A1D2E;margin-top:2px">\uad6d\uac00 \u00d7 BG \ub9e4\ud2b8\ub9ad\uc2a4 ('+items.length+'\uac1c \uad6d\uac00)</div>' +
      '</div>' +

    '</div>' +
    buildNewBanner()+buildActionBanner() +
    '<div class="art-table-wrap">' +
      '<table class="art-table">' +
        '<thead><tr>'+hdrRow1+'</tr><tr>'+hdrRow2+'</tr></thead>' +
        '<tbody>'+(bgRows.join('')||'<tr><td colspan="99" style="padding:30px;color:#9BA3BF;text-align:center">\uac80\uc0c9 \uacb0\uacfc\uac00 \uc5c6\uc2b5\ub2c8\ub2e4</td></tr>')+'</tbody>' +
      '</table>' +
    '</div>' +
  '</div>';

    var bgPanels = '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:14px">' + buildCountryVariation(bgCountryRows(allItems)) + buildWeeklyChart() + '</div>';
  area.innerHTML = phaseSummaryHtml + bgPanels + buildBgActionSection() + buildFilterBarHtml() + buildTabBarHtml(items.length) + tableHtml;
}

// ── Article 주차별 진행 분석 메시지 ───────────────────────
function articleWeeklyInsight() {
  var weeks = Object.keys(ARTICLE_WEEKS).sort();
  if (weeks.length < 2) return null;
  var pcts = weeks.map(function(w){ var s=ARTICLE_WEEKS[w].stats||{}; return s.Total>0?Math.round(s.Done/s.Total*100):0; });
  var last = weeks[weeks.length-1], ls = ARTICLE_WEEKS[last].stats||{};
  var firstP = pcts[0], lastP = pcts[pcts.length-1];
  var delta = lastP - firstP;
  var pre = ls['Pre-Review']||0, wip = ls['In Progress']||0, corp = ls['Corp. Review']||0;
  var level, msg;
  if (delta <= 0) {
    level='warn';
    msg='<b>진행률 정체</b> — 최근 '+weeks.length+'주간('+weeks[0]+'~'+last+') 진행률이 '+lastP+'%로 변동이 없습니다. 사전검토 '+pre+'건 · 작업중 '+wip+'건 · 법인리뷰 '+corp+'건 — 진행 독려가 필요합니다.';
  } else if (delta < 5) {
    level='caution';
    msg='<b>진행 더딤</b> — '+weeks[0]+'~'+last+' '+delta+'%p 증가에 그쳤습니다. 사전검토 '+pre+'건 잔여.';
  } else {
    level='ok';
    var prevW=weeks[weeks.length-2];
    var prevDone=(ARTICLE_WEEKS[prevW].stats||{}).Done||0;
    var doneDelta=(ls.Done||0)-prevDone;
    var ppDelta=lastP-pcts[pcts.length-2];
    msg='<b>진행 양호</b> — 전주차('+prevW+') 대비 '+doneDelta+'건 진행되어 '+ppDelta+'%p 상승했습니다 (현재 '+lastP+'%). 잔여 사전검토 '+pre+'건.';
  }
  return { level: level, msg: msg };
}

// ── Article 주차별 현황 차트 (BG와 동일 구조) ──────────────
function buildArticleWeeklyChart() {
  var weeks = Object.keys(ARTICLE_WEEKS).sort();
  if (!weeks.length) return '';
  var series = [
    { key:'pre',  label:'사전검토', color:SC['Pre-Review'].dot },
    { key:'wip',  label:'작업중',   color:SC['In Progress'].dot },
    { key:'corp', label:'법인리뷰', color:SC['Corp. Review'].dot },
    { key:'done', label:'완료',     color:SC['Done'].dot }
  ];
  var wkData = weeks.map(function(wk){
    var s = ARTICLE_WEEKS[wk].stats || {};
    return { wk:wk, pre:s['Pre-Review']||0, wip:s['In Progress']||0,
      corp:s['Corp. Review']||0, done:s.Done||0, total:s.Total||0 };
  });
  var maxV = 0;
  wkData.forEach(function(d){ maxV=Math.max(maxV,d.total||0); });
  var yMax = maxV || 10;
  var chartH = 170;

  var grid='', yLabels='';
  for (var g=0; g<=4; g++) {
    var val=Math.round(yMax*g/4), bottom=(val/yMax)*chartH;
    grid += '<div style="position:absolute;left:0;right:0;bottom:'+bottom+'px;border-top:1px solid #F0F1F8"></div>';
    yLabels += '<div style="position:absolute;right:0;bottom:'+(bottom-6)+'px;font-size:9px;color:#9BA3BF;font-weight:600">'+val+'건</div>';
  }

  var groups = wkData.map(function(d){
    var pct = d.total>0?Math.round(d.done/d.total*100):0;
    var bars = series.map(function(se){
      var v=d[se.key];
      var h=Math.max(Math.round((v/yMax)*chartH), v>0?2:0);
      return '<div data-wk="'+d.wk+'" data-pct="'+pct+'" data-label="'+se.label+'" data-val="'+v+'" data-color="'+se.color+'" '+
        'onmouseenter="bgBarTip(event)" onmousemove="bgBarTip(event)" onmouseleave="bgBarTipHide()" '+
        'onmouseover="this.style.opacity=0.75" onmouseout="this.style.opacity=1" '+
        'style="width:11px;height:'+h+'px;background:'+se.color+';border-radius:3px 3px 0 0;cursor:pointer;transition:opacity .15s"></div>';
    }).join('');
    return '<div style="flex:1;height:100%;display:flex;align-items:flex-end;justify-content:center;gap:3px">'+bars+'</div>';
  }).join('');

  var weekLabels = wkData.map(function(d){
    var active=(d.wk===articleWeek);
    return '<div onclick="setArticleWeek(\''+d.wk+'\')" style="flex:1;text-align:center;font-size:11px;font-weight:'+(active?'800':'600')+';color:'+(active?'#A50034':'#6B7280')+';cursor:pointer">'+d.wk+'</div>';
  }).join('');

  var legend = series.map(function(se){
    return '<span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:#6B7280"><span style="width:12px;height:12px;border-radius:3px;background:'+se.color+'"></span>'+se.label+'</span>';
  }).join('');

  var ins = articleWeeklyInsight();
  var banner='';
  if (ins) {
    var bc={ warn:{bg:'#FEF6F0',bd:'#F59E0B',tc:'#92400E',ic:'\\u26A0'}, caution:{bg:'#FFFBEB',bd:'#FBBF24',tc:'#92400E',ic:'\\u26A0'}, ok:{bg:'#F0FDF4',bd:'#22C55E',tc:'#166534',ic:'\\u2713'} }[ins.level];
    banner='<div style="background:'+bc.bg+';border:1px solid '+bc.bd+'33;border-left:3px solid '+bc.bd+';border-radius:8px;padding:10px 14px;margin-top:14px;font-size:11.5px;color:'+bc.tc+';line-height:1.5">'+
      (ins.level==='ok'?okIcon(bc.bd):warnIcon(bc.bd))+ins.msg+'</div>';
  }

  return '<div style="background:#fff;border:1px solid #E8EAF2;border-radius:14px;padding:16px 20px;flex:1;min-width:340px">'+
    '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px">'+
      '<div><div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#1A1D2E;text-transform:uppercase">주차별 현황</div>'+
      '<div style="font-size:10px;color:#9BA3BF;font-weight:600">WEEKLY PROGRESS</div></div>'+
      '<span style="font-size:11px;font-weight:800;color:#fff;background:#A50034;padding:3px 10px;border-radius:6px">2026</span>'+
    '</div>'+
    '<div style="display:flex;gap:8px;margin-top:18px">'+
      '<div style="position:relative;width:34px;height:'+chartH+'px;flex-shrink:0">'+yLabels+'</div>'+
      '<div style="position:relative;flex:1;height:'+chartH+'px">'+grid+
        '<div style="position:absolute;left:0;right:0;bottom:0;top:0;display:flex;align-items:flex-end">'+groups+'</div>'+
      '</div>'+
    '</div>'+
    '<div style="display:flex;gap:8px;margin-top:8px">'+
      '<div style="width:34px;flex-shrink:0"></div>'+
      '<div style="flex:1;display:flex">'+weekLabels+'</div>'+
    '</div>'+
    '<div style="display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:18px;padding-top:12px;border-top:1px solid #F0F1F8">'+legend+'</div>'+
    banner+
  '</div>';
}

// ── Article List 본부 확인·보고 필요 사항 (hub제작국가 진행 현황) ──
function buildArticleActionSection() {
  var arts = DATA.article_list.articles || [];
  var ART_FULL = {
    'UK':'United Kingdom','DE':'Germany','FR':'France','IT':'Italy','ES':'Spain','GR(50)':'Greece',
    'TH':'Thailand','TW':'Taiwan','PH':'Philippines','VN':'Vietnam','AU':'Australia',
    'CO':'Colombia','PE':'Peru','CL':'Chile','BR':'Brazil','MX':'Mexico','SE':'Sweden',
    'SA_en':'Saudi Arabia (en)','SA_ar':'Saudi Arabia (ar)','EG_en':'Egypt (en)','EG_ar':'Egypt (ar)',
    'EE':'Estonia','LT':'Lithuania','LV':'Latvia','CZ':'Czech Republic','PT':'Portugal',
    'BE(50)':'Belgium','DK(50)':'Denmark','FI(50)':'Finland','PA':'Panama','ZA':'South Africa',
    'CA_en':'Canada (en)','CA_fr':'Canada (fr)','ID':'Indonesia','IN':'India','MY':'Malaysia','HK':'Hong Kong'
  };
  function nm(c){ return ART_FULL[c] || c; }

  // hub제작국가 × 진행사항 집계 (중복 hub 제거, 마지막 진행상태 기준)
  var hubMap = {}, hubUrl = {}, order = [];
  for (var i=0;i<arts.length;i++){
    var hub = arts[i].hub, prog = arts[i].progress;
    if (!hub) continue;
    if (!hubMap.hasOwnProperty(hub)) order.push(hub);
    hubMap[hub] = prog || '미표기';
    if (arts[i].url) hubUrl[hub] = arts[i].url;
  }
  var done=[], review=[], request=[], etc=[];
  for (var k=0;k<order.length;k++){
    var h=order[k], p=hubMap[h];
    if (p==='완료') done.push(h);
    else if (p==='법인리뷰'||p==='법인검토') review.push(h);
    else if (p==='작업요청'||p==='작업중') request.push(h);
    else etc.push(h);
  }
  var totalHub = order.length;

  function chips(arr, color, bg, linked) {
    return arr.map(function(c){
      var label = nm(c);
      var base = 'display:inline-block;font-size:11px;font-weight:700;color:'+color+';background:'+bg+';border-radius:5px;padding:3px 9px;margin:2px 3px 2px 0';
      if (linked && hubUrl[c]) {
        return '<a href="'+hubUrl[c]+'" target="_blank" rel="noopener" title="'+hubUrl[c]+'" style="'+base+';text-decoration:none;cursor:pointer">'+label+' \u2197</a>';
      }
      return '<span style="'+base+'">'+label+'</span>';
    }).join('');
  }

  function statBlock(label, arr, dot, color, bg, linked) {
    if (!arr.length) return '';
    return '<div style="margin-bottom:14px">' +
      '<div style="display:flex;align-items:center;gap:7px;margin-bottom:7px">' +
        '<span style="width:9px;height:9px;border-radius:50%;background:'+dot+'"></span>' +
        '<span style="font-size:12px;font-weight:800;color:#1A1D2E">'+label+'</span>' +
        '<span style="font-size:11px;font-weight:800;color:'+dot+'">'+arr.length+'개국</span>' +
      '</div>' +
      '<div style="padding-left:16px">'+chips(arr, color, bg, linked)+'</div>' +
    '</div>';
  }

  return '<div style="background:#fff;border:1px solid #E8EAF2;border-top:3px solid #A50034;border-radius:14px;padding:20px 24px;margin-bottom:14px">' +
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">' +
      '<span style="font-size:10px;font-weight:800;letter-spacing:.1em;color:#A50034;text-transform:uppercase">Action Required</span>' +
      '<span style="font-size:10px;font-weight:700;color:#fff;background:#A50034;padding:2px 8px;border-radius:5px">본부 확인 필요</span>' +
    '</div>' +
    '<div style="font-size:15px;font-weight:800;color:#1A1D2E;margin-bottom:14px">hub제작국가 진행 현황 보고 (Article List)</div>' +

    // 요약 배너
    '<div style="background:#FEF6F0;border:1px solid #F59E0B33;border-left:3px solid #F59E0B;border-radius:8px;padding:11px 14px;margin-bottom:18px;font-size:12px;color:#92400E;line-height:1.6;display:flex;align-items:flex-start">' +
      warnIcon('#F59E0B') +
      '<span>hub제작국가 총 <b>'+totalHub+'개국</b> 중 완료 <b style="color:#166534">'+done.length+'</b> · 법인리뷰 <b style="color:#92400E">'+review.length+'</b> · 작업요청 <b style="color:#1E40AF">'+request.length+'</b>. 법인리뷰·작업요청 건은 본부의 진행 독려 및 일정 확인이 필요합니다.</span>' +
    '</div>' +

    statBlock('완료', done, '#10B981', '#047857', '#ECFDF5', true) +
    statBlock('법인리뷰 (본부 독려 필요)', review, '#F59E0B', '#92400E', '#FFFBEB') +
    statBlock('작업요청 (착수 일정 확인)', request, '#3B82F6', '#1E40AF', '#EFF6FF') +
    (etc.length ? statBlock('기타/미표기', etc, '#94A3B8', '#475569', '#F8FAFC') : '') +
  '</div>';
}

function renderArticle(area) {
  var d = DATA.article_list;
  var allArts = d.articles || [];
  var countries = d.locales || [];

  // 탭 필터 (overall 기준)
  var arts = allArts.slice();
  if (currentTab !== 'all') arts = arts.filter(function(a){ return a.overall === currentTab; });

  // ── 주차 셀렉터
  var weekKeys = Object.keys(ARTICLE_WEEKS).sort();
  // (셀렉트는 상단 topWeekSel가 처리 — syncWeekSelector)

  // ── 통계 패널 (BG와 동일 톤)
  var cs = contentStats('article_list');
  var stats4 = ['Pre-Review','In Progress','Corp. Review','Done'];

  // ── 국가별 VARIATION (국가별 완료율)
  var ART_COUNTRY_FULL = {
    'UK':'United Kingdom','DE':'Germany','FR':'France','IT':'Italy','ES':'Spain',
    'GR(50)':'Greece','TH':'Thailand','TW':'Taiwan','PH':'Philippines','VN':'Vietnam',
    'AU':'Australia','HK-en':'Hong Kong (en)','HK-zh':'Hong Kong (zh)','MY':'Malaysia',
    'SA':'Saudi Arabia (ar)','SA_en':'Saudi Arabia (en)','EG':'Egypt (ar)','EG_en':'Egypt (en)',
    'MX':'Mexico','CO':'Colombia','PE':'Peru','CL':'Chile','BR':'Brazil','SE':'Sweden',
    'CA_en':'Canada (en)','CA_fr':'Canada (fr)','ID':'Indonesia','IN':'India','ZA':'South Africa'
  };
  function cRows() {
    var rows = [];
    for (var ci=0; ci<countries.length; ci++) {
      var code = countries[ci];
      var pub=0, total=0;
      for (var ai=0; ai<allArts.length; ai++) {
        var st = allArts[ai].statuses[code];
        if (st && st!=='Cancel') { total++; if (st==='Done') pub++; }
      }
      if (total>0) rows.push({ name: ART_COUNTRY_FULL[code] || code, pub: pub, total: total });
    }
    return rows;
  }

  // ── DAM 아이콘
  function damIcon(url) {
    if (!url) return '<td style="text-align:center"><span style="color:#E2E8F0;font-size:10px">\u2014</span></td>';
    var safe = url.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    return '<td style="text-align:center"><button onclick="copyToClipboard(\'' + safe + '\')" title="DAM \uacbd\ub85c \ubcf5\uc0ac" style="border:none;background:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;color:#A50034;padding:2px">' +
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
    '</button></td>';
  }

  // ── 상태 셀 (BG 신호등 동그라미 동일)
  function cellHtml(s, url) {
    if (!s) return '<td style="text-align:center;background:#FAFAFB"><span style="font-size:9px;color:#E2E5EC">\uc9c4\ud589\uc548\ud568</span></td>';
    if (s==='Done') {
      var dot = '<span style="display:inline-block;width:13px;height:13px;border-radius:50%;background:#22C55E"></span>';
      if (url) return '<td style="text-align:center"><a href="'+url+'" target="_blank" rel="noopener" title="'+url+'" style="display:inline-flex;align-items:center;justify-content:center;cursor:pointer">'+dot+'</a></td>';
      return '<td style="text-align:center">'+dot+'</td>';
    }
    if (s==='Corp. Review') return '<td style="text-align:center"><span style="font-size:10px;font-weight:800;color:#F59E0B">\ubc95\uc778\ub9ac\ubdf0</span></td>';
    if (s==='Cancel')       return '<td style="text-align:center"><span style="font-size:10px;font-weight:800;color:#F59E0B">Cancel</span></td>';
    if (s==='In Progress')  return '<td style="text-align:center"><span style="font-size:10px;font-weight:700;color:#3B82F6">\uc791\uc5c5\uc911</span></td>';
    return '<td style="text-align:center"><span style="font-size:10px;color:#94A3B8">\uc0ac\uc804\uac80\ud1a0</span></td>';
  }

  // ── 제품 그룹 배지
  var PROD_CFG = {
    'REF':{bg:'#EFF6FF',tc:'#1E40AF'}, 'WM':{bg:'#F0FDF4',tc:'#166534'},
    'VC':{bg:'#FEF3C7',tc:'#92400E'}, 'Cooking':{bg:'#FCE7F3',tc:'#9D174D'},
    'DW':{bg:'#EDE9FE',tc:'#5B21B6'}, 'TV':{bg:'#E0F2FE',tc:'#075985'}
  };
  function prodBadge(p) {
    var c = PROD_CFG[p] || {bg:'#F1F5F9',tc:'#475569'};
    return '<span style="font-size:9px;font-weight:800;padding:2px 7px;border-radius:4px;background:'+c.bg+';color:'+c.tc+'">'+(p||'\u2014')+'</span>';
  }

  // ── 헤더
  var hdr = '<th style="position:sticky;left:0;background:#F8FAFC;z-index:2;white-space:nowrap">\uc81c\ud488</th>' +
    '<th style="white-space:nowrap">DAM</th>' +
    '<th style="text-align:left;min-width:220px;white-space:nowrap;padding-left:10px">Title</th>';
  for (var hc=0; hc<countries.length; hc++) {
    hdr += '<th style="white-space:nowrap;font-size:9px;padding:5px 6px">'+countries[hc]+'</th>';
  }
  hdr += '<th style="white-space:nowrap">hub\uc81c\uc791\uad6d\uac00</th><th style="white-space:nowrap">\uc9c4\ud589\uc0ac\ud56d</th><th style="white-space:nowrap">URL</th>';

  // ── 행
  var rows = [];
  for (var ri=0; ri<arts.length; ri++) {
    var a = arts[ri];
    var tds = '';
    for (var cc=0; cc<countries.length; cc++) {
      var code = countries[cc];
      tds += cellHtml(a.statuses[code], (a.urls && a.urls[code]) || '');
    }
    var hub = a.hub ? '<span style="font-size:10px;color:#475569">'+a.hub+'</span>' : '';
    var prog = a.progress ? '<span style="font-size:10px;color:#6B7280">'+a.progress+'</span>' : '';
    var urlCell = a.url ? '<a href="'+a.url+'" target="_blank" rel="noopener" title="'+a.url+'" style="color:#22C55E"><span style="display:inline-block;width:11px;height:11px;border-radius:50%;background:#22C55E"></span></a>' : '';
    rows.push('<tr>' +
      '<td style="position:sticky;left:0;background:#fff;z-index:1;text-align:center">'+prodBadge(a.product)+'</td>' +
      damIcon(a.dam) +
      '<td style="font-size:11px;color:#1A1D2E;font-weight:600;padding-left:10px;white-space:nowrap;max-width:260px;overflow:hidden;text-overflow:ellipsis" title="'+a.title.replace(/"/g,'&quot;')+'">'+a.title+'</td>' +
      tds +
      '<td style="text-align:center">'+hub+'</td>' +
      '<td style="text-align:center">'+prog+'</td>' +
      '<td style="text-align:center">'+urlCell+'</td>' +
    '</tr>');
  }

  // ── 패널 (VARIATION + 통계 카드 재사용은 생략, BG와 톤 맞춤)
  var panel = '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:14px">' +
    buildCountryVariation(cRows()) +
    buildArticleWeeklyChart() +
  '</div>';

  var tableHtml = '<div style="background:#fff;border:1px solid #E8EAF2;border-radius:14px;padding:16px 20px 8px">' +
    '<div style="margin-bottom:12px">' +
      '<div style="font-size:10px;font-weight:700;letter-spacing:.1em;color:#1A1D2E;text-transform:uppercase">Full Data Table</div>' +
      '<div style="font-size:14px;font-weight:700;color:#1A1D2E;margin-top:2px">\uc544\ud2f0\ud074 \u00d7 \uad6d\uac00 \ub9e4\ud2b8\ub9ad\uc2a4 ('+arts.length+'\uac1c \uc544\ud2f0\ud074)</div>' +
    '</div>' +
    buildNewBanner()+buildActionBanner() +
    '<div class="art-table-wrap" style="overflow-x:auto">' +
      '<table class="art-table">' +
        '<thead><tr>'+hdr+'</tr></thead>' +
        '<tbody>'+(rows.join('')||'<tr><td colspan="99" style="padding:30px;color:#9BA3BF;text-align:center">\uac80\uc0c9 \uacb0\uacfc\uac00 \uc5c6\uc2b5\ub2c8\ub2e4</td></tr>')+'</tbody>' +
      '</table>' +
    '</div>' +
  '</div>';

  area.innerHTML = panel + buildArticleActionSection() + buildFilterBarHtml() + buildTabBarHtml(arts.length) + tableHtml;
}

// ── Article 테이블 본부 액션 분석 (사전검토 아티클 안내)
function bgArticleInsight(arts, countries) {
  if (!arts || !arts.length) return '';
  var preTitles = [];
  for (var i=0;i<arts.length;i++){ if (arts[i].overall==='Pre-Review') preTitles.push(arts[i].title); }
  if (!preTitles.length) return '';
  var listTxt = preTitles.slice(0,8).join(', ') + (preTitles.length>8?(' 외 '+(preTitles.length-8)+'건'):'');
  return '<div style="background:#FEF6F0;border:1px solid #F59E0B33;border-left:3px solid #F59E0B;border-radius:8px;padding:11px 15px;margin-bottom:14px;font-size:11.5px;color:#92400E;line-height:1.6">' +
    warnIcon('#F59E0B') +
    '<b>본부 액션 필요</b> — 사전검토 상태 아티클 <b>' + preTitles.length + '건</b>은 법인 검토가 진행되지 않은 건으로, 본부에서 해당 법인에 검토·진행을 독려해야 합니다.<br>' +
    '<span style="display:inline-block;margin-top:5px;color:#7C4A12">대상: <b>' + listTxt + '</b></span>' +
  '</div>';
}

// ── Ice Solution 주차 선택 ──────────────────────────────────
function setIceWeek(w) {
  if (!ICE_WEEKS[w]) return;
  iceWeek = w;
  var d = ICE_WEEKS[w];
  DATA.ice_solution.items = d.items;
  DATA.ice_solution.stats = d.stats;
  DATA.ice_solution.dam = d.dam;
  renderContent();
}
(function initIceWeek(){
  var d = ICE_WEEKS[iceWeek];
  if (d) { DATA.ice_solution.items = d.items; DATA.ice_solution.stats = d.stats; DATA.ice_solution.dam = d.dam; }
})();

// ── Ice 국가별 VARIATION rows (국가 단위 집계) ──────────────
function iceCountryRows(items) {
  var map = {}, order = [];
  for (var i=0;i<items.length;i++){
    var it = items[i];
    var name = it.country || it.locale;
    if (!map[name]) { map[name] = {name:name, pub:0, total:0}; order.push(name); }
    if (it.status !== 'Cancel') {
      map[name].total++;
      if (it.status === 'Done') map[name].pub++;
    }
  }
  return order.map(function(n){ return map[n]; });
}

// ── Ice 주차별 진행 분석 ─────────────────────────────────
function iceWeeklyInsight() {
  var weeks = Object.keys(ICE_WEEKS).sort();
  if (weeks.length < 2) return null;
  var pcts = weeks.map(function(w){ var s=ICE_WEEKS[w].stats||{}; return s.Total>0?Math.round(s.Done/s.Total*100):0; });
  var last = weeks[weeks.length-1], ls = ICE_WEEKS[last].stats||{};
  var delta = pcts[pcts.length-1]-pcts[0];
  var pre=ls['Pre-Review']||0, wip=ls['In Progress']||0, corp=ls['Corp. Review']||0;
  var lastP=pcts[pcts.length-1];
  if (delta <= 0) return {level:'warn', msg:'<b>진행률 정체</b> — 최근 '+weeks.length+'주간('+weeks[0]+'~'+last+') 진행률이 '+lastP+'%로 변동이 없습니다. 사전검토 '+pre+'건 · 작업중 '+wip+'건 · 법인리뷰 '+corp+'건 — 진행 독려가 필요합니다.'};
  if (delta < 5)   return {level:'caution', msg:'<b>진행 더딤</b> — '+weeks[0]+'~'+last+' '+delta+'%p 증가에 그쳤습니다. 사전검토 '+pre+'건 잔여.'};
  var prev = weeks[weeks.length-2];
  var prevDone = (ICE_WEEKS[prev].stats||{}).Done||0;
  var doneDelta = (ls.Done||0) - prevDone;
  var prevPct = pcts[pcts.length-2];
  var ppDelta = lastP - prevPct;
  return {level:'ok', msg:'<b>진행 양호</b> — 전주차('+prev+') 대비 '+doneDelta+'건 진행되어 '+ppDelta+'%p 상승했습니다 (현재 '+lastP+'%). 잔여 사전검토 '+pre+'건.'};
}

// ── Ice 주차별 현황 차트 (BG와 동일 구조) ──────────────────
function buildIceWeeklyChart() {
  var weeks = Object.keys(ICE_WEEKS).sort();
  if (!weeks.length) return '';
  var series = [
    { key:'pre',  label:'사전검토', color:SC['Pre-Review'].dot },
    { key:'wip',  label:'작업중',   color:SC['In Progress'].dot },
    { key:'corp', label:'법인리뷰', color:SC['Corp. Review'].dot },
    { key:'done', label:'완료',     color:SC['Done'].dot }
  ];
  var wkData = weeks.map(function(wk){
    var s = ICE_WEEKS[wk].stats || {};
    return { wk:wk, pre:s['Pre-Review']||0, wip:s['In Progress']||0, corp:s['Corp. Review']||0, done:s.Done||0, total:s.Total||0 };
  });
  var maxV=0; wkData.forEach(function(d){ maxV=Math.max(maxV,d.total||0); });
  var yMax=maxV||2; var chartH=170;
  var grid='',yLabels='';
  for (var g=0;g<=4;g++){ var val=Math.round(yMax*g/4), bottom=(val/yMax)*chartH;
    grid+='<div style="position:absolute;left:0;right:0;bottom:'+bottom+'px;border-top:1px solid #F0F1F8"></div>';
    yLabels+='<div style="position:absolute;right:0;bottom:'+(bottom-6)+'px;font-size:9px;color:#9BA3BF;font-weight:600">'+val+'건</div>'; }
  var groups=wkData.map(function(d){
    var pct=d.total>0?Math.round(d.done/d.total*100):0;
    var bars=series.map(function(se){ var v=d[se.key]; var h=Math.max(Math.round((v/yMax)*chartH),v>0?2:0);
      return '<div data-wk="'+d.wk+'" data-pct="'+pct+'" data-label="'+se.label+'" data-val="'+v+'" data-color="'+se.color+'" onmouseenter="bgBarTip(event)" onmousemove="bgBarTip(event)" onmouseleave="bgBarTipHide()" onmouseover="this.style.opacity=0.75" onmouseout="this.style.opacity=1" style="width:11px;height:'+h+'px;background:'+se.color+';border-radius:3px 3px 0 0;cursor:pointer;transition:opacity .15s"></div>'; }).join('');
    return '<div style="flex:1;height:100%;display:flex;align-items:flex-end;justify-content:center;gap:3px">'+bars+'</div>'; }).join('');
  var weekLabels=wkData.map(function(d){ var active=(d.wk===iceWeek);
    return '<div onclick="setIceWeek(\'' + d.wk + '\')" style="flex:1;text-align:center;font-size:11px;font-weight:'+(active?'800':'600')+';color:'+(active?'#A50034':'#6B7280')+';cursor:pointer">'+d.wk+'</div>'; }).join('');
  var legend=series.map(function(se){ return '<span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:#6B7280"><span style="width:12px;height:12px;border-radius:3px;background:'+se.color+'"></span>'+se.label+'</span>'; }).join('');
  var ins=iceWeeklyInsight(); var banner='';
  if (ins){ var bc={warn:{bg:'#FEF6F0',bd:'#F59E0B',tc:'#92400E'},caution:{bg:'#FFFBEB',bd:'#FBBF24',tc:'#92400E'},ok:{bg:'#F0FDF4',bd:'#22C55E',tc:'#166534'}}[ins.level];
    banner='<div style="background:'+bc.bg+';border:1px solid '+bc.bd+'33;border-left:3px solid '+bc.bd+';border-radius:8px;padding:10px 14px;margin-top:14px;font-size:11.5px;color:'+bc.tc+';line-height:1.5;display:flex;align-items:flex-start">'+(ins.level==='ok'?okIcon(bc.bd):warnIcon(bc.bd))+'<span>'+ins.msg+'</span></div>'; }
  return '<div style="background:#fff;border:1px solid #E8EAF2;border-radius:14px;padding:16px 20px;flex:1;min-width:340px">'+
    '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px"><div><div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#1A1D2E;text-transform:uppercase">주차별 현황</div><div style="font-size:10px;color:#9BA3BF;font-weight:600">WEEKLY PROGRESS</div></div><span style="font-size:11px;font-weight:800;color:#fff;background:#A50034;padding:3px 10px;border-radius:6px">2026</span></div>'+
    '<div style="display:flex;gap:8px;margin-top:18px"><div style="position:relative;width:34px;height:'+chartH+'px;flex-shrink:0">'+yLabels+'</div><div style="position:relative;flex:1;height:'+chartH+'px">'+grid+'<div style="position:absolute;left:0;right:0;bottom:0;top:0;display:flex;align-items:flex-end">'+groups+'</div></div></div>'+
    '<div style="display:flex;gap:8px;margin-top:8px"><div style="width:34px;flex-shrink:0"></div><div style="flex:1;display:flex">'+weekLabels+'</div></div>'+
    '<div style="display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:18px;padding-top:12px;border-top:1px solid #F0F1F8">'+legend+'</div>'+banner+'</div>';
}

// ── Microsite 주차 선택 ─────────────────────────────────────
// ── WashTower 주차 선택 ─────────────────────────────────────
function setWashTowerWeek(w) {
  if (!WASHTOWER_WEEKS[w]) return;
  washtowerWeek = w;
  var d = WASHTOWER_WEEKS[w];
  DATA.washtower.items = d.items; DATA.washtower.stats = d.stats; DATA.washtower.dam = d.dam;
  renderContent();
}
(function initWashTowerWeek(){
  var d = WASHTOWER_WEEKS[washtowerWeek];
  if (d) { DATA.washtower.items = d.items; DATA.washtower.stats = d.stats; DATA.washtower.dam = d.dam; }
})();

function washtowerCountryRows(items) {
  var map={}, order=[];
  for (var i=0;i<items.length;i++){ var it=items[i]; var n=it.country||it.locale;
    if(!map[n]){map[n]={name:n,pub:0,total:0};order.push(n);}
    if(it.status!=='Cancel'){map[n].total++; if(it.status==='Done')map[n].pub++;}}
  return order.map(function(n){return map[n];});
}

function washtowerWeeklyInsight() {
  var weeks=Object.keys(WASHTOWER_WEEKS).sort(); if(weeks.length<2)return null;
  var pcts=weeks.map(function(w){var s=WASHTOWER_WEEKS[w].stats||{};return s.Total>0?Math.round(s.Done/s.Total*100):0;});
  var last=weeks[weeks.length-1],ls=WASHTOWER_WEEKS[last].stats||{};
  var delta=pcts[pcts.length-1]-pcts[0]; var pre=ls['Pre-Review']||0,wip=ls['In Progress']||0,corp=ls['Corp. Review']||0; var lastP=pcts[pcts.length-1];
  if(delta<=0)return{level:'warn',msg:'<b>진행률 정체</b> — 최근 '+weeks.length+'주간('+weeks[0]+'~'+last+') 진행률이 '+lastP+'%로 변동이 없습니다. 사전검토 '+pre+'건 · 작업중 '+wip+'건 · 법인리뷰 '+corp+'건 — 진행 독려가 필요합니다.'};
  if(delta<5){var prev=weeks[weeks.length-2];var pd=(ls.Done||0)-((WASHTOWER_WEEKS[prev].stats||{}).Done||0);return{level:'caution',msg:'<b>진행 더딤</b> — 전주차('+prev+') 대비 '+pd+'건 진행되어 '+(lastP-pcts[pcts.length-2])+'%p 상승에 그쳤습니다. 사전검토 '+pre+'건 잔여.'};}
  var prev=weeks[weeks.length-2];var pd=(ls.Done||0)-((WASHTOWER_WEEKS[prev].stats||{}).Done||0);
  return{level:'ok',msg:'<b>진행 양호</b> — 전주차('+prev+') 대비 '+pd+'건 진행되어 '+(lastP-pcts[pcts.length-2])+'%p 상승했습니다 (현재 '+lastP+'%). 잔여 사전검토 '+pre+'건.'};
}

function buildWashTowerWeeklyChart() {
  var weeks=Object.keys(WASHTOWER_WEEKS).sort(); if(!weeks.length)return '';
  var series=[{key:'pre',label:'사전검토',color:SC['Pre-Review'].dot},{key:'wip',label:'작업중',color:SC['In Progress'].dot},{key:'corp',label:'법인리뷰',color:SC['Corp. Review'].dot},{key:'done',label:'완료',color:SC['Done'].dot}];
  var wkData=weeks.map(function(wk){var s=WASHTOWER_WEEKS[wk].stats||{};return{wk:wk,pre:s['Pre-Review']||0,wip:s['In Progress']||0,corp:s['Corp. Review']||0,done:s.Done||0,total:s.Total||0};});
  var maxV=0;wkData.forEach(function(d){maxV=Math.max(maxV,d.total||0);});
  var yMax=maxV||2;var chartH=170;
  var grid='',yLabels='';
  for(var g=0;g<=4;g++){var val=Math.round(yMax*g/4),bottom=(val/yMax)*chartH;grid+='<div style="position:absolute;left:0;right:0;bottom:'+bottom+'px;border-top:1px solid #F0F1F8"></div>';yLabels+='<div style="position:absolute;right:0;bottom:'+(bottom-6)+'px;font-size:9px;color:#9BA3BF;font-weight:600">'+val+'건</div>';}
  var groups=wkData.map(function(d){var pct=d.total>0?Math.round(d.done/d.total*100):0;var bars=series.map(function(se){var v=d[se.key];var h=Math.max(Math.round((v/yMax)*chartH),v>0?2:0);return '<div data-wk="'+d.wk+'" data-pct="'+pct+'" data-label="'+se.label+'" data-val="'+v+'" data-color="'+se.color+'" onmouseenter="bgBarTip(event)" onmousemove="bgBarTip(event)" onmouseleave="bgBarTipHide()" onmouseover="this.style.opacity=0.75" onmouseout="this.style.opacity=1" style="width:11px;height:'+h+'px;background:'+se.color+';border-radius:3px 3px 0 0;cursor:pointer;transition:opacity .15s"></div>';}).join('');return '<div style="flex:1;height:100%;display:flex;align-items:flex-end;justify-content:center;gap:3px">'+bars+'</div>';}).join('');
  var weekLabels=wkData.map(function(d){var active=(d.wk===washtowerWeek);return '<div onclick="setWashTowerWeek(\'' + d.wk + '\')" style="flex:1;text-align:center;font-size:11px;font-weight:'+(active?'800':'600')+';color:'+(active?'#A50034':'#6B7280')+';cursor:pointer">'+d.wk+'</div>';}).join('');
  var legend=series.map(function(se){return '<span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:#6B7280"><span style="width:12px;height:12px;border-radius:3px;background:'+se.color+'"></span>'+se.label+'</span>';}).join('');
  var ins=washtowerWeeklyInsight();var banner='';
  if(ins){var bc={warn:{bg:'#FEF6F0',bd:'#F59E0B',tc:'#92400E'},caution:{bg:'#FFFBEB',bd:'#FBBF24',tc:'#92400E'},ok:{bg:'#F0FDF4',bd:'#22C55E',tc:'#166534'}}[ins.level];banner='<div style="background:'+bc.bg+';border:1px solid '+bc.bd+'33;border-left:3px solid '+bc.bd+';border-radius:8px;padding:10px 14px;margin-top:14px;font-size:11.5px;color:'+bc.tc+';line-height:1.5;display:flex;align-items:flex-start">'+(ins.level==='ok'?okIcon(bc.bd):warnIcon(bc.bd))+'<span>'+ins.msg+'</span></div>';}
  return '<div style="background:#fff;border:1px solid #E8EAF2;border-radius:14px;padding:16px 20px;flex:1;min-width:340px"><div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px"><div><div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#1A1D2E;text-transform:uppercase">주차별 현황</div><div style="font-size:10px;color:#9BA3BF;font-weight:600">WEEKLY PROGRESS</div></div><span style="font-size:11px;font-weight:800;color:#fff;background:#A50034;padding:3px 10px;border-radius:6px">2026</span></div><div style="display:flex;gap:8px;margin-top:18px"><div style="position:relative;width:34px;height:'+chartH+'px;flex-shrink:0">'+yLabels+'</div><div style="position:relative;flex:1;height:'+chartH+'px">'+grid+'<div style="position:absolute;left:0;right:0;bottom:0;top:0;display:flex;align-items:flex-end">'+groups+'</div></div></div><div style="display:flex;gap:8px;margin-top:8px"><div style="width:34px;flex-shrink:0"></div><div style="flex:1;display:flex">'+weekLabels+'</div></div><div style="display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:18px;padding-top:12px;border-top:1px solid #F0F1F8">'+legend+'</div>'+banner+'</div>';
}

function renderWashTower(area) {
  var d = DATA.washtower;
  var allItems = d.items || [];
  var items = allItems.slice();
  if (currentTab !== 'all') items = items.filter(function(x){ return x.status === currentTab; });
  if (filterRegion) items = items.filter(function(x){ return (x.region||'').toUpperCase() === filterRegion.toUpperCase(); });

  var panel = '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:14px">' + buildCountryVariation(washtowerCountryRows(allItems)) + buildWashTowerWeeklyChart() + '</div>';

  var hdrRow = '<th style="vertical-align:middle;white-space:nowrap;width:130px">Region</th>' +
    '<th style="vertical-align:middle;white-space:nowrap;width:200px;text-align:left;padding-left:10px">Country</th>' +
    '<th style="vertical-align:middle;width:100px;text-align:center">Status</th>' +
    '<th style="vertical-align:middle;width:auto"></th>' +
    '<th style="vertical-align:middle;width:110px">Date</th>' + damHeadTh();

  var REGION_ORDER2 = ['EU','ASIA','MEA','LATAM'];
  var groups2 = {}; var ord2 = [];
  for (var i=0;i<items.length;i++){ var rg=(items[i].region||'Other').toUpperCase(); if(!groups2[rg]){groups2[rg]=[];ord2.push(rg);} groups2[rg].push(items[i]); }
  var sorted2=[]; for(var ro=0;ro<REGION_ORDER2.length;ro++){ if(groups2[REGION_ORDER2[ro]])sorted2.push(REGION_ORDER2[ro]); }
  for(var ro2=0;ro2<ord2.length;ro2++){ if(sorted2.indexOf(ord2[ro2])===-1)sorted2.push(ord2[ro2]); }

  var rows=[];
  for (var sri=0;sri<sorted2.length;sri++){
    var region=sorted2[sri]; var ritems=groups2[region]; if(!ritems||!ritems.length)continue;
    var rcfg=REGION_CFG[region]||{label:region,bg:'#F5F6FA',tc:'#6B7280',border:'#E0E4F0'};
    for (var ii=0;ii<ritems.length;ii++){
      var item=ritems[ii];
      var statusCell;
      if (item.status==='Done'){ var dot='<span style="display:inline-block;width:13px;height:13px;border-radius:50%;background:#22C55E"></span>'; statusCell=item.url?'<a href="'+item.url+'" target="_blank" rel="noopener" title="'+item.url+'" style="display:inline-flex;align-items:center;justify-content:center;cursor:pointer">'+dot+'</a>':dot; }
      else if (item.status==='Corp. Review') statusCell='<span style="font-size:10px;font-weight:800;color:#F59E0B">법인리뷰</span>';
      else if (item.status==='Cancel') statusCell='<span style="font-size:10px;font-weight:800;color:#F59E0B">Cancel</span>';
      else if (item.status==='In Progress') statusCell='<span style="font-size:10px;font-weight:700;color:#3B82F6">작업중</span>';
      else statusCell='<span style="font-size:10px;color:#94A3B8">사전검토</span>';
      var dateCell=item.date?'<span style="font-size:10px;color:#1A1D2E;font-weight:600">'+item.date+'</span>':'';
      var regionCell='';
      if(ii===0) regionCell='<td rowspan="'+ritems.length+'" style="width:130px;text-align:center;font-size:10px;font-weight:800;background:'+rcfg.bg+';color:'+rcfg.tc+';border-right:2px solid '+rcfg.border+';vertical-align:middle;white-space:nowrap">'+rcfg.label+'</td>';
      rows.push('<tr>'+regionCell+
        '<td style="font-weight:600;color:#1A1D2E;font-size:11px;white-space:nowrap;width:200px;padding-left:10px">'+(item.country||item.locale)+'</td>'+
        '<td style="text-align:center;width:100px">'+statusCell+'</td>'+
        '<td style="width:auto"></td>'+
        '<td style="text-align:center;width:110px">'+dateCell+'</td>'+
      damCellTd() + '</tr>');
    }
  }

  var tableHtml='<div style="background:#fff;border:1px solid #E8EAF2;border-radius:14px;padding:16px 20px 8px">'+
    '<div style="margin-bottom:12px"><div style="font-size:10px;font-weight:700;letter-spacing:.1em;color:#1A1D2E;text-transform:uppercase">Full Data Table</div><div style="font-size:14px;font-weight:700;color:#1A1D2E;margin-top:2px">국가별 현황 ('+items.length+'개 로케일)</div></div>'+
    buildNewBanner()+buildActionBanner()+
    '<div class="art-table-wrap" style="overflow-x:auto"><table class="art-table"><thead><tr>'+hdrRow+'</tr></thead><tbody>'+(rows.join('')||'<tr><td colspan="99" style="padding:30px;color:#9BA3BF;text-align:center">검색 결과가 없습니다</td></tr>')+'</tbody></table></div>'+
  '</div>';

  area.innerHTML = panel + buildFilterBarHtml() + buildTabBarHtml(items.length) + tableHtml;
}

function setMicrositeWeek(w) {
  if (!MICROSITE_WEEKS[w]) return;
  micrositeWeek = w;
  var d = MICROSITE_WEEKS[w];
  DATA.microsite.items = d.items; DATA.microsite.stats = d.stats; DATA.microsite.dam = d.dam;
  renderContent();
}
(function initMicrositeWeek(){
  var d = MICROSITE_WEEKS[micrositeWeek];
  if (d) { DATA.microsite.items = d.items; DATA.microsite.stats = d.stats; DATA.microsite.dam = d.dam; }
})();

function micrositeCountryRows(items) {
  var map={}, order=[];
  for (var i=0;i<items.length;i++){ var it=items[i]; var n=it.country||it.locale;
    if(!map[n]){map[n]={name:n,pub:0,total:0};order.push(n);}
    if(it.status!=='Cancel'){map[n].total++; if(it.status==='Done')map[n].pub++;}}
  return order.map(function(n){return map[n];});
}

function micrositeWeeklyInsight() {
  var weeks=Object.keys(MICROSITE_WEEKS).sort(); if(weeks.length<2)return null;
  var pcts=weeks.map(function(w){var s=MICROSITE_WEEKS[w].stats||{};return s.Total>0?Math.round(s.Done/s.Total*100):0;});
  var last=weeks[weeks.length-1],ls=MICROSITE_WEEKS[last].stats||{};
  var delta=pcts[pcts.length-1]-pcts[0]; var pre=ls['Pre-Review']||0,wip=ls['In Progress']||0,corp=ls['Corp. Review']||0; var lastP=pcts[pcts.length-1];
  if(delta<=0)return{level:'warn',msg:'<b>진행률 정체</b> — 최근 '+weeks.length+'주간('+weeks[0]+'~'+last+') 진행률이 '+lastP+'%로 변동이 없습니다. 사전검토 '+pre+'건 · 작업중 '+wip+'건 · 법인리뷰 '+corp+'건 — 진행 독려가 필요합니다.'};
  if(delta<5){var prev=weeks[weeks.length-2];var pd=(ls.Done||0)-((MICROSITE_WEEKS[prev].stats||{}).Done||0);return{level:'caution',msg:'<b>진행 더딤</b> — 전주차('+prev+') 대비 '+pd+'건 진행되어 '+(lastP-pcts[pcts.length-2])+'%p 상승에 그쳤습니다. 사전검토 '+pre+'건 잔여.'};}
  var prev=weeks[weeks.length-2];var pd=(ls.Done||0)-((MICROSITE_WEEKS[prev].stats||{}).Done||0);
  return{level:'ok',msg:'<b>진행 양호</b> — 전주차('+prev+') 대비 '+pd+'건 진행되어 '+(lastP-pcts[pcts.length-2])+'%p 상승했습니다 (현재 '+lastP+'%). 잔여 사전검토 '+pre+'건.'};
}

function buildMicrositeWeeklyChart() {
  var weeks=Object.keys(MICROSITE_WEEKS).sort(); if(!weeks.length)return '';
  var series=[{key:'pre',label:'사전검토',color:SC['Pre-Review'].dot},{key:'wip',label:'작업중',color:SC['In Progress'].dot},{key:'corp',label:'법인리뷰',color:SC['Corp. Review'].dot},{key:'done',label:'완료',color:SC['Done'].dot}];
  var wkData=weeks.map(function(wk){var s=MICROSITE_WEEKS[wk].stats||{};return{wk:wk,pre:s['Pre-Review']||0,wip:s['In Progress']||0,corp:s['Corp. Review']||0,done:s.Done||0,total:s.Total||0};});
  var maxV=0;wkData.forEach(function(d){maxV=Math.max(maxV,d.total||0);});
  var yMax=maxV||2;var chartH=170;
  var grid='',yLabels='';
  for(var g=0;g<=4;g++){var val=Math.round(yMax*g/4),bottom=(val/yMax)*chartH;grid+='<div style="position:absolute;left:0;right:0;bottom:'+bottom+'px;border-top:1px solid #F0F1F8"></div>';yLabels+='<div style="position:absolute;right:0;bottom:'+(bottom-6)+'px;font-size:9px;color:#9BA3BF;font-weight:600">'+val+'건</div>';}
  var groups=wkData.map(function(d){var pct=d.total>0?Math.round(d.done/d.total*100):0;var bars=series.map(function(se){var v=d[se.key];var h=Math.max(Math.round((v/yMax)*chartH),v>0?2:0);return '<div data-wk="'+d.wk+'" data-pct="'+pct+'" data-label="'+se.label+'" data-val="'+v+'" data-color="'+se.color+'" onmouseenter="bgBarTip(event)" onmousemove="bgBarTip(event)" onmouseleave="bgBarTipHide()" onmouseover="this.style.opacity=0.75" onmouseout="this.style.opacity=1" style="width:11px;height:'+h+'px;background:'+se.color+';border-radius:3px 3px 0 0;cursor:pointer;transition:opacity .15s"></div>';}).join('');return '<div style="flex:1;height:100%;display:flex;align-items:flex-end;justify-content:center;gap:3px">'+bars+'</div>';}).join('');
  var weekLabels=wkData.map(function(d){var active=(d.wk===micrositeWeek);return '<div onclick="setMicrositeWeek(\'' + d.wk + '\')" style="flex:1;text-align:center;font-size:11px;font-weight:'+(active?'800':'600')+';color:'+(active?'#A50034':'#6B7280')+';cursor:pointer">'+d.wk+'</div>';}).join('');
  var legend=series.map(function(se){return '<span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:#6B7280"><span style="width:12px;height:12px;border-radius:3px;background:'+se.color+'"></span>'+se.label+'</span>';}).join('');
  var ins=micrositeWeeklyInsight();var banner='';
  if(ins){var bc={warn:{bg:'#FEF6F0',bd:'#F59E0B',tc:'#92400E'},caution:{bg:'#FFFBEB',bd:'#FBBF24',tc:'#92400E'},ok:{bg:'#F0FDF4',bd:'#22C55E',tc:'#166534'}}[ins.level];banner='<div style="background:'+bc.bg+';border:1px solid '+bc.bd+'33;border-left:3px solid '+bc.bd+';border-radius:8px;padding:10px 14px;margin-top:14px;font-size:11.5px;color:'+bc.tc+';line-height:1.5;display:flex;align-items:flex-start">'+(ins.level==='ok'?okIcon(bc.bd):warnIcon(bc.bd))+'<span>'+ins.msg+'</span></div>';}
  return '<div style="background:#fff;border:1px solid #E8EAF2;border-radius:14px;padding:16px 20px;flex:1;min-width:340px"><div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px"><div><div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#1A1D2E;text-transform:uppercase">주차별 현황</div><div style="font-size:10px;color:#9BA3BF;font-weight:600">WEEKLY PROGRESS</div></div><span style="font-size:11px;font-weight:800;color:#fff;background:#A50034;padding:3px 10px;border-radius:6px">2026</span></div><div style="display:flex;gap:8px;margin-top:18px"><div style="position:relative;width:34px;height:'+chartH+'px;flex-shrink:0">'+yLabels+'</div><div style="position:relative;flex:1;height:'+chartH+'px">'+grid+'<div style="position:absolute;left:0;right:0;bottom:0;top:0;display:flex;align-items:flex-end">'+groups+'</div></div></div><div style="display:flex;gap:8px;margin-top:8px"><div style="width:34px;flex-shrink:0"></div><div style="flex:1;display:flex">'+weekLabels+'</div></div><div style="display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:18px;padding-top:12px;border-top:1px solid #F0F1F8">'+legend+'</div>'+banner+'</div>';
}

function renderMicrosite(area) {
  var d = DATA.microsite;
  var allItems = d.items || [];
  var items = allItems.slice();
  if (currentTab !== 'all') items = items.filter(function(x){ return x.status === currentTab; });
  if (filterRegion) items = items.filter(function(x){ return (x.region||'').toUpperCase() === filterRegion.toUpperCase(); });

  var panel = '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:14px">' + buildCountryVariation(micrositeCountryRows(allItems)) + buildMicrositeWeeklyChart() + '</div>';

  var hdrRow = '<th style="vertical-align:middle;white-space:nowrap;width:130px">Region</th>' +
    '<th style="vertical-align:middle;white-space:nowrap;width:200px;text-align:left;padding-left:10px">Country</th>' +
    '<th style="vertical-align:middle;width:100px;text-align:center">Status</th>' +
    '<th style="vertical-align:middle;width:auto"></th>' +
    '<th style="vertical-align:middle;width:110px">Date</th>' +
    '<th style="vertical-align:middle;text-align:center;width:100px">Remark</th>' + damHeadTh();

  var REGION_ORDER2 = ['EU','ASIA','MEA','LATAM'];
  var groups2 = {}; var ord2 = [];
  for (var i=0;i<items.length;i++){ var rg=(items[i].region||'Other').toUpperCase(); if(!groups2[rg]){groups2[rg]=[];ord2.push(rg);} groups2[rg].push(items[i]); }
  var sorted2=[]; for(var ro=0;ro<REGION_ORDER2.length;ro++){ if(groups2[REGION_ORDER2[ro]])sorted2.push(REGION_ORDER2[ro]); }
  for(var ro2=0;ro2<ord2.length;ro2++){ if(sorted2.indexOf(ord2[ro2])===-1)sorted2.push(ord2[ro2]); }

  var rows=[];
  for (var sri=0;sri<sorted2.length;sri++){
    var region=sorted2[sri]; var ritems=groups2[region]; if(!ritems||!ritems.length)continue;
    var rcfg=REGION_CFG[region]||{label:region,bg:'#F5F6FA',tc:'#6B7280',border:'#E0E4F0'};
    for (var ii=0;ii<ritems.length;ii++){
      var item=ritems[ii];
      var statusCell;
      if (item.status==='Done'){ var dot='<span style="display:inline-block;width:13px;height:13px;border-radius:50%;background:#22C55E"></span>'; statusCell=item.url?'<a href="'+item.url+'" target="_blank" rel="noopener" title="'+item.url+'" style="display:inline-flex;align-items:center;justify-content:center;cursor:pointer">'+dot+'</a>':dot; }
      else if (item.status==='Corp. Review') statusCell='<span style="font-size:10px;font-weight:800;color:#F59E0B">법인리뷰</span>';
      else if (item.status==='Cancel') statusCell='<span style="font-size:10px;font-weight:800;color:#F59E0B">Cancel</span>';
      else if (item.status==='In Progress') statusCell='<span style="font-size:10px;font-weight:700;color:#3B82F6">작업중</span>';
      else statusCell='<span style="font-size:10px;color:#94A3B8">사전검토</span>';
      var dateCell=item.date?'<span style="font-size:10px;color:#1A1D2E;font-weight:600">'+item.date+'</span>':'';
      var remarkCell=item.remark?'<span style="font-size:10px;color:#6B7280">'+item.remark+'</span>':'';
      var regionCell='';
      if(ii===0) regionCell='<td rowspan="'+ritems.length+'" style="width:130px;text-align:center;font-size:10px;font-weight:800;background:'+rcfg.bg+';color:'+rcfg.tc+';border-right:2px solid '+rcfg.border+';vertical-align:middle;white-space:nowrap">'+rcfg.label+'</td>';
      rows.push('<tr>'+regionCell+
        '<td style="font-weight:600;color:#1A1D2E;font-size:11px;white-space:nowrap;width:200px;padding-left:10px">'+(item.country||item.locale)+'</td>'+
        '<td style="text-align:center;width:100px">'+statusCell+'</td>'+
        '<td style="width:auto"></td>'+
        '<td style="text-align:center;width:110px">'+dateCell+'</td>'+
        '<td style="text-align:center;width:100px">'+remarkCell+'</td>'+
      damCellTd() + '</tr>');
    }
  }

  var tableHtml='<div style="background:#fff;border:1px solid #E8EAF2;border-radius:14px;padding:16px 20px 8px">'+
    '<div style="margin-bottom:12px"><div style="font-size:10px;font-weight:700;letter-spacing:.1em;color:#1A1D2E;text-transform:uppercase">Full Data Table</div><div style="font-size:14px;font-weight:700;color:#1A1D2E;margin-top:2px">국가별 현황 ('+items.length+'개 로케일)</div></div>'+
    buildNewBanner()+buildActionBanner()+
    '<div class="art-table-wrap" style="overflow-x:auto"><table class="art-table"><thead><tr>'+hdrRow+'</tr></thead><tbody>'+(rows.join('')||'<tr><td colspan="99" style="padding:30px;color:#9BA3BF;text-align:center">검색 결과가 없습니다</td></tr>')+'</tbody></table></div>'+
  '</div>';

  area.innerHTML = panel + buildFilterBarHtml() + buildTabBarHtml(items.length) + tableHtml;
}

function renderIceSolution(area) {
  var d = DATA.ice_solution;
  var allItems = d.items || [];

  // 리전 필터
  var items = allItems.slice();
  if (currentTab !== 'all') items = items.filter(function(x) { return x.status === currentTab; });
  if (filterRegion) {
    items = items.filter(function(x) {
      var lm = LOCALE_MAP[x.locale] || {};
      var rgn = (lm.region || x.region || '').toUpperCase();
      return rgn === filterRegion.toUpperCase();
    });
  }

  if (!items.length) {
    area.innerHTML = buildFilterBarHtml() + buildTabBarHtml(0) + emptyHtml();
    return;
  }

  // 헤더
  var hdrRow = '<th style="vertical-align:middle;white-space:nowrap;width:130px">Region</th>' +
    '<th style="vertical-align:middle;white-space:nowrap;width:200px;text-align:left;padding-left:10px">Country</th>' +
    '<th style="vertical-align:middle;width:100px;text-align:center">Status</th>' +
    '<th style="vertical-align:middle"></th>' +
    '<th style="vertical-align:middle;width:110px">Date</th>' +
    damHeadTh();

  // 리전별 그룹핑
  var regionGroups = {};
  var regionOrderLocal = [];
  for (var i = 0; i < items.length; i++) {
    var itm = items[i];
    var lm = LOCALE_MAP[itm.locale] || {};
    var rgn = (lm.region || itm.region || 'Other').toUpperCase();
    if (rgn === 'ASIA') rgn = 'ASIA'; // normalize
    if (!regionGroups[rgn]) { regionGroups[rgn] = []; regionOrderLocal.push(rgn); }
    regionGroups[rgn].push(itm);
  }

  var sortedRegions = [];
  for (var ro = 0; ro < REGION_ORDER.length; ro++) {
    if (regionGroups[REGION_ORDER[ro]]) sortedRegions.push(REGION_ORDER[ro]);
  }
  for (var ro2 = 0; ro2 < regionOrderLocal.length; ro2++) {
    if (sortedRegions.indexOf(regionOrderLocal[ro2]) === -1) sortedRegions.push(regionOrderLocal[ro2]);
  }

  // 데이터 행
  var rows = [];
  for (var sri = 0; sri < sortedRegions.length; sri++) {
    var region = sortedRegions[sri];
    var regionItems = regionGroups[region];
    if (!regionItems || !regionItems.length) continue;
    var rcfg = REGION_CFG[region] || { label: region, bg: '#F5F6FA', tc: '#6B7280', border: '#E0E4F0' };

    for (var ii = 0; ii < regionItems.length; ii++) {
      var item = regionItems[ii];
      var lmm = LOCALE_MAP[item.locale] || {};
      var countryName = lmm.country || item.country || item.locale;
      var cfg = SC[item.status] || SC['Pre-Review'];

      var statusCell;
      if (item.status === 'Done') {
        var dot = '<span style="display:inline-block;width:13px;height:13px;border-radius:50%;background:#22C55E"></span>';
        statusCell = item.url
          ? '<a href="' + item.url + '" target="_blank" rel="noopener" title="' + item.url + '" style="display:inline-flex;align-items:center;justify-content:center;cursor:pointer">' + dot + '</a>'
          : dot;
      } else if (item.status === 'Corp. Review') {
        statusCell = '<span style="font-size:10px;font-weight:800;color:#F59E0B">\ubc95\uc778\ub9ac\ubdf0</span>';
      } else if (item.status === 'Cancel') {
        statusCell = '<span style="font-size:10px;font-weight:800;color:#F59E0B">Cancel</span>';
      } else if (item.status === 'In Progress') {
        statusCell = '<span style="font-size:10px;font-weight:700;color:#3B82F6">\uc791\uc5c5\uc911</span>';
      } else {
        statusCell = '<span style="font-size:10px;color:#94A3B8">\uc0ac\uc804\uac80\ud1a0</span>';
      }

      var dateCell = item.date
        ? '<span style="font-size:10px;color:#1A1D2E;font-weight:600">' + item.date + '</span>'
        : '';

      var regionCell = '';
      if (ii === 0) {
        regionCell = '<td rowspan="' + regionItems.length + '" style="width:130px;text-align:center;font-size:10px;font-weight:800;background:' + rcfg.bg + ';color:' + rcfg.tc + ';border-right:2px solid ' + rcfg.border + ';vertical-align:middle;white-space:nowrap">' + rcfg.label + '</td>';
      }

      rows.push('<tr>' +
        regionCell +
        '<td style="font-weight:600;color:#1A1D2E;font-size:11px;white-space:nowrap;width:200px;padding-left:10px">' + countryName + '</td>' +
        '<td style="text-align:center;width:100px">' + statusCell + '</td>' +
        '<td></td>' +
        '<td style="text-align:center;width:110px">' + dateCell + '</td>' +
      damCellTd() + '</tr>');
    }
  }

  var tableHtml = '<div style="background:#fff;border:1px solid #E8EAF2;border-radius:14px;padding:16px 20px 8px">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px">' +
      '<div>' +
        '<div style="font-size:10px;font-weight:700;letter-spacing:.1em;color:#1A1D2E;text-transform:uppercase">Full Data Table</div>' +
        '<div style="font-size:14px;font-weight:700;color:#1A1D2E;margin-top:2px">' + getDashboardDisplayTitle(d) + ' (' + items.length + '\uac1c \uad6d\uac00)</div>' +
      '</div>' +
    '</div>' +
    buildNewBanner()+buildActionBanner() +
    '<div class="art-table-wrap">' +
      '<table class="art-table">' +
        '<thead><tr>' + hdrRow + '</tr></thead>' +
        '<tbody>' + (rows.join('') || '<tr><td colspan="6" style="padding:30px;color:#9BA3BF;text-align:center">\uac80\uc0c9 \uacb0\uacfc\uac00 \uc5c6\uc2b5\ub2c8\ub2e4</td></tr>') + '</tbody>' +
      '</table>' +
    '</div>' +
  '</div>';

  var icePanels = '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:14px">' + buildCountryVariation(iceCountryRows(allItems)) + buildIceWeeklyChart() + '</div>';
  area.innerHTML = icePanels + buildFilterBarHtml() + buildTabBarHtml(items.length) + tableHtml;
}



// ── ALT TEXT SCHEMA ──────────────────────────────────────────
// ── AltText 주차 선택 ─────────────────────────────────────
function setAltTextWeek(w) {
  if (!ALTTEXT_WEEKS[w]) return;
  alttextWeek = w;
  var d = ALTTEXT_WEEKS[w];
  DATA.alttext.items = d.items; DATA.alttext.stats = d.stats; DATA.alttext.dam = d.dam;
  renderContent();
}
(function initAltTextWeek(){
  var d = ALTTEXT_WEEKS[alttextWeek];
  if (d) { DATA.alttext.items = d.items; DATA.alttext.stats = d.stats; DATA.alttext.dam = d.dam; }
})();

function alttextCountryRows(items) {
  var map={}, order=[];
  for (var i=0;i<items.length;i++){ var it=items[i]; var n=it.country||it.locale; var pg=parseInt(it.pages)||0;
    if(!map[n]){map[n]={name:n,pub:0,total:0};order.push(n);}
    if(it.status!=='Cancel'){map[n].total+=pg; if(it.status==='Done')map[n].pub+=pg;}}
  return order.map(function(n){return map[n];});
}

function alttextWeeklyInsight() {
  var weeks=Object.keys(ALTTEXT_WEEKS).sort(); if(weeks.length<2)return null;
  var pcts=weeks.map(function(w){var s=ALTTEXT_WEEKS[w].stats||{};return s.Total>0?Math.round(s.Done/s.Total*100):0;});
  var last=weeks[weeks.length-1],ls=ALTTEXT_WEEKS[last].stats||{};
  var delta=pcts[pcts.length-1]-pcts[0]; var pre=ls['Pre-Review']||0,wip=ls['In Progress']||0,corp=ls['Corp. Review']||0; var lastP=pcts[pcts.length-1];
  if(delta<=0)return{level:'warn',msg:'<b>진행률 정체</b> — 최근 '+weeks.length+'주간('+weeks[0]+'~'+last+') 진행률이 '+lastP+'%로 변동이 없습니다. 사전검토 '+pre+'건 · 작업중 '+wip+'건 · 법인리뷰 '+corp+'건 — 진행 독려가 필요합니다.'};
  if(delta<5){var prev=weeks[weeks.length-2];var pd=(ls.Done||0)-((ALTTEXT_WEEKS[prev].stats||{}).Done||0);return{level:'caution',msg:'<b>진행 더딤</b> — 전주차('+prev+') 대비 '+pd+'건 진행되어 '+(lastP-pcts[pcts.length-2])+'%p 상승에 그쳤습니다. 사전검토 '+pre+'건 잔여.'};}
  var prev=weeks[weeks.length-2];var pd=(ls.Done||0)-((ALTTEXT_WEEKS[prev].stats||{}).Done||0);
  return{level:'ok',msg:'<b>진행 양호</b> — 전주차('+prev+') 대비 '+pd+'건 진행되어 '+(lastP-pcts[pcts.length-2])+'%p 상승했습니다 (현재 '+lastP+'%). 잔여 사전검토 '+pre+'건.'};
}

function buildAltTextWeeklyChart() {
  var weeks=Object.keys(ALTTEXT_WEEKS).sort(); if(!weeks.length)return '';
  var series=[{key:'pre',label:'사전검토',color:SC['Pre-Review'].dot},{key:'wip',label:'작업중',color:SC['In Progress'].dot},{key:'corp',label:'법인리뷰',color:SC['Corp. Review'].dot},{key:'done',label:'완료',color:SC['Done'].dot}];
  var wkData=weeks.map(function(wk){var s=ALTTEXT_WEEKS[wk].stats||{};return{wk:wk,pre:s['Pre-Review']||0,wip:s['In Progress']||0,corp:s['Corp. Review']||0,done:s.Done||0,total:s.Total||0};});
  var maxV=0;wkData.forEach(function(d){maxV=Math.max(maxV,d.total||0);});
  var yMax=maxV||2;var chartH=170;
  var grid='',yLabels='';
  for(var g=0;g<=4;g++){var val=Math.round(yMax*g/4),bottom=(val/yMax)*chartH;grid+='<div style="position:absolute;left:0;right:0;bottom:'+bottom+'px;border-top:1px solid #F0F1F8"></div>';yLabels+='<div style="position:absolute;right:0;bottom:'+(bottom-6)+'px;font-size:9px;color:#9BA3BF;font-weight:600">'+val+'건</div>';}
  var groups=wkData.map(function(d){var pct=d.total>0?Math.round(d.done/d.total*100):0;var bars=series.map(function(se){var v=d[se.key];var h=Math.max(Math.round((v/yMax)*chartH),v>0?2:0);return '<div data-wk="'+d.wk+'" data-pct="'+pct+'" data-label="'+se.label+'" data-val="'+v+'" data-color="'+se.color+'" onmouseenter="bgBarTip(event)" onmousemove="bgBarTip(event)" onmouseleave="bgBarTipHide()" onmouseover="this.style.opacity=0.75" onmouseout="this.style.opacity=1" style="width:11px;height:'+h+'px;background:'+se.color+';border-radius:3px 3px 0 0;cursor:pointer;transition:opacity .15s"></div>';}).join('');return '<div style="flex:1;height:100%;display:flex;align-items:flex-end;justify-content:center;gap:3px">'+bars+'</div>';}).join('');
  var weekLabels=wkData.map(function(d){var active=(d.wk===alttextWeek);return '<div onclick="setAltTextWeek(\'' + d.wk + '\')" style="flex:1;text-align:center;font-size:11px;font-weight:'+(active?'800':'600')+';color:'+(active?'#A50034':'#6B7280')+';cursor:pointer">'+d.wk+'</div>';}).join('');
  var legend=series.map(function(se){return '<span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:#6B7280"><span style="width:12px;height:12px;border-radius:3px;background:'+se.color+'"></span>'+se.label+'</span>';}).join('');
  var ins=alttextWeeklyInsight();var banner='';
  if(ins){var bc={warn:{bg:'#FEF6F0',bd:'#F59E0B',tc:'#92400E'},caution:{bg:'#FFFBEB',bd:'#FBBF24',tc:'#92400E'},ok:{bg:'#F0FDF4',bd:'#22C55E',tc:'#166534'}}[ins.level];banner='<div style="background:'+bc.bg+';border:1px solid '+bc.bd+'33;border-left:3px solid '+bc.bd+';border-radius:8px;padding:10px 14px;margin-top:14px;font-size:11.5px;color:'+bc.tc+';line-height:1.5;display:flex;align-items:flex-start">'+(ins.level==='ok'?okIcon(bc.bd):warnIcon(bc.bd))+'<span>'+ins.msg+'</span></div>';}
  return '<div style="background:#fff;border:1px solid #E8EAF2;border-radius:14px;padding:16px 20px;flex:1;min-width:340px"><div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px"><div><div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#1A1D2E;text-transform:uppercase">주차별 현황</div><div style="font-size:10px;color:#9BA3BF;font-weight:600">WEEKLY PROGRESS</div></div><span style="font-size:11px;font-weight:800;color:#fff;background:#A50034;padding:3px 10px;border-radius:6px">2026</span></div><div style="display:flex;gap:8px;margin-top:18px"><div style="position:relative;width:34px;height:'+chartH+'px;flex-shrink:0">'+yLabels+'</div><div style="position:relative;flex:1;height:'+chartH+'px">'+grid+'<div style="position:absolute;left:0;right:0;bottom:0;top:0;display:flex;align-items:flex-end">'+groups+'</div></div></div><div style="display:flex;gap:8px;margin-top:8px"><div style="width:34px;flex-shrink:0"></div><div style="flex:1;display:flex">'+weekLabels+'</div></div><div style="display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:18px;padding-top:12px;border-top:1px solid #F0F1F8">'+legend+'</div>'+banner+'</div>';
}

function renderAltText(area) {
  var d = DATA.alttext;
  var allItems = d.items || [];
  var items = allItems.slice();
  if (currentTab !== 'all') items = items.filter(function(x){ return x.status === currentTab; });
  if (filterRegion) items = items.filter(function(x){ return (x.region||'').toUpperCase() === filterRegion.toUpperCase(); });

  var panel = '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:14px">' + buildCountryVariation(alttextCountryRows(allItems)) + buildAltTextWeeklyChart() + '</div>';

  var hdrRow = '<th style="vertical-align:middle;white-space:nowrap;width:130px">Region</th>' +
    '<th style="vertical-align:middle;white-space:nowrap;width:200px;text-align:left;padding-left:10px">Country</th>' +
    '<th style="vertical-align:middle;width:100px;text-align:center">Status</th>' +
    '<th style="vertical-align:middle;width:auto"></th>' +
    '<th style="vertical-align:middle;width:90px;text-align:center">Pg#</th>' + damHeadTh();

  var REGION_ORDER2 = ['EU','ASIA','MEA','LATAM'];
  var groups2 = {}; var ord2 = [];
  for (var i=0;i<items.length;i++){ var rg=(items[i].region||'Other').toUpperCase(); if(!groups2[rg]){groups2[rg]=[];ord2.push(rg);} groups2[rg].push(items[i]); }
  var sorted2=[]; for(var ro=0;ro<REGION_ORDER2.length;ro++){ if(groups2[REGION_ORDER2[ro]])sorted2.push(REGION_ORDER2[ro]); }
  for(var ro2=0;ro2<ord2.length;ro2++){ if(sorted2.indexOf(ord2[ro2])===-1)sorted2.push(ord2[ro2]); }

  var rows=[];
  for (var sri=0;sri<sorted2.length;sri++){
    var region=sorted2[sri]; var ritems=groups2[region]; if(!ritems||!ritems.length)continue;
    var rcfg=REGION_CFG[region]||{label:region,bg:'#F5F6FA',tc:'#6B7280',border:'#E0E4F0'};
    for (var ii=0;ii<ritems.length;ii++){
      var item=ritems[ii];
      var statusCell;
      if (item.status==='Done'){ var dot='<span style="display:inline-block;width:13px;height:13px;border-radius:50%;background:#22C55E"></span>'; statusCell=item.url?'<a href="'+item.url+'" target="_blank" rel="noopener" title="'+item.url+'" style="display:inline-flex;align-items:center;justify-content:center;cursor:pointer">'+dot+'</a>':dot; }
      else if (item.status==='Corp. Review') statusCell='<span style="font-size:10px;font-weight:800;color:#F59E0B">법인리뷰</span>';
      else if (item.status==='Cancel') statusCell='<span style="font-size:10px;font-weight:800;color:#F59E0B">Cancel</span>';
      else if (item.status==='In Progress') statusCell='<span style="font-size:10px;font-weight:700;color:#3B82F6">작업중</span>';
      else statusCell='<span style="font-size:10px;color:#94A3B8">사전검토</span>';
      var pgCell='<span style="font-size:11px;color:#1A1D2E;font-weight:700">'+(item.pages||0)+'</span>';
     
      var regionCell='';
      if(ii===0) regionCell='<td rowspan="'+ritems.length+'" style="width:130px;text-align:center;font-size:10px;font-weight:800;background:'+rcfg.bg+';color:'+rcfg.tc+';border-right:2px solid '+rcfg.border+';vertical-align:middle;white-space:nowrap">'+rcfg.label+'</td>';
      rows.push('<tr>'+regionCell+
        '<td style="font-weight:600;color:#1A1D2E;font-size:11px;white-space:nowrap;width:200px;padding-left:10px">'+(item.country||item.locale)+'</td>'+
        '<td style="text-align:center;width:100px">'+statusCell+'</td>'+
        '<td style="width:auto"></td>'+
        '<td style="text-align:center;width:90px">'+pgCell+'</td>'+
      damCellTd() + '</tr>');
    }
  }

  var tableHtml='<div style="background:#fff;border:1px solid #E8EAF2;border-radius:14px;padding:16px 20px 8px">'+
    '<div style="margin-bottom:12px"><div style="font-size:10px;font-weight:700;letter-spacing:.1em;color:#1A1D2E;text-transform:uppercase">Full Data Table</div><div style="font-size:14px;font-weight:700;color:#1A1D2E;margin-top:2px">국가별 현황 ('+items.length+'개 프로젝트)</div></div>'+
    buildNewBanner()+buildActionBanner()+
    '<div class="art-table-wrap" style="overflow-x:auto"><table class="art-table"><thead><tr>'+hdrRow+'</tr></thead><tbody>'+(rows.join('')||'<tr><td colspan="99" style="padding:30px;color:#9BA3BF;text-align:center">검색 결과가 없습니다</td></tr>')+'</tbody></table></div>'+
  '</div>';

  area.innerHTML = panel + buildFilterBarHtml() + buildTabBarHtml(items.length) + tableHtml;
}

// ── FaqHub 주차 선택 ─────────────────────────────────────
function setFaqHubWeek(w) {
  if (!FAQ_WEEKS[w]) return;
  faqWeek = w;
  var d = FAQ_WEEKS[w];
  DATA.faq_hub.items = d.items; DATA.faq_hub.stats = d.stats; DATA.faq_hub.dam = d.dam;
  renderContent();
}
(function initFaqHubWeek(){
  var d = FAQ_WEEKS[faqWeek];
  if (d) { DATA.faq_hub.items = d.items; DATA.faq_hub.stats = d.stats; DATA.faq_hub.dam = d.dam; }
})();

function faqCountryRows(items) {
  var map={}, order=[];
  for (var i=0;i<items.length;i++){ var it=items[i]; var n=it.country||it.locale;
    if(!map[n]){map[n]={name:n,pub:0,total:0};order.push(n);}
    if(it.status!=='Cancel'){map[n].total++; if(it.status==='Done')map[n].pub++;}}
  return order.map(function(n){return map[n];});
}

function faqWeeklyInsight() {
  var weeks=Object.keys(FAQ_WEEKS).sort(); if(weeks.length<2)return null;
  var pcts=weeks.map(function(w){var s=FAQ_WEEKS[w].stats||{};return s.Total>0?Math.round(s.Done/s.Total*100):0;});
  var last=weeks[weeks.length-1],ls=FAQ_WEEKS[last].stats||{};
  var delta=pcts[pcts.length-1]-pcts[0]; var pre=ls['Pre-Review']||0,wip=ls['In Progress']||0,corp=ls['Corp. Review']||0; var lastP=pcts[pcts.length-1];
  if(delta<=0)return{level:'warn',msg:'<b>진행률 정체</b> — 최근 '+weeks.length+'주간('+weeks[0]+'~'+last+') 진행률이 '+lastP+'%로 변동이 없습니다. 사전검토 '+pre+'건 · 작업중 '+wip+'건 · 법인리뷰 '+corp+'건 — 진행 독려가 필요합니다.'};
  if(delta<5){var prev=weeks[weeks.length-2];var pd=(ls.Done||0)-((FAQ_WEEKS[prev].stats||{}).Done||0);return{level:'caution',msg:'<b>진행 더딤</b> — 전주차('+prev+') 대비 '+pd+'건 진행되어 '+(lastP-pcts[pcts.length-2])+'%p 상승에 그쳤습니다. 사전검토 '+pre+'건 잔여.'};}
  var prev=weeks[weeks.length-2];var pd=(ls.Done||0)-((FAQ_WEEKS[prev].stats||{}).Done||0);
  return{level:'ok',msg:'<b>진행 양호</b> — 전주차('+prev+') 대비 '+pd+'건 진행되어 '+(lastP-pcts[pcts.length-2])+'%p 상승했습니다 (현재 '+lastP+'%). 잔여 사전검토 '+pre+'건.'};
}

function buildFaqHubWeeklyChart() {
  var weeks=Object.keys(FAQ_WEEKS).sort(); if(!weeks.length)return '';
  var series=[{key:'pre',label:'사전검토',color:SC['Pre-Review'].dot},{key:'wip',label:'작업중',color:SC['In Progress'].dot},{key:'corp',label:'법인리뷰',color:SC['Corp. Review'].dot},{key:'done',label:'완료',color:SC['Done'].dot}];
  var wkData=weeks.map(function(wk){var s=FAQ_WEEKS[wk].stats||{};return{wk:wk,pre:s['Pre-Review']||0,wip:s['In Progress']||0,corp:s['Corp. Review']||0,done:s.Done||0,total:s.Total||0};});
  var maxV=0;wkData.forEach(function(d){maxV=Math.max(maxV,d.total||0);});
  var yMax=maxV||2;var chartH=170;
  var grid='',yLabels='';
  for(var g=0;g<=4;g++){var val=Math.round(yMax*g/4),bottom=(val/yMax)*chartH;grid+='<div style="position:absolute;left:0;right:0;bottom:'+bottom+'px;border-top:1px solid #F0F1F8"></div>';yLabels+='<div style="position:absolute;right:0;bottom:'+(bottom-6)+'px;font-size:9px;color:#9BA3BF;font-weight:600">'+val+'건</div>';}
  var groups=wkData.map(function(d){var pct=d.total>0?Math.round(d.done/d.total*100):0;var bars=series.map(function(se){var v=d[se.key];var h=Math.max(Math.round((v/yMax)*chartH),v>0?2:0);return '<div data-wk="'+d.wk+'" data-pct="'+pct+'" data-label="'+se.label+'" data-val="'+v+'" data-color="'+se.color+'" onmouseenter="bgBarTip(event)" onmousemove="bgBarTip(event)" onmouseleave="bgBarTipHide()" onmouseover="this.style.opacity=0.75" onmouseout="this.style.opacity=1" style="width:11px;height:'+h+'px;background:'+se.color+';border-radius:3px 3px 0 0;cursor:pointer;transition:opacity .15s"></div>';}).join('');return '<div style="flex:1;height:100%;display:flex;align-items:flex-end;justify-content:center;gap:3px">'+bars+'</div>';}).join('');
  var weekLabels=wkData.map(function(d){var active=(d.wk===faqWeek);return '<div onclick="setFaqHubWeek(\'' + d.wk + '\')" style="flex:1;text-align:center;font-size:11px;font-weight:'+(active?'800':'600')+';color:'+(active?'#A50034':'#6B7280')+';cursor:pointer">'+d.wk+'</div>';}).join('');
  var legend=series.map(function(se){return '<span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:#6B7280"><span style="width:12px;height:12px;border-radius:3px;background:'+se.color+'"></span>'+se.label+'</span>';}).join('');
  var ins=faqWeeklyInsight();var banner='';
  if(ins){var bc={warn:{bg:'#FEF6F0',bd:'#F59E0B',tc:'#92400E'},caution:{bg:'#FFFBEB',bd:'#FBBF24',tc:'#92400E'},ok:{bg:'#F0FDF4',bd:'#22C55E',tc:'#166534'}}[ins.level];banner='<div style="background:'+bc.bg+';border:1px solid '+bc.bd+'33;border-left:3px solid '+bc.bd+';border-radius:8px;padding:10px 14px;margin-top:14px;font-size:11.5px;color:'+bc.tc+';line-height:1.5;display:flex;align-items:flex-start">'+(ins.level==='ok'?okIcon(bc.bd):warnIcon(bc.bd))+'<span>'+ins.msg+'</span></div>';}
  return '<div style="background:#fff;border:1px solid #E8EAF2;border-radius:14px;padding:16px 20px;flex:1;min-width:340px"><div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px"><div><div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#1A1D2E;text-transform:uppercase">주차별 현황</div><div style="font-size:10px;color:#9BA3BF;font-weight:600">WEEKLY PROGRESS</div></div><span style="font-size:11px;font-weight:800;color:#fff;background:#A50034;padding:3px 10px;border-radius:6px">2026</span></div><div style="display:flex;gap:8px;margin-top:18px"><div style="position:relative;width:34px;height:'+chartH+'px;flex-shrink:0">'+yLabels+'</div><div style="position:relative;flex:1;height:'+chartH+'px">'+grid+'<div style="position:absolute;left:0;right:0;bottom:0;top:0;display:flex;align-items:flex-end">'+groups+'</div></div></div><div style="display:flex;gap:8px;margin-top:8px"><div style="width:34px;flex-shrink:0"></div><div style="flex:1;display:flex">'+weekLabels+'</div></div><div style="display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:18px;padding-top:12px;border-top:1px solid #F0F1F8">'+legend+'</div>'+banner+'</div>';
}

function renderFaqHub(area) {
  var d = DATA.faq_hub;
  var allItems = d.items || [];
  var items = allItems.slice();
  if (currentTab !== 'all') items = items.filter(function(x){ return x.status === currentTab; });
  if (filterRegion) items = items.filter(function(x){ return (x.region||'').toUpperCase() === filterRegion.toUpperCase(); });

  var panel = '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:14px">' + buildCountryVariation(faqCountryRows(allItems)) + buildFaqHubWeeklyChart() + '</div>';

  var hdrRow = '<th style="vertical-align:middle;white-space:nowrap;width:130px">Region</th>' +
    '<th style="vertical-align:middle;white-space:nowrap;width:200px;text-align:left;padding-left:10px">Country</th>' +
    '<th style="vertical-align:middle;width:100px;text-align:center">Status</th>' +
    '<th style="vertical-align:middle;width:auto"></th>' + damHeadTh();

  var REGION_ORDER2 = ['EU','ASIA','MEA','LATAM'];
  var groups2 = {}; var ord2 = [];
  for (var i=0;i<items.length;i++){ var rg=(items[i].region||'Other').toUpperCase(); if(!groups2[rg]){groups2[rg]=[];ord2.push(rg);} groups2[rg].push(items[i]); }
  var sorted2=[]; for(var ro=0;ro<REGION_ORDER2.length;ro++){ if(groups2[REGION_ORDER2[ro]])sorted2.push(REGION_ORDER2[ro]); }
  for(var ro2=0;ro2<ord2.length;ro2++){ if(sorted2.indexOf(ord2[ro2])===-1)sorted2.push(ord2[ro2]); }

  var rows=[];
  for (var sri=0;sri<sorted2.length;sri++){
    var region=sorted2[sri]; var ritems=groups2[region]; if(!ritems||!ritems.length)continue;
    var rcfg=REGION_CFG[region]||{label:region,bg:'#F5F6FA',tc:'#6B7280',border:'#E0E4F0'};
    for (var ii=0;ii<ritems.length;ii++){
      var item=ritems[ii];
      var statusCell;
      if (item.status==='Done'){ var dot='<span style="display:inline-block;width:13px;height:13px;border-radius:50%;background:#22C55E"></span>'; statusCell=item.url?'<a href="'+item.url+'" target="_blank" rel="noopener" title="'+item.url+'" style="display:inline-flex;align-items:center;justify-content:center;cursor:pointer">'+dot+'</a>':dot; }
      else if (item.status==='Corp. Review') statusCell='<span style="font-size:10px;font-weight:800;color:#F59E0B">법인리뷰</span>';
      else if (item.status==='Cancel') statusCell='<span style="font-size:10px;font-weight:800;color:#F59E0B">Cancel</span>';
      else if (item.status==='In Progress') statusCell='<span style="font-size:10px;font-weight:700;color:#3B82F6">작업중</span>';
      else statusCell='<span style="font-size:10px;color:#94A3B8">사전검토</span>';
      var pttCell=item.ptt?'<span style="font-size:9px;color:#6B7280">'+item.ptt+'</span>':'';
      var regionCell='';
      if(ii===0) regionCell='<td rowspan="'+ritems.length+'" style="width:130px;text-align:center;font-size:10px;font-weight:800;background:'+rcfg.bg+';color:'+rcfg.tc+';border-right:2px solid '+rcfg.border+';vertical-align:middle;white-space:nowrap">'+rcfg.label+'</td>';
      rows.push('<tr>'+regionCell+
        '<td style="font-weight:600;color:#1A1D2E;font-size:11px;white-space:nowrap;width:200px;padding-left:10px">'+(item.country||item.locale)+'</td>'+
        '<td style="text-align:center;width:100px">'+statusCell+'</td>'+
        '<td style="width:auto"></td>'+
      damCellTd() + '</tr>');
    }
  }

  var tableHtml='<div style="background:#fff;border:1px solid #E8EAF2;border-radius:14px;padding:16px 20px 8px">'+
    '<div style="margin-bottom:12px"><div style="font-size:10px;font-weight:700;letter-spacing:.1em;color:#1A1D2E;text-transform:uppercase">Full Data Table</div><div style="font-size:14px;font-weight:700;color:#1A1D2E;margin-top:2px">국가별 현황 ('+items.length+'개 로케일)</div></div>'+
    buildNewBanner()+buildActionBanner()+
    '<div class="art-table-wrap" style="overflow-x:auto"><table class="art-table"><thead><tr>'+hdrRow+'</tr></thead><tbody>'+(rows.join('')||'<tr><td colspan="99" style="padding:30px;color:#9BA3BF;text-align:center">검색 결과가 없습니다</td></tr>')+'</tbody></table></div>'+
  '</div>';

  area.innerHTML = panel + buildFilterBarHtml() + buildTabBarHtml(items.length) + tableHtml;
}

function setPdpGalleryWeek(w) {
  if (!PDP_WEEKS[w]) return;
  pdpWeek = w;
  var d = PDP_WEEKS[w];
  DATA.pdp_gallery.items = d.items; DATA.pdp_gallery.stats = d.stats; DATA.pdp_gallery.dam = d.dam;
  renderContent();
}
(function initPdpGalleryWeek(){
  var d = PDP_WEEKS[pdpWeek];
  if (d) { DATA.pdp_gallery.items = d.items; DATA.pdp_gallery.stats = d.stats; DATA.pdp_gallery.dam = d.dam; }
})();

function pdpCountryRows(items) {
  var map={}, order=[];
  for (var i=0;i<items.length;i++){ var it=items[i]; var n=it.country||it.locale; var pg=parseInt(it.pages)||0;
    if(!map[n]){map[n]={name:n,pub:0,total:0};order.push(n);}
    if(it.status!=='Cancel'){map[n].total+=pg; if(it.status==='Done')map[n].pub+=pg;}}
  return order.map(function(n){return map[n];});
}

function pdpWeeklyInsight() {
  var weeks=Object.keys(PDP_WEEKS).sort(); if(weeks.length<2)return null;
  var pcts=weeks.map(function(w){var s=PDP_WEEKS[w].stats||{};return s.Total>0?Math.round(s.Done/s.Total*100):0;});
  var last=weeks[weeks.length-1],ls=PDP_WEEKS[last].stats||{};
  var delta=pcts[pcts.length-1]-pcts[0]; var pre=ls['Pre-Review']||0,wip=ls['In Progress']||0,corp=ls['Corp. Review']||0; var lastP=pcts[pcts.length-1];
  if(delta<=0)return{level:'warn',msg:'<b>진행률 정체</b> — 최근 '+weeks.length+'주간('+weeks[0]+'~'+last+') 진행률이 '+lastP+'%로 변동이 없습니다. 사전검토 '+pre+'건 · 작업중 '+wip+'건 · 법인리뷰 '+corp+'건 — 진행 독려가 필요합니다.'};
  if(delta<5){var prev=weeks[weeks.length-2];var pd=(ls.Done||0)-((PDP_WEEKS[prev].stats||{}).Done||0);return{level:'caution',msg:'<b>진행 더딤</b> — 전주차('+prev+') 대비 '+pd+'건 진행되어 '+(lastP-pcts[pcts.length-2])+'%p 상승에 그쳤습니다. 사전검토 '+pre+'건 잔여.'};}
  var prev=weeks[weeks.length-2];var pd=(ls.Done||0)-((PDP_WEEKS[prev].stats||{}).Done||0);
  return{level:'ok',msg:'<b>진행 양호</b> — 전주차('+prev+') 대비 '+pd+'건 진행되어 '+(lastP-pcts[pcts.length-2])+'%p 상승했습니다 (현재 '+lastP+'%). 잔여 사전검토 '+pre+'건.'};
}

function buildPdpGalleryWeeklyChart() {
  var weeks=Object.keys(PDP_WEEKS).sort(); if(!weeks.length)return '';
  var series=[{key:'pre',label:'사전검토',color:SC['Pre-Review'].dot},{key:'wip',label:'작업중',color:SC['In Progress'].dot},{key:'corp',label:'법인리뷰',color:SC['Corp. Review'].dot},{key:'done',label:'완료',color:SC['Done'].dot}];
  var wkData=weeks.map(function(wk){var s=PDP_WEEKS[wk].stats||{};return{wk:wk,pre:s['Pre-Review']||0,wip:s['In Progress']||0,corp:s['Corp. Review']||0,done:s.Done||0,total:s.Total||0};});
  var maxV=0;wkData.forEach(function(d){maxV=Math.max(maxV,d.total||0);});
  var yMax=maxV||2;var chartH=170;
  var grid='',yLabels='';
  for(var g=0;g<=4;g++){var val=Math.round(yMax*g/4),bottom=(val/yMax)*chartH;grid+='<div style="position:absolute;left:0;right:0;bottom:'+bottom+'px;border-top:1px solid #F0F1F8"></div>';yLabels+='<div style="position:absolute;right:0;bottom:'+(bottom-6)+'px;font-size:9px;color:#9BA3BF;font-weight:600">'+val+'건</div>';}
  var groups=wkData.map(function(d){var pct=d.total>0?Math.round(d.done/d.total*100):0;var bars=series.map(function(se){var v=d[se.key];var h=Math.max(Math.round((v/yMax)*chartH),v>0?2:0);return '<div data-wk="'+d.wk+'" data-pct="'+pct+'" data-label="'+se.label+'" data-val="'+v+'" data-color="'+se.color+'" onmouseenter="bgBarTip(event)" onmousemove="bgBarTip(event)" onmouseleave="bgBarTipHide()" onmouseover="this.style.opacity=0.75" onmouseout="this.style.opacity=1" style="width:11px;height:'+h+'px;background:'+se.color+';border-radius:3px 3px 0 0;cursor:pointer;transition:opacity .15s"></div>';}).join('');return '<div style="flex:1;height:100%;display:flex;align-items:flex-end;justify-content:center;gap:3px">'+bars+'</div>';}).join('');
  var weekLabels=wkData.map(function(d){var active=(d.wk===pdpWeek);return '<div onclick="setPdpGalleryWeek(\'' + d.wk + '\')" style="flex:1;text-align:center;font-size:11px;font-weight:'+(active?'800':'600')+';color:'+(active?'#A50034':'#6B7280')+';cursor:pointer">'+d.wk+'</div>';}).join('');
  var legend=series.map(function(se){return '<span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:#6B7280"><span style="width:12px;height:12px;border-radius:3px;background:'+se.color+'"></span>'+se.label+'</span>';}).join('');
  var ins=pdpWeeklyInsight();var banner='';
  if(ins){var bc={warn:{bg:'#FEF6F0',bd:'#F59E0B',tc:'#92400E'},caution:{bg:'#FFFBEB',bd:'#FBBF24',tc:'#92400E'},ok:{bg:'#F0FDF4',bd:'#22C55E',tc:'#166534'}}[ins.level];banner='<div style="background:'+bc.bg+';border:1px solid '+bc.bd+'33;border-left:3px solid '+bc.bd+';border-radius:8px;padding:10px 14px;margin-top:14px;font-size:11.5px;color:'+bc.tc+';line-height:1.5;display:flex;align-items:flex-start">'+(ins.level==='ok'?okIcon(bc.bd):warnIcon(bc.bd))+'<span>'+ins.msg+'</span></div>';}
  return '<div style="background:#fff;border:1px solid #E8EAF2;border-radius:14px;padding:16px 20px;flex:1;min-width:340px"><div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px"><div><div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#1A1D2E;text-transform:uppercase">주차별 현황</div><div style="font-size:10px;color:#9BA3BF;font-weight:600">WEEKLY PROGRESS</div></div><span style="font-size:11px;font-weight:800;color:#fff;background:#A50034;padding:3px 10px;border-radius:6px">2026</span></div><div style="display:flex;gap:8px;margin-top:18px"><div style="position:relative;width:34px;height:'+chartH+'px;flex-shrink:0">'+yLabels+'</div><div style="position:relative;flex:1;height:'+chartH+'px">'+grid+'<div style="position:absolute;left:0;right:0;bottom:0;top:0;display:flex;align-items:flex-end">'+groups+'</div></div></div><div style="display:flex;gap:8px;margin-top:8px"><div style="width:34px;flex-shrink:0"></div><div style="flex:1;display:flex">'+weekLabels+'</div></div><div style="display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:18px;padding-top:12px;border-top:1px solid #F0F1F8">'+legend+'</div>'+banner+'</div>';
}

function renderPdpGallery(area) {
  var d = DATA.pdp_gallery;
  var allItems = d.items || [];
  var items = allItems.slice();
  if (currentTab !== 'all') items = items.filter(function(x){ return x.status === currentTab; });
  if (filterRegion) items = items.filter(function(x){ return (x.region||'').toUpperCase() === filterRegion.toUpperCase(); });

  var panel = '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:14px">' + buildCountryVariation(pdpCountryRows(allItems)) + buildPdpGalleryWeeklyChart() + '</div>';

  var hdrRow = '<th style="vertical-align:middle;white-space:nowrap;width:130px">Region</th>' +
    '<th style="vertical-align:middle;white-space:nowrap;width:200px;text-align:left;padding-left:10px">Country</th>' +
    '<th style="vertical-align:middle;width:100px;text-align:center">Status</th>' +
    '<th style="vertical-align:middle;width:auto"></th>' +
    '<th style="vertical-align:middle;width:90px;text-align:center">Pg#</th>' + damHeadTh();

  var REGION_ORDER2 = ['EU','ASIA','MEA','LATAM'];
  var groups2 = {}; var ord2 = [];
  for (var i=0;i<items.length;i++){ var rg=(items[i].region||'Other').toUpperCase(); if(!groups2[rg]){groups2[rg]=[];ord2.push(rg);} groups2[rg].push(items[i]); }
  var sorted2=[]; for(var ro=0;ro<REGION_ORDER2.length;ro++){ if(groups2[REGION_ORDER2[ro]])sorted2.push(REGION_ORDER2[ro]); }
  for(var ro2=0;ro2<ord2.length;ro2++){ if(sorted2.indexOf(ord2[ro2])===-1)sorted2.push(ord2[ro2]); }

  var rows=[];
  for (var sri=0;sri<sorted2.length;sri++){
    var region=sorted2[sri]; var ritems=groups2[region]; if(!ritems||!ritems.length)continue;
    var rcfg=REGION_CFG[region]||{label:region,bg:'#F5F6FA',tc:'#6B7280',border:'#E0E4F0'};
    for (var ii=0;ii<ritems.length;ii++){
      var item=ritems[ii];
      var statusCell;
      if (item.status==='Done'){ var dot='<span style="display:inline-block;width:13px;height:13px;border-radius:50%;background:#22C55E"></span>'; statusCell=item.url?'<a href="'+item.url+'" target="_blank" rel="noopener" title="'+item.url+'" style="display:inline-flex;align-items:center;justify-content:center;cursor:pointer">'+dot+'</a>':dot; }
      else if (item.status==='Corp. Review') statusCell='<span style="font-size:10px;font-weight:800;color:#F59E0B">법인리뷰</span>';
      else if (item.status==='Cancel') statusCell='<span style="font-size:10px;font-weight:800;color:#F59E0B">Cancel</span>';
      else if (item.status==='In Progress') statusCell='<span style="font-size:10px;font-weight:700;color:#3B82F6">작업중</span>';
      else statusCell='<span style="font-size:10px;color:#94A3B8">사전검토</span>';
      var pgCell='<span style="font-size:11px;color:#1A1D2E;font-weight:700">'+(item.pages||0)+'</span>';
     
      var regionCell='';
      if(ii===0) regionCell='<td rowspan="'+ritems.length+'" style="width:130px;text-align:center;font-size:10px;font-weight:800;background:'+rcfg.bg+';color:'+rcfg.tc+';border-right:2px solid '+rcfg.border+';vertical-align:middle;white-space:nowrap">'+rcfg.label+'</td>';
      rows.push('<tr>'+regionCell+
        '<td style="font-weight:600;color:#1A1D2E;font-size:11px;white-space:nowrap;width:200px;padding-left:10px">'+(item.country||item.locale)+'</td>'+
        '<td style="text-align:center;width:100px">'+statusCell+'</td>'+
        '<td style="width:auto"></td>'+
        '<td style="text-align:center;width:90px">'+pgCell+'</td>'+
      damCellTd() + '</tr>');
    }
  }

  var tableHtml='<div style="background:#fff;border:1px solid #E8EAF2;border-radius:14px;padding:16px 20px 8px">'+
    '<div style="margin-bottom:12px"><div style="font-size:10px;font-weight:700;letter-spacing:.1em;color:#1A1D2E;text-transform:uppercase">Full Data Table</div><div style="font-size:14px;font-weight:700;color:#1A1D2E;margin-top:2px">국가별 현황 ('+items.length+'개 프로젝트)</div></div>'+
    buildNewBanner()+buildActionBanner()+
    '<div class="art-table-wrap" style="overflow-x:auto"><table class="art-table"><thead><tr>'+hdrRow+'</tr></thead><tbody>'+(rows.join('')||'<tr><td colspan="99" style="padding:30px;color:#9BA3BF;text-align:center">검색 결과가 없습니다</td></tr>')+'</tbody></table></div>'+
  '</div>';

  area.innerHTML = panel + buildFilterBarHtml() + buildTabBarHtml(items.length) + tableHtml;
}

// ── FaqHub 주차 선택 ─────────────────────────────────────

function setVacuumWeek(w) {
  if (!VACUUM_WEEKS[w]) return;
  vacuumWeek = w;
  var d = VACUUM_WEEKS[w];
  DATA.vacuum.items = d.items; DATA.vacuum.stats = d.stats; DATA.vacuum.dam = d.dam;
  renderContent();
}
(function initVacuumWeek(){
  var d = VACUUM_WEEKS[vacuumWeek];
  if (d) { DATA.vacuum.items = d.items; DATA.vacuum.stats = d.stats; DATA.vacuum.dam = d.dam; }
})();

function vacuumCountryRows(items) {
  var map={}, order=[];
  for (var i=0;i<items.length;i++){ var it=items[i]; var n=it.country||it.locale; var pg=parseInt(it.pages)||0;
    if(!map[n]){map[n]={name:n,pub:0,total:0};order.push(n);}
    if(it.status!=='Cancel'){map[n].total+=pg; if(it.status==='Done')map[n].pub+=pg;}}
  return order.map(function(n){return map[n];});
}

function vacuumWeeklyInsight() {
  var weeks=Object.keys(VACUUM_WEEKS).sort(); if(weeks.length<2)return null;
  var pcts=weeks.map(function(w){var s=VACUUM_WEEKS[w].stats||{};return s.Total>0?Math.round(s.Done/s.Total*100):0;});
  var last=weeks[weeks.length-1],ls=VACUUM_WEEKS[last].stats||{};
  var delta=pcts[pcts.length-1]-pcts[0]; var pre=ls['Pre-Review']||0,wip=ls['In Progress']||0,corp=ls['Corp. Review']||0; var lastP=pcts[pcts.length-1];
  if(delta<=0)return{level:'warn',msg:'<b>진행률 정체</b> — 최근 '+weeks.length+'주간('+weeks[0]+'~'+last+') 진행률이 '+lastP+'%로 변동이 없습니다. 사전검토 '+pre+'건 · 작업중 '+wip+'건 · 법인리뷰 '+corp+'건 — 진행 독려가 필요합니다.'};
  if(delta<5){var prev=weeks[weeks.length-2];var pd=(ls.Done||0)-((VACUUM_WEEKS[prev].stats||{}).Done||0);return{level:'caution',msg:'<b>진행 더딤</b> — 전주차('+prev+') 대비 '+pd+'건 진행되어 '+(lastP-pcts[pcts.length-2])+'%p 상승에 그쳤습니다. 사전검토 '+pre+'건 잔여.'};}
  var prev=weeks[weeks.length-2];var pd=(ls.Done||0)-((VACUUM_WEEKS[prev].stats||{}).Done||0);
  return{level:'ok',msg:'<b>진행 양호</b> — 전주차('+prev+') 대비 '+pd+'건 진행되어 '+(lastP-pcts[pcts.length-2])+'%p 상승했습니다 (현재 '+lastP+'%). 잔여 사전검토 '+pre+'건.'};
}

function buildVacuumWeeklyChart() {
  var weeks=Object.keys(VACUUM_WEEKS).sort(); if(!weeks.length)return '';
  var series=[{key:'pre',label:'사전검토',color:SC['Pre-Review'].dot},{key:'wip',label:'작업중',color:SC['In Progress'].dot},{key:'corp',label:'법인리뷰',color:SC['Corp. Review'].dot},{key:'done',label:'완료',color:SC['Done'].dot}];
  var wkData=weeks.map(function(wk){var s=VACUUM_WEEKS[wk].stats||{};return{wk:wk,pre:s['Pre-Review']||0,wip:s['In Progress']||0,corp:s['Corp. Review']||0,done:s.Done||0,total:s.Total||0};});
  var maxV=0;wkData.forEach(function(d){maxV=Math.max(maxV,d.total||0);});
  var yMax=maxV||2;var chartH=170;
  var grid='',yLabels='';
  for(var g=0;g<=4;g++){var val=Math.round(yMax*g/4),bottom=(val/yMax)*chartH;grid+='<div style="position:absolute;left:0;right:0;bottom:'+bottom+'px;border-top:1px solid #F0F1F8"></div>';yLabels+='<div style="position:absolute;right:0;bottom:'+(bottom-6)+'px;font-size:9px;color:#9BA3BF;font-weight:600">'+val+'건</div>';}
  var groups=wkData.map(function(d){var pct=d.total>0?Math.round(d.done/d.total*100):0;var bars=series.map(function(se){var v=d[se.key];var h=Math.max(Math.round((v/yMax)*chartH),v>0?2:0);return '<div data-wk="'+d.wk+'" data-pct="'+pct+'" data-label="'+se.label+'" data-val="'+v+'" data-color="'+se.color+'" onmouseenter="bgBarTip(event)" onmousemove="bgBarTip(event)" onmouseleave="bgBarTipHide()" onmouseover="this.style.opacity=0.75" onmouseout="this.style.opacity=1" style="width:11px;height:'+h+'px;background:'+se.color+';border-radius:3px 3px 0 0;cursor:pointer;transition:opacity .15s"></div>';}).join('');return '<div style="flex:1;height:100%;display:flex;align-items:flex-end;justify-content:center;gap:3px">'+bars+'</div>';}).join('');
  var weekLabels=wkData.map(function(d){var active=(d.wk===vacuumWeek);return '<div onclick="setVacuumWeek(\'' + d.wk + '\')" style="flex:1;text-align:center;font-size:11px;font-weight:'+(active?'800':'600')+';color:'+(active?'#A50034':'#6B7280')+';cursor:pointer">'+d.wk+'</div>';}).join('');
  var legend=series.map(function(se){return '<span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:#6B7280"><span style="width:12px;height:12px;border-radius:3px;background:'+se.color+'"></span>'+se.label+'</span>';}).join('');
  var ins=vacuumWeeklyInsight();var banner='';
  if(ins){var bc={warn:{bg:'#FEF6F0',bd:'#F59E0B',tc:'#92400E'},caution:{bg:'#FFFBEB',bd:'#FBBF24',tc:'#92400E'},ok:{bg:'#F0FDF4',bd:'#22C55E',tc:'#166534'}}[ins.level];banner='<div style="background:'+bc.bg+';border:1px solid '+bc.bd+'33;border-left:3px solid '+bc.bd+';border-radius:8px;padding:10px 14px;margin-top:14px;font-size:11.5px;color:'+bc.tc+';line-height:1.5;display:flex;align-items:flex-start">'+(ins.level==='ok'?okIcon(bc.bd):warnIcon(bc.bd))+'<span>'+ins.msg+'</span></div>';}
  return '<div style="background:#fff;border:1px solid #E8EAF2;border-radius:14px;padding:16px 20px;flex:1;min-width:340px"><div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px"><div><div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#1A1D2E;text-transform:uppercase">주차별 현황</div><div style="font-size:10px;color:#9BA3BF;font-weight:600">WEEKLY PROGRESS</div></div><span style="font-size:11px;font-weight:800;color:#fff;background:#A50034;padding:3px 10px;border-radius:6px">2026</span></div><div style="display:flex;gap:8px;margin-top:18px"><div style="position:relative;width:34px;height:'+chartH+'px;flex-shrink:0">'+yLabels+'</div><div style="position:relative;flex:1;height:'+chartH+'px">'+grid+'<div style="position:absolute;left:0;right:0;bottom:0;top:0;display:flex;align-items:flex-end">'+groups+'</div></div></div><div style="display:flex;gap:8px;margin-top:8px"><div style="width:34px;flex-shrink:0"></div><div style="flex:1;display:flex">'+weekLabels+'</div></div><div style="display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:18px;padding-top:12px;border-top:1px solid #F0F1F8">'+legend+'</div>'+banner+'</div>';
}

function renderVacuum(area) {
  var d = DATA.vacuum;
  var allItems = d.items || [];
  var items = allItems.slice();
  if (currentTab !== 'all') items = items.filter(function(x){ return x.status === currentTab; });
  if (filterRegion) items = items.filter(function(x){ return (x.region||'').toUpperCase() === filterRegion.toUpperCase(); });

  var panel = '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:14px">' + buildCountryVariation(vacuumCountryRows(allItems)) + buildVacuumWeeklyChart() + '</div>';

  var hdrRow = '<th style="vertical-align:middle;white-space:nowrap;width:130px">Region</th>' +
    '<th style="vertical-align:middle;white-space:nowrap;width:200px;text-align:left;padding-left:10px">Country</th>' +
    '<th style="vertical-align:middle;width:100px;text-align:center">Status</th>' +
    '<th style="vertical-align:middle;width:auto"></th>' +
    '<th style="vertical-align:middle;width:90px;text-align:center">Pg#</th>' + damHeadTh();

  var REGION_ORDER2 = ['EU','ASIA','MEA','LATAM'];
  var groups2 = {}; var ord2 = [];
  for (var i=0;i<items.length;i++){ var rg=(items[i].region||'Other').toUpperCase(); if(!groups2[rg]){groups2[rg]=[];ord2.push(rg);} groups2[rg].push(items[i]); }
  var sorted2=[]; for(var ro=0;ro<REGION_ORDER2.length;ro++){ if(groups2[REGION_ORDER2[ro]])sorted2.push(REGION_ORDER2[ro]); }
  for(var ro2=0;ro2<ord2.length;ro2++){ if(sorted2.indexOf(ord2[ro2])===-1)sorted2.push(ord2[ro2]); }

  var rows=[];
  for (var sri=0;sri<sorted2.length;sri++){
    var region=sorted2[sri]; var ritems=groups2[region]; if(!ritems||!ritems.length)continue;
    var rcfg=REGION_CFG[region]||{label:region,bg:'#F5F6FA',tc:'#6B7280',border:'#E0E4F0'};
    for (var ii=0;ii<ritems.length;ii++){
      var item=ritems[ii];
      var statusCell;
      if (item.status==='Done'){ var dot='<span style="display:inline-block;width:13px;height:13px;border-radius:50%;background:#22C55E"></span>'; statusCell=item.url?'<a href="'+item.url+'" target="_blank" rel="noopener" title="'+item.url+'" style="display:inline-flex;align-items:center;justify-content:center;cursor:pointer">'+dot+'</a>':dot; }
      else if (item.status==='Corp. Review') statusCell='<span style="font-size:10px;font-weight:800;color:#F59E0B">법인리뷰</span>';
      else if (item.status==='Cancel') statusCell='<span style="font-size:10px;font-weight:800;color:#F59E0B">Cancel</span>';
      else if (item.status==='In Progress') statusCell='<span style="font-size:10px;font-weight:700;color:#3B82F6">작업중</span>';
      else statusCell='<span style="font-size:10px;color:#94A3B8">사전검토</span>';
      var pgCell='<span style="font-size:11px;color:#1A1D2E;font-weight:700">'+(item.pages||0)+'</span>';
     
      var regionCell='';
      if(ii===0) regionCell='<td rowspan="'+ritems.length+'" style="width:130px;text-align:center;font-size:10px;font-weight:800;background:'+rcfg.bg+';color:'+rcfg.tc+';border-right:2px solid '+rcfg.border+';vertical-align:middle;white-space:nowrap">'+rcfg.label+'</td>';
      rows.push('<tr>'+regionCell+
        '<td style="font-weight:600;color:#1A1D2E;font-size:11px;white-space:nowrap;width:200px;padding-left:10px">'+(item.country||item.locale)+'</td>'+
        '<td style="text-align:center;width:100px">'+statusCell+'</td>'+
        '<td style="width:auto"></td>'+
        '<td style="text-align:center;width:90px">'+pgCell+'</td>'+
      damCellTd() + '</tr>');
    }
  }

  var tableHtml='<div style="background:#fff;border:1px solid #E8EAF2;border-radius:14px;padding:16px 20px 8px">'+
    '<div style="margin-bottom:12px"><div style="font-size:10px;font-weight:700;letter-spacing:.1em;color:#1A1D2E;text-transform:uppercase">Full Data Table</div><div style="font-size:14px;font-weight:700;color:#1A1D2E;margin-top:2px">국가별 현황 ('+items.length+'개 프로젝트)</div></div>'+
    buildNewBanner()+buildActionBanner()+
    '<div class="art-table-wrap" style="overflow-x:auto"><table class="art-table"><thead><tr>'+hdrRow+'</tr></thead><tbody>'+(rows.join('')||'<tr><td colspan="99" style="padding:30px;color:#9BA3BF;text-align:center">검색 결과가 없습니다</td></tr>')+'</tbody></table></div>'+
  '</div>';

  area.innerHTML = panel + buildFilterBarHtml() + buildTabBarHtml(items.length) + tableHtml;
}

// ── FaqHub 주차 선택 ─────────────────────────────────────

function setWmoFaqWeek(w) {
  if (!WMO_FAQ_WEEKS[w]) return;
  wmoWeek = w;
  var d = WMO_FAQ_WEEKS[w];
  DATA.wmo_faq.items = d.items; DATA.wmo_faq.stats = d.stats; DATA.wmo_faq.dam = d.dam;
  renderContent();
}
(function initWmoFaqWeek(){
  var d = WMO_FAQ_WEEKS[wmoWeek];
  if (d) { DATA.wmo_faq.items = d.items; DATA.wmo_faq.stats = d.stats; DATA.wmo_faq.dam = d.dam; }
})();

function wmoCountryRows(items) {
  var map={}, order=[];
  for (var i=0;i<items.length;i++){ var it=items[i]; var n=it.country||it.locale; var pg=parseInt(it.pages)||0;
    if(!map[n]){map[n]={name:n,pub:0,total:0};order.push(n);}
    if(it.status!=='Cancel'){map[n].total+=pg; if(it.status==='Done')map[n].pub+=pg;}}
  return order.map(function(n){return map[n];});
}

function wmoWeeklyInsight() {
  var weeks=Object.keys(WMO_FAQ_WEEKS).sort(); if(weeks.length<2)return null;
  var pcts=weeks.map(function(w){var s=WMO_FAQ_WEEKS[w].stats||{};return s.Total>0?Math.round(s.Done/s.Total*100):0;});
  var last=weeks[weeks.length-1],ls=WMO_FAQ_WEEKS[last].stats||{};
  var delta=pcts[pcts.length-1]-pcts[0]; var pre=ls['Pre-Review']||0,wip=ls['In Progress']||0,corp=ls['Corp. Review']||0; var lastP=pcts[pcts.length-1];
  if(delta<=0)return{level:'warn',msg:'<b>진행률 정체</b> — 최근 '+weeks.length+'주간('+weeks[0]+'~'+last+') 진행률이 '+lastP+'%로 변동이 없습니다. 사전검토 '+pre+'건 · 작업중 '+wip+'건 · 법인리뷰 '+corp+'건 — 진행 독려가 필요합니다.'};
  if(delta<5){var prev=weeks[weeks.length-2];var pd=(ls.Done||0)-((WMO_FAQ_WEEKS[prev].stats||{}).Done||0);return{level:'caution',msg:'<b>진행 더딤</b> — 전주차('+prev+') 대비 '+pd+'건 진행되어 '+(lastP-pcts[pcts.length-2])+'%p 상승에 그쳤습니다. 사전검토 '+pre+'건 잔여.'};}
  var prev=weeks[weeks.length-2];var pd=(ls.Done||0)-((WMO_FAQ_WEEKS[prev].stats||{}).Done||0);
  return{level:'ok',msg:'<b>진행 양호</b> — 전주차('+prev+') 대비 '+pd+'건 진행되어 '+(lastP-pcts[pcts.length-2])+'%p 상승했습니다 (현재 '+lastP+'%). 잔여 사전검토 '+pre+'건.'};
}

function buildWmoFaqWeeklyChart() {
  var weeks=Object.keys(WMO_FAQ_WEEKS).sort(); if(!weeks.length)return '';
  var series=[{key:'pre',label:'사전검토',color:SC['Pre-Review'].dot},{key:'wip',label:'작업중',color:SC['In Progress'].dot},{key:'corp',label:'법인리뷰',color:SC['Corp. Review'].dot},{key:'done',label:'완료',color:SC['Done'].dot}];
  var wkData=weeks.map(function(wk){var s=WMO_FAQ_WEEKS[wk].stats||{};return{wk:wk,pre:s['Pre-Review']||0,wip:s['In Progress']||0,corp:s['Corp. Review']||0,done:s.Done||0,total:s.Total||0};});
  var maxV=0;wkData.forEach(function(d){maxV=Math.max(maxV,d.total||0);});
  var yMax=maxV||2;var chartH=170;
  var grid='',yLabels='';
  for(var g=0;g<=4;g++){var val=Math.round(yMax*g/4),bottom=(val/yMax)*chartH;grid+='<div style="position:absolute;left:0;right:0;bottom:'+bottom+'px;border-top:1px solid #F0F1F8"></div>';yLabels+='<div style="position:absolute;right:0;bottom:'+(bottom-6)+'px;font-size:9px;color:#9BA3BF;font-weight:600">'+val+'건</div>';}
  var groups=wkData.map(function(d){var pct=d.total>0?Math.round(d.done/d.total*100):0;var bars=series.map(function(se){var v=d[se.key];var h=Math.max(Math.round((v/yMax)*chartH),v>0?2:0);return '<div data-wk="'+d.wk+'" data-pct="'+pct+'" data-label="'+se.label+'" data-val="'+v+'" data-color="'+se.color+'" onmouseenter="bgBarTip(event)" onmousemove="bgBarTip(event)" onmouseleave="bgBarTipHide()" onmouseover="this.style.opacity=0.75" onmouseout="this.style.opacity=1" style="width:11px;height:'+h+'px;background:'+se.color+';border-radius:3px 3px 0 0;cursor:pointer;transition:opacity .15s"></div>';}).join('');return '<div style="flex:1;height:100%;display:flex;align-items:flex-end;justify-content:center;gap:3px">'+bars+'</div>';}).join('');
  var weekLabels=wkData.map(function(d){var active=(d.wk===wmoWeek);return '<div onclick="setWmoFaqWeek(\'' + d.wk + '\')" style="flex:1;text-align:center;font-size:11px;font-weight:'+(active?'800':'600')+';color:'+(active?'#A50034':'#6B7280')+';cursor:pointer">'+d.wk+'</div>';}).join('');
  var legend=series.map(function(se){return '<span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:#6B7280"><span style="width:12px;height:12px;border-radius:3px;background:'+se.color+'"></span>'+se.label+'</span>';}).join('');
  var ins=wmoWeeklyInsight();var banner='';
  if(ins){var bc={warn:{bg:'#FEF6F0',bd:'#F59E0B',tc:'#92400E'},caution:{bg:'#FFFBEB',bd:'#FBBF24',tc:'#92400E'},ok:{bg:'#F0FDF4',bd:'#22C55E',tc:'#166534'}}[ins.level];banner='<div style="background:'+bc.bg+';border:1px solid '+bc.bd+'33;border-left:3px solid '+bc.bd+';border-radius:8px;padding:10px 14px;margin-top:14px;font-size:11.5px;color:'+bc.tc+';line-height:1.5;display:flex;align-items:flex-start">'+(ins.level==='ok'?okIcon(bc.bd):warnIcon(bc.bd))+'<span>'+ins.msg+'</span></div>';}
  return '<div style="background:#fff;border:1px solid #E8EAF2;border-radius:14px;padding:16px 20px;flex:1;min-width:340px"><div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px"><div><div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#1A1D2E;text-transform:uppercase">주차별 현황</div><div style="font-size:10px;color:#9BA3BF;font-weight:600">WEEKLY PROGRESS</div></div><span style="font-size:11px;font-weight:800;color:#fff;background:#A50034;padding:3px 10px;border-radius:6px">2026</span></div><div style="display:flex;gap:8px;margin-top:18px"><div style="position:relative;width:34px;height:'+chartH+'px;flex-shrink:0">'+yLabels+'</div><div style="position:relative;flex:1;height:'+chartH+'px">'+grid+'<div style="position:absolute;left:0;right:0;bottom:0;top:0;display:flex;align-items:flex-end">'+groups+'</div></div></div><div style="display:flex;gap:8px;margin-top:8px"><div style="width:34px;flex-shrink:0"></div><div style="flex:1;display:flex">'+weekLabels+'</div></div><div style="display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:18px;padding-top:12px;border-top:1px solid #F0F1F8">'+legend+'</div>'+banner+'</div>';
}

function renderWmoFaq(area) {
  var d = DATA.wmo_faq;
  var allItems = d.items || [];
  var items = allItems.slice();
  if (currentTab !== 'all') items = items.filter(function(x){ return x.status === currentTab; });
  if (filterRegion) items = items.filter(function(x){ return (x.region||'').toUpperCase() === filterRegion.toUpperCase(); });

  var panel = '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:14px">' + buildCountryVariation(wmoCountryRows(allItems)) + buildWmoFaqWeeklyChart() + '</div>';

  var hdrRow = '<th style="vertical-align:middle;white-space:nowrap;width:130px">Region</th>' +
    '<th style="vertical-align:middle;white-space:nowrap;width:200px;text-align:left;padding-left:10px">Country</th>' +
    '<th style="vertical-align:middle;width:100px;text-align:center">Status</th>' +
    '<th style="vertical-align:middle;width:auto"></th>' +
    '<th style="vertical-align:middle;width:90px;text-align:center">Pg#</th>' + damHeadTh();

  var REGION_ORDER2 = ['EU','ASIA','MEA','LATAM'];
  var groups2 = {}; var ord2 = [];
  for (var i=0;i<items.length;i++){ var rg=(items[i].region||'Other').toUpperCase(); if(!groups2[rg]){groups2[rg]=[];ord2.push(rg);} groups2[rg].push(items[i]); }
  var sorted2=[]; for(var ro=0;ro<REGION_ORDER2.length;ro++){ if(groups2[REGION_ORDER2[ro]])sorted2.push(REGION_ORDER2[ro]); }
  for(var ro2=0;ro2<ord2.length;ro2++){ if(sorted2.indexOf(ord2[ro2])===-1)sorted2.push(ord2[ro2]); }

  var rows=[];
  for (var sri=0;sri<sorted2.length;sri++){
    var region=sorted2[sri]; var ritems=groups2[region]; if(!ritems||!ritems.length)continue;
    var rcfg=REGION_CFG[region]||{label:region,bg:'#F5F6FA',tc:'#6B7280',border:'#E0E4F0'};
    for (var ii=0;ii<ritems.length;ii++){
      var item=ritems[ii];
      var statusCell;
      if (item.status==='Done'){ var dot='<span style="display:inline-block;width:13px;height:13px;border-radius:50%;background:#22C55E"></span>'; statusCell=item.url?'<a href="'+item.url+'" target="_blank" rel="noopener" title="'+item.url+'" style="display:inline-flex;align-items:center;justify-content:center;cursor:pointer">'+dot+'</a>':dot; }
      else if (item.status==='Corp. Review') statusCell='<span style="font-size:10px;font-weight:800;color:#F59E0B">법인리뷰</span>';
      else if (item.status==='Cancel') statusCell='<span style="font-size:10px;font-weight:800;color:#F59E0B">Cancel</span>';
      else if (item.status==='In Progress') statusCell='<span style="font-size:10px;font-weight:700;color:#3B82F6">작업중</span>';
      else statusCell='<span style="font-size:10px;color:#94A3B8">사전검토</span>';
      var pgCell='<span style="font-size:11px;color:#1A1D2E;font-weight:700">'+(item.pages||0)+'</span>';
     
      var regionCell='';
      if(ii===0) regionCell='<td rowspan="'+ritems.length+'" style="width:130px;text-align:center;font-size:10px;font-weight:800;background:'+rcfg.bg+';color:'+rcfg.tc+';border-right:2px solid '+rcfg.border+';vertical-align:middle;white-space:nowrap">'+rcfg.label+'</td>';
      rows.push('<tr>'+regionCell+
        '<td style="font-weight:600;color:#1A1D2E;font-size:11px;white-space:nowrap;width:200px;padding-left:10px">'+(item.country||item.locale)+'</td>'+
        '<td style="text-align:center;width:100px">'+statusCell+'</td>'+
        '<td style="width:auto"></td>'+
        '<td style="text-align:center;width:90px">'+pgCell+'</td>'+
      damCellTd() + '</tr>');
    }
  }

  var tableHtml='<div style="background:#fff;border:1px solid #E8EAF2;border-radius:14px;padding:16px 20px 8px">'+
    '<div style="margin-bottom:12px"><div style="font-size:10px;font-weight:700;letter-spacing:.1em;color:#1A1D2E;text-transform:uppercase">Full Data Table</div><div style="font-size:14px;font-weight:700;color:#1A1D2E;margin-top:2px">국가별 현황 ('+items.length+'개 프로젝트)</div></div>'+
    buildNewBanner()+buildActionBanner()+
    '<div class="art-table-wrap" style="overflow-x:auto"><table class="art-table"><thead><tr>'+hdrRow+'</tr></thead><tbody>'+(rows.join('')||'<tr><td colspan="99" style="padding:30px;color:#9BA3BF;text-align:center">검색 결과가 없습니다</td></tr>')+'</tbody></table></div>'+
  '</div>';

  area.innerHTML = panel + buildFilterBarHtml() + buildTabBarHtml(items.length) + tableHtml;
}

// ── FaqHub 주차 선택 ─────────────────────────────────────

function renderSimple(area, key) {
  const d = DATA[key];
  const allSimple = d.items || [];
  let items = allSimple.slice();
  if (currentTab !== 'all') items = items.filter(x => (x.status||x.overall) === currentTab);
  if (filterRegion) items = items.filter(x => (x.region||'').toUpperCase() === filterRegion.toUpperCase());


  if (!items.length) { area.innerHTML = buildFilterBarHtml() + buildTabBarHtml(0) + emptyHtml(); return; }

  // 로케일 표시용: BG 규칙 (AU-en→AU, SA-ar→SA_ar)
  function buildLocaleMap(arr) {
    const cc = {};
    arr.forEach(x => {
      let l = x.locale || '';
      if (l.includes(' - ')) l = l.split(' - ').pop();
      const base = l.split('-')[0].toUpperCase();
      if (!cc[base]) cc[base] = [];
      cc[base].push(l);
    });
    const map = {};
    arr.forEach(x => {
      let l = x.locale || '';
      const full = l;
      if (l.includes(' - ')) l = l.split(' - ').pop();
      const base = l.split('-')[0].toUpperCase();
      if (cc[base] && cc[base].length > 1) {
        map[full] = l.replace('-','_');  // SA-ar → SA_ar
      } else {
        map[full] = base;  // AU-en → AU
      }
    });
    return map;
  }
  const locMap = buildLocaleMap(allSimple);
  function shortLocale(x) { return locMap[x.locale] || x.locale || '-'; }
  function regionLabel(x) {
    if (x.region) return x.region;
    let l = x.locale || '';
    if (l.includes(' - ')) return l.split(' - ')[0].replace('LGE ','').trim();
    return '-';
  }

  // 통일 컬럼: Region | Locale | Status | Progress | DAM
  const hdrs = '<th>Region</th><th style="text-align:left">Locale</th><th>Status</th><th>Progress</th><th>DAM</th>';
  const damUrl = d.dam || '';

  const rows = items.map(x => {
    const st = x.status || x.overall || 'Pre-Review';
    const cfg = SC[st] || SC['Pre-Review'];
    const pages = x.pages ? parseInt(x.pages) : 0;
    const pct = st==='Done'?100 : st==='Corp. Review'?75 : st==='In Progress'?50 : 0;
    const cnts = {};
    cnts[st] = 1;
    const damCell = st==='Done' && damUrl
      ? `<td><a href="${damUrl}" target="_blank" class="dam-btn">DAM</a></td>`
      : `<td></td>`;

    return `<tr>
      <td style="color:#9BA3BF">${regionLabel(x)}</td>
      <td style="font-weight:800;color:#1A1D2E">${shortLocale(x)}</td>
      <td><span class="s-badge" style="background:${cfg.bg};color:${cfg.tc}">${cfg.label}</span></td>
      <td>
        <div style="display:inline-flex;flex-direction:column;gap:3px">
          <div style="display:flex;justify-content:space-between;font-size:9px;width:120px">
            <span style="color:#9BA3BF">${pages ? pages+'pg' : cfg.label}</span>
            <span style="color:${cfg.tc};font-weight:700">${pct}%</span>
          </div>
          <div style="width:120px">${buildSegmentedBar(cnts, {compact:true})}</div>
        </div>
      </td>
      ${damCell}
    </tr>`;
  }).join('');

  // 검색 드롭다운
  const searchOpts = allSimple
    .slice()
    .sort((a,b) => (shortLocale(a)).localeCompare(shortLocale(b)))
    .map(x => {
      const sl = shortLocale(x);
      return `<option value="${sl}" ${bgSearchQuery===sl?'selected':''}>${sl}</option>`;
    })
    .join('');

  area.innerHTML = buildFilterBarHtml() + buildTabBarHtml(items.length) + `
  <div style="background:#fff;border:1px solid #E8EAF2;border-radius:14px;padding:16px 20px 8px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px">
      <div>
        <div style="font-size:10px;font-weight:700;letter-spacing:.1em;color:#1A1D2E;text-transform:uppercase">Full Data Table</div>
        <div style="font-size:14px;font-weight:700;color:#1A1D2E;margin-top:2px">전체 데이터 (${items.length}건)</div>
      </div>
      
    </div>
    <div class="art-table-wrap fade-in">
      <table class="art-table">
        <thead><tr>${hdrs}</tr></thead>
        <tbody>${rows || '<tr><td colspan="10" style="padding:30px;color:#9BA3BF;text-align:center">검색 결과가 없습니다</td></tr>'}</tbody>
      </table>
    </div>
  </div>`;
}

// ── RELIABILITY GALLERY ───────────────────────────────────────
function renderReliability(area) {
  const d = DATA.reliability;
  let items = d.items || [];
  if (filterRegion) items = items.filter(x => x.locale === filterRegion);
  // recCount는 buildTabBarHtml(items.length)로 전달됨

  const hdrs = '<th>Locale</th><th>Certificate</th><th>Logo</th><th>Category</th><th>Model</th><th>Upload Date</th><th>기존</th><th>URL</th>';
  const rows = items.map(x => `<tr>
    <td style="font-weight:700;color:#1A1D2E">${x.locale}</td>
    <td style="color:#6B7280;font-size:10px">${x.cert}</td>
    <td><span style="background:#ECFDF5;color:#047857;font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px">${x.logo}</span></td>
    <td style="font-size:10px;color:#4A5280">${x.category}</td>
    <td style="font-size:10px;font-weight:600;color:#1A1D2E">${x.model}</td>
    <td style="color:#9BA3BF;font-size:10px">${x.date||'-'}</td>
    <td style="text-align:center">${x.existing?`<span style="color:#10B981;font-weight:700">${x.existing}</span>`:'-'}</td>
    <td>${x.url?`<a href="${x.url}" target="_blank" style="color:#3B82F6;font-size:10px">🔗 Link</a>`:'-'}</td>
  </tr>`).join('');

  area.innerHTML = buildFilterBarHtml() + buildTabBarHtml(items.length) + `<div class="simple-table-wrap fade-in">
    <table class="simple-table">
      <thead><tr>${hdrs}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function emptyHtml() {
  return '<div class="empty"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><br>검색 결과가 없습니다</div>';
}

function exportReport() {
  alert('현재 탭 데이터를 CSV로 내보내는 기능은 준비 중입니다.');
}

// ── INIT ─────────────────────────────────────────────────────

// Country full-name map must be initialized before dashboardInit() renders the sheet-driven table.
// Some sheet tables render during dashboardInit(), while the helper functions are declared later in this file.
// Keeping this map available early prevents "Cannot read properties of undefined" errors for values like UK.
var COUNTRY_FULLNAME_DISPLAY_MAP = window.COUNTRY_FULLNAME_DISPLAY_MAP || {
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
window.COUNTRY_FULLNAME_DISPLAY_MAP = COUNTRY_FULLNAME_DISPLAY_MAP;

function dashboardInit() {
  if (window.__dashboardInitDone) return;
  window.__dashboardInitDone = true;
  // 접근 인증 체크
  (function(){
    var lock = document.getElementById('lockScreen');
    var app = document.querySelector('.app');
    var authed = false;
    try { authed = sessionStorage.getItem(ACCESS_KEY) === 'true'; } catch(e){}
    if (authed) {
      if (lock) { lock.classList.add('hidden'); lock.style.display = 'none'; }
      if (app) app.style.display = '';
    } else {
      if (app) app.style.display = 'none';
      if (lock) {
        lock.classList.remove('hidden');
        lock.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }
      setTimeout(function(){ var p=document.getElementById('lockPassword'); if(p) p.focus(); }, 200);
    }
  })();
  if (window.__DASHBOARD_KEYS && window.__DASHBOARD_KEYS.length) {
    currentKey = window.__DASHBOARD_KEYS[0];
    document.querySelectorAll('.nav-item').forEach(function(n, i) { n.classList.toggle('active', i === 0); });
  }
  updateHQ();
  updateTopbarTitle();
  if (typeof updateNewContentVisibility==='function') updateNewContentVisibility(typeof currentWeek!=='undefined'?currentWeek:AUTO_WEEK);
  renderContent();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', dashboardInit);
} else {
  dashboardInit();
}

// 로그아웃 버튼: onclick 외에 직접 이벤트 리스너 추가 (iOS Safari/webview 호환)
(function attachLogoutHandler(){
  const btn = document.getElementById('logoutBtn');
  if (!btn) return;
  ['click','touchend'].forEach(function(evt){
    btn.addEventListener(evt, function(e){
      e.preventDefault();
      e.stopPropagation();
      logout();
    }, { passive: false });
  });
})();

/* ===== moved from inline <script> block 2 ===== */

// ── 주간 종합 리포트 (회의록/Jira 붙여넣기용) ───────────────
/* REPORT_KEYS 데이터는 json.js로 분리됨 */

function reportRows() {
  var wk = (typeof currentWeek!=='undefined') ? currentWeek : AUTO_WEEK;
  var rows = [];
  for (var i=0;i<REPORT_KEYS.length;i++){
    var k = REPORT_KEYS[i];
    if (!DATA[k]) continue;
    // 신규 콘텐츠(해당 주차에 없는 것)는 제외
    if (typeof NEW_CONTENT_WEEKS!=='undefined' && NEW_CONTENT_WEEKS[k] && !NEW_CONTENT_WEEKS[k][wk]) continue;
    var cs = contentStats(k);
    var unit = (typeof pagesTabs!=='undefined' && pagesTabs[k]) ? '페이지' : (k==='article_list'?'건':'개국');
    var total = cs.total||0, done = cs.Done||0;
    var pct = total>0 ? Math.round(done/total*100) : 0;
    rows.push({
      key:k, title:DATA[k].title, unit:unit,
      total:total, done:done, corp:cs['Corp. Review']||0,
      wip:cs['In Progress']||0, pre:cs['Pre-Review']||0, pct:pct
    });
  }
  return rows;
}
// 주차별 전체 합계 (특정 주차 stats 기준)
function overallForWeek(wk) {
  var MAP = {
    buying_guide: (typeof BG_WEEKS!=='undefined'?BG_WEEKS:null),
    article_list: (typeof ARTICLE_WEEKS!=='undefined'?ARTICLE_WEEKS:null),
    ice_solution: (typeof ICE_WEEKS!=='undefined'?ICE_WEEKS:null),
    microsite: (typeof MICROSITE_WEEKS!=='undefined'?MICROSITE_WEEKS:null),
    alttext: (typeof ALTTEXT_WEEKS!=='undefined'?ALTTEXT_WEEKS:null),
    faq_hub: (typeof FAQ_WEEKS!=='undefined'?FAQ_WEEKS:null),
    pdp_gallery: (typeof PDP_WEEKS!=='undefined'?PDP_WEEKS:null),
    vacuum: (typeof VACUUM_WEEKS!=='undefined'?VACUUM_WEEKS:null),
    wmo_faq: (typeof WMO_FAQ_WEEKS!=='undefined'?WMO_FAQ_WEEKS:null)
  };
  var done=0, total=0;
  for (var k in MAP){
    var W = MAP[k]; if (!W || !W[wk]) continue;
    var st = W[wk].stats || {};
    done += (st.Done||0); total += (st.Total||0);
  }
  return { done:done, total:total, pct: total>0?Math.round(done/total*100):0 };
}
function prevWeekOf(wk) {
  var all = {};
  ['BG_WEEKS','ARTICLE_WEEKS','ICE_WEEKS','MICROSITE_WEEKS','ALTTEXT_WEEKS','FAQ_WEEKS','PDP_WEEKS','VACUUM_WEEKS','WMO_FAQ_WEEKS'].forEach(function(nm){
    try { var o = eval(nm); if (o) Object.keys(o).forEach(function(w){ all[w]=1; }); } catch(e){}
  });
  var weeks = Object.keys(all).sort();
  var idx = weeks.indexOf(wk);
  return idx>0 ? weeks[idx-1] : null;
}
// 종합 의견 자동 생성
function buildReportOpinion() {
  var wk = (typeof currentWeek!=='undefined') ? currentWeek : AUTO_WEEK;
  var rows = reportRows();
  var cur = overallForWeek(wk);
  var prevWk = prevWeekOf(wk);
  var prog;
  if (prevWk) {
    var prev = overallForWeek(prevWk);
    var delta = cur.pct - prev.pct;
    if (delta <= 0) prog = '이번 주차('+wk+') 전체 진행률은 '+cur.pct+'%로, 지난 주차('+prevWk+', '+prev.pct+'%) 대비 진척이 없습니다.';
    else prog = '이번 주차('+wk+') 전체 진행률은 '+cur.pct+'%로, 지난 주차('+prevWk+', '+prev.pct+'%) 대비 '+delta+'%p 상승했습니다.';
  } else {
    prog = '이번 주차('+wk+') 전체 진행률은 '+cur.pct+'%입니다.';
  }
  var preList = rows.filter(function(r){ return r.pre>0; }).map(function(r){ return r.title; });
  var wipList = rows.filter(function(r){ return r.wip>0; }).map(function(r){ return r.title; });
  var s = '【종합 의견】\n';
  s += '- ' + prog + '\n';
  if (preList.length) s += '- 사전검토 단계에 머물러 있는 콘텐츠('+preList.join(', ')+')는 법인(WPL) 검토가 진행되지 않은 건으로, 본부에서 해당 법인에 검토·진행 독려가 필요합니다.\n';
  if (wipList.length) s += '- 작업중(진행) 단계의 콘텐츠('+wipList.join(', ')+')는 정상 완료될 수 있도록 CNX에서 WPL에 지속적으로 진행을 요청할 예정입니다.\n';
  return s;
}

function fmt(n){ return (n||0).toLocaleString('en-US'); }

// 보고용 비주얼 요약
function buildReportVisual() {
  var wk = (typeof currentWeek!=='undefined') ? currentWeek : AUTO_WEEK;
  var rows = reportRows();
  var tDone=0, tTotal=0, tPre=0;
  rows.forEach(function(r){ tDone+=r.done; tTotal+=r.total; tPre+=r.pre; });
  var oPct = tTotal>0?Math.round(tDone/tTotal*100):0;

  var cards = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">' +
    '<div style="background:#FAFBFC;border:1px solid #E8EAF2;border-radius:10px;padding:14px"><div style="font-size:10px;font-weight:700;color:#9BA3BF;letter-spacing:.05em">전체 진행률</div><div style="font-size:24px;font-weight:800;color:#A50034;margin-top:4px">'+oPct+'%</div><div style="font-size:10px;color:#6B7280;margin-top:2px">'+fmt(tDone)+' / '+fmt(tTotal)+'</div></div>' +
    '<div style="background:#FAFBFC;border:1px solid #E8EAF2;border-radius:10px;padding:14px"><div style="font-size:10px;font-weight:700;color:#9BA3BF;letter-spacing:.05em">콘텐츠 수</div><div style="font-size:24px;font-weight:800;color:#1A1D2E;margin-top:4px">'+rows.length+'</div><div style="font-size:10px;color:#6B7280;margin-top:2px">운영 콘텐츠 유형</div></div>' +
    '<div style="background:#FFF8F0;border:1px solid #F59E0B33;border-radius:10px;padding:14px"><div style="font-size:10px;font-weight:700;color:#B45309;letter-spacing:.05em">독려 필요(사전검토)</div><div style="font-size:24px;font-weight:800;color:#F59E0B;margin-top:4px">'+fmt(tPre)+'</div><div style="font-size:10px;color:#92400E;margin-top:2px">법인 검토 대기</div></div>' +
  '</div>';

  var head = '<tr style="background:#2D2D2D;color:#fff">' +
    '<th style="text-align:left;padding:9px 12px;font-size:11px;font-weight:700">콘텐츠</th>' +
    '<th style="padding:9px 8px;font-size:11px">진행률</th>' +
    '<th style="padding:9px 8px;font-size:11px">완료</th>' +
    '<th style="padding:9px 8px;font-size:11px">법인리뷰</th>' +
    '<th style="padding:9px 8px;font-size:11px">작업중</th>' +
    '<th style="padding:9px 8px;font-size:11px">사전검토</th>' +
    '<th style="padding:9px 8px;font-size:11px">합계</th></tr>';
  var body = rows.map(function(r){
    var barColor = r.pct>=70?'#22C55E':r.pct>=40?'#F59E0B':'#A50034';
    return '<tr style="border-bottom:1px solid #F0F1F8">' +
      '<td style="text-align:left;padding:8px 12px;font-size:11px;font-weight:700;color:#1A1D2E">'+r.title+'</td>' +
      '<td style="padding:8px 8px;text-align:center"><div style="display:flex;align-items:center;gap:6px;justify-content:center"><div style="width:54px;height:6px;border-radius:3px;background:#EEF0F5;overflow:hidden"><div style="width:'+r.pct+'%;height:100%;background:'+barColor+'"></div></div><span style="font-size:11px;font-weight:800;color:'+barColor+'">'+r.pct+'%</span></div></td>' +
      '<td style="padding:8px 8px;text-align:center;font-size:11px;color:#22C55E;font-weight:700">'+fmt(r.done)+'</td>' +
      '<td style="padding:8px 8px;text-align:center;font-size:11px;color:#F59E0B;font-weight:700">'+fmt(r.corp)+'</td>' +
      '<td style="padding:8px 8px;text-align:center;font-size:11px;color:#3B82F6;font-weight:700">'+fmt(r.wip)+'</td>' +
      '<td style="padding:8px 8px;text-align:center;font-size:11px;color:#94A3B8;font-weight:700">'+fmt(r.pre)+'</td>' +
      '<td style="padding:8px 8px;text-align:center;font-size:11px;font-weight:800;color:#1A1D2E">'+fmt(r.total)+'</td>' +
    '</tr>';
  }).join('');

  return cards + '<table style="border-collapse:collapse;width:100%;border:1px solid #E8EAF2;border-radius:10px;overflow:hidden">' +
    '<thead>'+head+'</thead><tbody>'+body+'</tbody></table>';
}

// Jira 마크업 텍스트
function buildReportJira() {
  var wk = (typeof currentWeek!=='undefined') ? currentWeek : AUTO_WEEK;
  var rows = reportRows();
  var tDone=0,tTotal=0,tPre=0; rows.forEach(function(r){tDone+=r.done;tTotal+=r.total;tPre+=r.pre;});
  var oPct = tTotal>0?Math.round(tDone/tTotal*100):0;
  var opEl = document.getElementById('weeklyReportOpinion');
  var opinion = (opEl && opEl.value) ? opEl.value : buildReportOpinion();
  var s = 'h2. LG.com 글로벌 콘텐츠 운영 현황 ('+wk+')\n\n';
  if (opinion) { s += '{panel:title=종합 의견|borderStyle=solid|borderColor=#A50034|titleBGColor=#A50034|titleColor=#fff}\n' + opinion + '{panel}\n\n'; }
  s += '*전체 진행률:* '+oPct+'% ('+fmt(tDone)+'/'+fmt(tTotal)+') | *운영 콘텐츠:* '+rows.length+'종 | *독려 필요(사전검토):* '+fmt(tPre)+'\n\n';
  s += '||콘텐츠||진행률||완료||법인리뷰||작업중||사전검토||합계||\n';
  rows.forEach(function(r){
    s += '|'+r.title+'|'+r.pct+'%|'+fmt(r.done)+'|'+fmt(r.corp)+'|'+fmt(r.wip)+'|'+fmt(r.pre)+'|'+fmt(r.total)+'|\n';
  });
  // 독려 대상 요약
  s += '\nh3. 본부 액션 필요 (사전검토 독려 대상)\n';
  REPORT_KEYS.forEach(function(k){
    if (!DATA[k]) return;
    if (typeof NEW_CONTENT_WEEKS!=='undefined' && NEW_CONTENT_WEEKS[k] && !NEW_CONTENT_WEEKS[k][wk]) return;
    var pre = (typeof getPreReviewItems==='function') ? getPreReviewItems(k) : [];
    if (!pre.length) return;
    var names = pre.map(function(it){ return (typeof nameOfItem==='function')?nameOfItem(k,it):(it.country||it.locale||it.title); });
    s += '* *'+DATA[k].title+'* ('+pre.length+'): '+names.slice(0,25).join(', ')+(names.length>25?(' 외 '+(names.length-25)):'')+'\n';
  });
  return s;
}

// 일반 텍스트(TSV) — Excel/메일 표 붙여넣기
function buildReportTSV() {
  var rows = reportRows();
  var opEl = document.getElementById('weeklyReportOpinion');
  var opinion = (opEl && opEl.value) ? opEl.value : buildReportOpinion();
  var s = '';
  if (opinion) s += opinion + '\n';
  s += '콘텐츠\t진행률(%)\t완료\t법인리뷰\t작업중\t사전검토\t합계\n';
  rows.forEach(function(r){
    s += r.title+'\t'+r.pct+'\t'+r.done+'\t'+r.corp+'\t'+r.wip+'\t'+r.pre+'\t'+r.total+'\n';
  });
  return s;
}

function openWeeklyReport() {
  var wk = (typeof currentWeek!=='undefined') ? currentWeek : AUTO_WEEK;
  var sub = document.getElementById('weeklyReportSub');
  if (sub) sub.textContent = wk + ' 기준 · 전체 콘텐츠 종합';
  var vis = document.getElementById('weeklyReportVisual');
  if (vis) vis.innerHTML = buildReportVisual();
  var op = document.getElementById('weeklyReportOpinion');
  if (op && !op.value.trim()) op.value = buildReportOpinion();
  var ta = document.getElementById('weeklyReportText');
  if (ta) ta.value = buildReportJira();
  setReportMode('jira');
  syncOpinionView();
  setReportView('report');
  var ov = document.getElementById('weeklyReportModal');
  if (ov) ov.style.display='flex';
}
function closeWeeklyReport(){ var ov=document.getElementById('weeklyReportModal'); if(ov)ov.style.display='none'; }
function syncReportText(){ var tab=document.getElementById('rptTab_tsv'); var isTsv=tab && tab.style.background==='rgb(165, 0, 52)'; var t=document.getElementById('weeklyReportText'); if(t) t.value=isTsv?buildReportTSV():buildReportJira(); }
function syncOpinionView(){
  var op = document.getElementById('weeklyReportOpinion');
  var view = document.getElementById('reportOpinionText');
  if (op && view) view.textContent = op.value || '';
}
function setReportView(mode){
  var isReport = (mode === 'report');
  var rOnly = document.getElementById('reportOpinionView');
  var adminCard = document.getElementById('adminOpinionCard');
  var copySec = document.getElementById('reportCopySection');
  if (rOnly) rOnly.style.display = isReport ? '' : 'none';
  if (adminCard) adminCard.style.display = isReport ? 'none' : '';
  if (copySec) copySec.style.display = isReport ? 'none' : '';
  // 토글 버튼 스타일
  var rb = document.getElementById('rptView_report');
  var ab = document.getElementById('rptView_admin');
  if (rb){ rb.style.background = isReport?'#A50034':'transparent'; rb.style.color = isReport?'#fff':'#6B7280'; }
  if (ab){ ab.style.background = isReport?'transparent':'#A50034'; ab.style.color = isReport?'#6B7280':'#fff'; }
  if (isReport) syncOpinionView();
}
function setReportMode(mode){
  var ta = document.getElementById('weeklyReportText');
  if (ta) ta.value = (mode==='tsv') ? buildReportTSV() : buildReportJira();
  ['jira','tsv'].forEach(function(m){
    var b=document.getElementById('rptTab_'+m);
    if(b){ var on=(m===mode); b.style.background=on?'#A50034':'#fff'; b.style.color=on?'#fff':'#4A5280'; b.style.borderColor=on?'#A50034':'#E0E4F0'; }
  });
}
function buildReportEmailHtml() {
  var wk = (typeof currentWeek!=='undefined') ? currentWeek : AUTO_WEEK;
  var rows = reportRows();
  var opEl = document.getElementById('weeklyReportOpinion');
  var opinion = (opEl && opEl.value) ? opEl.value : (typeof buildReportOpinion==='function'?buildReportOpinion():'');
  var tDone=0,tTotal=0,tPre=0; rows.forEach(function(r){tDone+=r.done;tTotal+=r.total;tPre+=r.pre;});
  var oPct = tTotal>0?Math.round(tDone/tTotal*100):0;
  function fmtN(n){ return (n||0).toLocaleString('en-US'); }
  var h = '<div style="font-family:Malgun Gothic,Apple SD Gothic Neo,sans-serif;color:#1A1D2E">';
  h += '<h3 style="margin:0 0 10px;font-size:16px">LG.com 글로벌 콘텐츠 운영 현황 ('+wk+')</h3>';
  h += '<p style="margin:0 0 12px;font-size:13px;color:#444"><b>전체 진행률 '+oPct+'%</b> ('+fmtN(tDone)+'/'+fmtN(tTotal)+') &nbsp;|&nbsp; 운영 콘텐츠 '+rows.length+'종 &nbsp;|&nbsp; 독려 필요(사전검토) '+fmtN(tPre)+'</p>';
  if (opinion) {
    h += '<div style="border-left:4px solid #A50034;background:#FFF7F9;padding:10px 14px;margin:0 0 14px;font-size:13px;line-height:1.7;white-space:pre-wrap">'+opinion.replace(/</g,'&lt;')+'</div>';
  }
  h += '<table style="border-collapse:collapse;font-size:13px;width:100%;max-width:760px" border="1" cellspacing="0" cellpadding="6">';
  h += '<thead><tr style="background:#2D2D2D;color:#fff"><th align="left">콘텐츠</th><th>진행률</th><th>완료</th><th>법인리뷰</th><th>작업중</th><th>사전검토</th><th>합계</th></tr></thead><tbody>';
  rows.forEach(function(r){
    var col = r.pct>=70?'#1A8F4C':r.pct>=40?'#C77700':'#A50034';
    h += '<tr>'+
      '<td align="left" style="font-weight:bold">'+r.title+'</td>'+
      '<td align="center" style="font-weight:bold;color:'+col+'">'+r.pct+'%</td>'+
      '<td align="center">'+fmtN(r.done)+'</td>'+
      '<td align="center">'+fmtN(r.corp)+'</td>'+
      '<td align="center">'+fmtN(r.wip)+'</td>'+
      '<td align="center">'+fmtN(r.pre)+'</td>'+
      '<td align="center" style="font-weight:bold">'+fmtN(r.total)+'</td>'+
    '</tr>';
  });
  h += '</tbody></table></div>';
  return h;
}
function copyReportEmail() {
  var html = buildReportEmailHtml();
  // 플레인 텍스트 폴백 = TSV
  var plain = (typeof buildReportTSV==='function') ? buildReportTSV() : html.replace(/<[^>]+>/g,'');
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      var item = new ClipboardItem({
        'text/html': new Blob([html], {type:'text/html'}),
        'text/plain': new Blob([plain], {type:'text/plain'})
      });
      navigator.clipboard.write([item]).then(function(){
        if (typeof showToast==='function') showToast('메일용 표가 복사되었습니다. 메일 본문에 붙여넣으세요.');
      }).catch(function(){ fallbackCopyHtml(html); });
    } else { fallbackCopyHtml(html); }
  } catch(e){ fallbackCopyHtml(html); }
}
function fallbackCopyHtml(html){
  // execCommand 기반 리치 복사 (임시 contenteditable)
  var div = document.createElement('div');
  div.contentEditable = 'true';
  div.style.position='fixed'; div.style.left='-9999px'; div.style.opacity='0';
  div.innerHTML = html;
  document.body.appendChild(div);
  var range = document.createRange(); range.selectNodeContents(div);
  var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
  try { document.execCommand('copy'); if (typeof showToast==='function') showToast('메일용 표가 복사되었습니다. 메일 본문에 붙여넣으세요.'); } catch(e){}
  sel.removeAllRanges(); document.body.removeChild(div);
}
function copyReportText(){
  var ta = document.getElementById('weeklyReportText');
  if (!ta) return;
  ta.select();
  try { copyToClipboard(ta.value); } catch(e){ document.execCommand('copy'); }
  if (typeof showToast==='function') showToast('복사되었습니다. 회의록·Jira에 붙여넣으세요.');
}

function openStatusBoard(){
  var pageUrl = '../lg-com-status-dashboard/';
  var win = window.open(pageUrl, '_blank');

  if (!win) {
    alert('팝업이 차단되었습니다. 브라우저 팝업 허용 후 다시 시도해주세요.');
    return;
  }

  try { win.focus(); } catch(e) {}
}

function openHsUrlList(){
  var pageUrl = '../hs-url-list/';
  var win = window.open(pageUrl, '_blank');

  if (!win) {
    alert('팝업이 차단되었습니다. 브라우저 팝업 허용 후 다시 시도해주세요.');
    return;
  }

  try { win.focus(); } catch(e) {}
}

function closeStatusBoard(){
  var ov = document.getElementById('statusBoardOverlay');
  if (ov){ ov.style.display='none'; document.body.style.overflow=''; }
}
document.addEventListener('keydown', function(e){ if(e.key==='Escape'){ closeStatusBoard(); if(typeof closeBgActionModal==='function') closeActionModal(); } });

/* ===== moved from inline <script> block 2 ===== */


// ── Google Sheet Published HTML raw table renderer ───────────
// Used when sheet-loader.js provides DATA[currentKey].tableHeaders/tableRows.
function renderSheetDrivenTable(area, d) {
  var headers = d.tableHeaders || [];
  var rows = (d.tableRows || []).slice();
  var items = (d.items || []).slice();

  // Google Sheet 탭 이름을 현재 화면 제목에 강제로 반영합니다.
  var displayTitle = getDashboardDisplayTitle(d);
  var topTitleEl = document.getElementById('topTitle');
  if (topTitleEl && displayTitle) topTitleEl.textContent = displayTitle;

  if (currentTab !== 'all') {
    rows = rows.filter(function(row, idx) {
      var item = items[idx] || {};
      return (item.overall || item.status || 'Pre-Review') === currentTab;
    });
  }

  if (filterRegion) {
    rows = rows.filter(function(row) {
      return normalizeDisplayRegion(row.Region || row.region || '') === filterRegion;
    });
  }

  var cs = contentStats(currentKey);
  var tabs = buildTabBarHtml();
  var filterHtml = buildSheetFilterBar(d, rows.length);
  var tableHtml = buildSheetDrivenTableHtml(headers, rows, d, filterHtml);

  area.insertAdjacentHTML('beforeend', tabs + tableHtml);
  if (window.SHEET_EXCEPTION_RULES && typeof window.SHEET_EXCEPTION_RULES.afterRender === 'function') {
    window.SHEET_EXCEPTION_RULES.afterRender({ area: area, sheet: d, currentKey: currentKey });
  }
  var skipCountryLocaleDisplay = !!(window.SHEET_EXCEPTION_RULES &&
    typeof window.SHEET_EXCEPTION_RULES.skipCountryLocaleDisplay === 'function' &&
    window.SHEET_EXCEPTION_RULES.skipCountryLocaleDisplay(d));
  if (!skipCountryLocaleDisplay && typeof postProcessCountryLocaleDisplay === 'function') {
    postProcessCountryLocaleDisplay(area);
  }
}

function buildSheetFilterBar(d, count) {
  var regions = getRegions();
  var regionOptions = regions.map(function(r) {
    return '<option value="' + escapeAttrSheet(r) + '"' + (filterRegion === r ? ' selected' : '') + '>' + escapeHtmlSheet(r) + '</option>';
  }).join('');

  return '' +
    '<div class="sheet-filter-row">' +
      '<div class="sheet-filter-left">' +
        '<strong>국가별 현황</strong>' +
      '</div>' +
      '<div class="sheet-filter-right">' +
        '<select class="filter-sel" onchange="filterRegion=this.value;renderTable()">' +
          '<option value=""' + (!filterRegion ? ' selected' : '') + '>All Region</option>' + regionOptions +
        '</select>' +
      '</div>' +
    '</div>';
}

function buildSheetDrivenTableHtml(headers, rows, sheetData, filterHtml) {
  if (!headers.length) {
    return '<div class="empty-state">표시할 데이터가 없습니다.</div>';
  }

  var d = sheetData || DATA[currentKey] || {};
  var exceptionRules = window.SHEET_EXCEPTION_RULES || null;
  var disableRegion = !!(exceptionRules && typeof exceptionRules.shouldDisableRegionColumn === 'function' && exceptionRules.shouldDisableRegionColumn(d));
  var displayHeaders = disableRegion
    ? (headers || []).filter(function(h) { return normalizeSheetHeaderName(h) !== 'region'; })
    : ensureRegionFirstHeaders(headers);
  var groupedRows = disableRegion
    ? [{ region: '', rows: rows || [] }]
    : groupRowsByRegion(rows, displayHeaders);
  var countryDisplayHeader = findCountryHeader(displayHeaders);
  var headerRowsForDisplay = disableRegion ? [] : (d.tableHeaderRows || []);
  var thead = buildSheetTableHead(displayHeaders, headerRowsForDisplay, d);

  var tbody = '';
  groupedRows.forEach(function(group) {
    group.rows.forEach(function(row, rowIdx) {
      var tds = displayHeaders.map(function(h, colIdx) {
        var value = row[h] || '';
        if (!disableRegion && colIdx === 0 && h === 'Region') {
          if (rowIdx > 0) return '';
          return '<td class="sheet-region-cell region-' + escapeAttrSheet(String(group.region || 'ETC').toLowerCase()) + '" rowspan="' + group.rows.length + '">' + escapeHtmlSheet(group.region || 'ETC') + '</td>';
        }
        var cellClasses = [];
        if (isCountryDisplayHeader(h) || (countryDisplayHeader && h === countryDisplayHeader)) {
          value = displayCountryFullName(value);
          cellClasses.push('sheet-country-col');
        }
        if (exceptionRules && typeof exceptionRules.getCellClass === 'function') {
          var extraClass = exceptionRules.getCellClass({ sheet: d, header: h, value: value, row: row, currentKey: currentKey });
          if (extraClass) cellClasses.push(extraClass);
        }
        var html = renderSheetCell(value, h, row, d);
        var bg = normalizeSheetCellBg(row.__styles && row.__styles[h]);
        var styleAttr = bg ? ' style="background:' + escapeAttrSheet(bg) + '"' : '';
        var classAttr = cellClasses.length ? ' class="' + cellClasses.join(' ') + '"' : '';
        return '<td' + classAttr + styleAttr + '>' + html + '</td>';
      }).join('');
      tbody += '<tr>' + tds + '</tr>';
    });
  });

  return '' +
    '<div class="sheet-table-card">' +
      (filterHtml || '') +
      '<div class="sheet-table-scroll">' +
        '<table class="sheet-data-table sheet-region-table">' +
          thead +
          '<tbody>' + tbody + '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';
}

function ensureRegionFirstHeaders(headers) {
  var out = (headers || []).filter(function(h) { return normalizeSheetHeaderName(h) !== 'region'; });
  return ['Region'].concat(out);
}

function groupRowsByRegion(rows, headers) {
  var order = ['EU', 'ASIA', 'CIS', 'LATAM', 'MEA', 'INDIA', 'NA', 'ETC'];
  var countryHeader = findCountryHeader(headers);
  var enriched = (rows || []).map(function(row, idx) {
    var copy = Object.assign({}, row);
    var country = countryHeader ? copy[countryHeader] : '';
    var region = normalizeDisplayRegion(copy.Region || inferRegionForDisplay(country) || 'ETC');
    copy.Region = region;
    copy.__idx = idx;
    return copy;
  });

  enriched.sort(function(a, b) {
    var ai = order.indexOf(a.Region); if (ai < 0) ai = 999;
    var bi = order.indexOf(b.Region); if (bi < 0) bi = 999;
    if (ai !== bi) return ai - bi;
    return a.__idx - b.__idx;
  });

  var groups = [];
  enriched.forEach(function(row) {
    var region = row.Region || 'ETC';
    var last = groups[groups.length - 1];
    if (!last || last.region !== region) {
      last = { region: region, rows: [] };
      groups.push(last);
    }
    last.rows.push(row);
  });
  return groups;
}

function findCountryHeader(headers) {
  var candidates = ['country', 'countryname', 'contry', '국가', 'pdpcountry', 'locale', 'market'];
  for (var i = 0; i < (headers || []).length; i++) {
    var n = normalizeSheetHeaderName(headers[i]);
    if (candidates.indexOf(n) >= 0) return headers[i];
    if (n.indexOf('country') >= 0) return headers[i];
  }
  return '';
}

function normalizeSheetHeaderName(value) {
  return String(value || '').toLowerCase().replace(/[\s_\-/.]+/g, '');
}

function normalizeDisplayRegion(value) {
  var v = String(value || '').trim().toUpperCase();
  if (!v) return 'ETC';
  if (['EU', 'EUROPE', 'EUR'].indexOf(v) >= 0) return 'EU';
  if (['ASIA', 'APAC', 'SEA', 'AP'].indexOf(v) >= 0) return 'ASIA';
  if (['CIS', 'KZ', 'KAZAKHSTAN'].indexOf(v) >= 0) return 'CIS';
  if (['LATAM', 'LATIN AMERICA', 'SOUTH AMERICA', 'LAC'].indexOf(v) >= 0) return 'LATAM';
  if (['MEA', 'MIDDLE EAST', 'AFRICA', 'LEVANT', 'MIDDLE EAST AFRICA'].indexOf(v) >= 0) return 'MEA';
  if (['INDIA', 'IN'].indexOf(v) >= 0) return 'INDIA';
  if (['NA', 'NORTH AMERICA', 'US', 'USA', 'CANADA'].indexOf(v) >= 0) return 'NA';
  return v;
}

function inferRegionForDisplay(country) {
  if (typeof window.inferRegionFromCountry === 'function') {
    return window.inferRegionFromCountry(country);
  }
  var parsedCountry = parseCountryDisplayParts(country);
  var key = parsedCountry.code || normalizeCountryKeyForDisplay(country);
  var map = {
    AFRICA:'MEA', LEVANT:'MEA',
    BE:'EU', DK:'EU', FI:'EU', SE:'EU', CZ:'EU', DE:'EU', UK:'EU', GB:'EU', ES:'EU', FR:'EU', IT:'EU', NL:'EU', PL:'EU', PT:'EU', RO:'EU', GR:'EU',
    AU:'ASIA', VN:'ASIA', ID:'ASIA', TW:'ASIA', KR:'ASIA', JP:'ASIA', CN:'ASIA', HK:'ASIA', SG:'ASIA', TH:'ASIA', MY:'ASIA', PH:'ASIA',
    KZ:'CIS',
    IN:'INDIA',
    US:'NA', CA:'NA',
    MX:'LATAM', BR:'LATAM', AR:'LATAM', CL:'LATAM', CO:'LATAM', PE:'LATAM', EC:'LATAM',
    AE:'MEA', SA:'MEA', ZA:'MEA', EG:'MEA', IL:'MEA', IR:'MEA', DZ:'MEA', MA:'MEA', QA:'MEA', KW:'MEA'
  };
  return map[key] || '';
}

function isCountryDisplayHeader(header) {
  var n = normalizeSheetHeaderName(header);
  return n === 'country' || n === 'countryname' || n === 'contry' || n === 'pdpcountry' || n === 'locale' || n === '국가' || n === 'market' || n === '법인' || n === 'subsidiary' ||
    n.indexOf('country') >= 0 || n.indexOf('contry') >= 0 || n.indexOf('pdpcountry') >= 0 || n.indexOf('locale') >= 0;
}

// Country/locale values can appear inside <th> cells on exception sheets (e.g. LG Experience Articles).
// Treat values such as HK-en, CA-fr, SA_ar, Switzerland-de as display values, not header names.
function isCountryLocaleDisplayValue(value) {
  var raw = String(value || '').trim();
  if (!raw) return false;
  // Treat any country-like value with a trailing language suffix as display data.
  // Examples: HK-zh, HS-en, CH-de, CH-fr, AE-ar, CA-en, CA-fr, SA_ar, Egypt-ar.
  // Only the last -xx / _xx part is treated as language, so the separator itself is not displayed.
  var m = raw.match(/^(.+?)[\s]*[-_][\s]*([A-Za-z]{2})\s*$/);
  return !!(m && isSheetLanguageCode(m[2]));
}

function displayCountryFullName(value) {
  var rawValue = String(value || '').trim();
  if (!rawValue) return '';

  // 한 셀 안에 EG-en / EG-ar 또는 줄바꿈으로 여러 locale이 들어온 경우도 각각 풀네임으로 변환합니다.
  var parts = rawValue.split(/\s*(?:\r?\n|\/|,|;)\s*/).filter(function(v) { return String(v || '').trim() !== ''; });
  if (parts.length > 1) {
    return parts.map(function(v) { return displaySingleCountryFullName(v); }).join(' / ');
  }
  return displaySingleCountryFullName(rawValue);
}

function displaySingleCountryFullName(value) {
  var parsed = parseCountryDisplayParts(value);
  var map = (typeof COUNTRY_FULLNAME_DISPLAY_MAP !== 'undefined' && COUNTRY_FULLNAME_DISPLAY_MAP) || window.COUNTRY_FULLNAME_DISPLAY_MAP || {};
  var original = String(value || '').trim();

  // CA-fr, SA_ar, Switzerland-de 형태는 구분자(-, _)를 화면에서 제거하고
  // 국가명 옆에 언어코드만 괄호로 표시합니다. 예: CA-fr -> Canada (fr), SA_ar -> Saudi Arabia (ar)
  var fullName = map[parsed.code] || parsed.name || original;
  return parsed.lang ? (fullName + ' (' + parsed.lang + ')') : fullName;
}

function parseCountryDisplayParts(value) {
  var raw = String(value || '').trim();
  if (!raw) return { code: '', lang: '', name: '' };

  if (raw.indexOf(':') >= 0) raw = raw.split(':')[0].trim();
  raw = raw.replace(/^(LGE|LG)\s+[A-Z0-9.]+\s*-\s*/i, '').trim();

  var lang = '';

  // 이미 괄호가 있는 값도 언어만 유지합니다. 예: Canada (fr), HK-en (en)
  var parenLocale = raw.match(/\((?:[A-Z]{2}\s*[-_]\s*)?([a-z]{2})\)\s*$/i);
  if (parenLocale && isSheetLanguageCode(parenLocale[1])) {
    lang = String(parenLocale[1] || '').toLowerCase();
    raw = raw.replace(/\s*\([^)]*\)\s*$/i, '').trim();
  } else {
    raw = raw.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  }

  var baseText = raw;

  // 국가코드/국가명 뒤의 마지막 -xx 또는 _xx만 언어코드로 분리합니다.
  // 앞부분이 HK, CA, SA 같은 국가코드여도 괄호에는 뒤 suffix(en/fr/ar)만 들어가야 합니다.
  var localeMatch = raw.match(/^(.+?)[\s]*[-_][\s]*([A-Za-z]{2})\s*$/);
  if (localeMatch && isSheetLanguageCode(localeMatch[2])) {
    baseText = String(localeMatch[1] || '').trim();
    lang = String(localeMatch[2] || '').toLowerCase();
  }

  return {
    code: normalizeCountryKeyForDisplay(baseText),
    lang: lang,
    name: normalizeCountryDisplayNameFallback(baseText)
  };
}

function isSheetLanguageCode(value) {
  var code = String(value || '').toLowerCase();
  return ['en','ar','fr','de','es','pt','ko','ja','zh','it','nl','vi','th','id','tr','pl','cs','da','sv','fi','no','he','fa','ro','bg','hr','hu','el','sk','sl','lt','lv','et','ms','hi'].indexOf(code) >= 0;
}

function normalizeCountryDisplayNameFallback(value) {
  var v = String(value || '').trim();
  if (!v) return '';
  if (v.indexOf(':') >= 0) v = v.split(':')[0].trim();
  v = v.replace(/\([^)]*\)/g, ' ');
  v = v.replace(/^(LGE|LG)\s+[A-Z0-9.]+\s*-\s*/i, '');
  v = v.replace(/[_\s-](EN|AR|FR|ES|PT|KO|JA|ZH|DE|IT|NL|VI|TH|ID|TR|PL|CS|DA|SV|FI|NO|HE|FA)$/i, '');
  v = v.replace(/\s+/g, ' ').trim();
  return v;
}

function normalizeCountryKeyForDisplay(value) {
  var alias = {
    'AFRICA':'AFRICA','LEVANT':'LEVANT','AFGHANISTAN':'AF','ANGOLA':'AO','ARGENTINA':'AR','AUSTRIA':'AT','AUSTRALIA':'AU',
    'BANGLADESH':'BD','BELGIUM':'BE','BULGARIA':'BG','BAHRAIN':'BH','BOLIVIA':'BO','BRAZIL':'BR',
    'CANADA':'CA','SWITZERLAND':'CH','CHILE':'CL','CHINA':'CN','COLOMBIA':'CO','COSTA RICA':'CR','CYPRUS':'CY','CZECH REPUBLIC':'CZ','CZECHIA':'CZ',
    'GERMANY':'DE','DENMARK':'DK','DOMINICAN REPUBLIC':'DO','ALGERIA':'DZ','ECUADOR':'EC','ESTONIA':'EE','EGYPT':'EG',
    'SPAIN':'ES','FINLAND':'FI','FRANCE':'FR','UNITED KINGDOM':'UK','GREAT BRITAIN':'UK','GB':'UK','GHANA':'GH','GREECE':'GR','GUATEMALA':'GT',
    'HONG KONG':'HK','HONDURAS':'HN','CROATIA':'HR','HUNGARY':'HU','INDONESIA':'ID','IRELAND':'IE','ISRAEL':'IL','INDIA':'IN','IRAN':'IR','IRAQ':'IQ','ITALY':'IT',
    'JORDAN':'JO','JAPAN':'JP','KENYA':'KE','CAMBODIA':'KH','SOUTH KOREA':'KR','KOREA':'KR','KUWAIT':'KW','KAZAKHSTAN':'KZ','LEBANON':'LB','SRI LANKA':'LK','LITHUANIA':'LT','LATVIA':'LV',
    'MOROCCO':'MA','MYANMAR':'MM','MEXICO':'MX','MALAYSIA':'MY','NIGERIA':'NG','NICARAGUA':'NI','NETHERLANDS':'NL','NORWAY':'NO','NEPAL':'NP','NEW ZEALAND':'NZ',
    'OMAN':'OM','PANAMA':'PA','PERU':'PE','PHILIPPINES':'PH','PAKISTAN':'PK','POLAND':'PL','PUERTO RICO':'PR','PORTUGAL':'PT','PARAGUAY':'PY','QATAR':'QA','ROMANIA':'RO','SERBIA':'RS',
    'SAUDI ARABIA':'SA','SWEDEN':'SE','SINGAPORE':'SG','SLOVENIA':'SI','SLOVAKIA':'SK','EL SALVADOR':'SV','THAILAND':'TH','TUNISIA':'TN','TURKEY':'TR','TAIWAN':'TW','TANZANIA':'TZ','UKRAINE':'UA',
    'UAE':'AE','UNITED ARAB EMIRATES':'AE','UNITED STATES':'US','UNITED STATES OF AMERICA':'US','USA':'US','URUGUAY':'UY','VENEZUELA':'VE','VIETNAM':'VN','VIET NAM':'VN','SOUTH AFRICA':'ZA'
  };
  var v = String(value || '').trim();
  if (v.indexOf(':') >= 0) v = v.split(':')[0].trim();
  v = v.replace(/\([^)]*\)/g, ' ');
  v = v.replace(/^(LGE|LG)\s+[A-Z0-9.]+\s*-\s*/i, '');
  v = v.replace(/[_\s-](EN|AR|FR|ES|PT|KO|JA|ZH|DE|IT|NL|VI|TH|ID|TR|PL|CS|DA|SV|FI|NO|HE|FA)$/i, '');
  v = v.replace(/\s+/g, ' ').trim().toUpperCase();
  return alias[v] || v;
}

var COUNTRY_FULLNAME_DISPLAY_MAP = {
  AFRICA:'Africa', LEVANT:'Levant', HS:'HS',
  AE:'United Arab Emirates', AF:'Afghanistan', AO:'Angola', AR:'Argentina', AT:'Austria', AU:'Australia',
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
window.COUNTRY_FULLNAME_DISPLAY_MAP = COUNTRY_FULLNAME_DISPLAY_MAP;


// Final visible post-process for country/locale display.
// This runs after the table HTML is created, so it also covers exception sheets where
// country values are placed inside <th> cells instead of body Country/Contry columns.
function postProcessCountryLocaleDisplay(area) {
  if (!area) return;
  var tables = area.querySelectorAll ? area.querySelectorAll('.sheet-data-table') : [];
  tables.forEach(function(table) {
    // 1) Convert any header cell that itself is a locale value: HK-zh -> Hong Kong (zh)
    table.querySelectorAll('thead th').forEach(function(th) {
      var raw = (th.textContent || '').trim();
      if (isCountryLocaleDisplayValue(raw)) {
        th.textContent = displayCountryFullName(raw);
        th.classList.add('sheet-country-col');
      }
    });

    // 2) Convert body cells already marked as country columns.
    table.querySelectorAll('td.sheet-country-col, th.sheet-country-col').forEach(function(cell) {
      var raw = (cell.textContent || '').trim();
      if (raw && isCountryLocaleDisplayValue(raw)) {
        cell.textContent = displayCountryFullName(raw);
      }
    });

    // 3) Do NOT infer body column indexes from rendered DOM here.
    // Region cells use rowspan, so later rows have fewer <td> elements and visual indexes shift.
    // That caused URL cells to be mistaken for Country cells and converted into country names.
    // Country/Contry/PDP Country/Locale body cells are already converted safely in renderSheetCell()
    // and marked with .sheet-country-col during row rendering.
  });
}

function normalizeSheetCellBg(value) {
  var v = String(value || '').trim();
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

function buildSheetTableHead(headers, tableHeaderRows, sheetData) {
  var exceptionRules = window.SHEET_EXCEPTION_RULES || null;
  var skipCountryLocaleDisplay = !!(exceptionRules && typeof exceptionRules.skipCountryLocaleDisplay === 'function' && exceptionRules.skipCountryLocaleDisplay(sheetData || DATA[currentKey] || {}));
  if (Array.isArray(tableHeaderRows) && tableHeaderRows.length) {
    var rowsHtml = tableHeaderRows.map(function(row) {
      var cells = (row || []).map(function(cell) {
        var text = typeof cell === 'string' ? cell : (cell && cell.text) || '';
        var colspan = typeof cell === 'object' && cell && cell.colspan ? Number(cell.colspan) : 1;
        var rowspan = typeof cell === 'object' && cell && cell.rowspan ? Number(cell.rowspan) : 1;
        var bg = typeof cell === 'object' && cell ? normalizeSheetCellBg(cell.bg) : '';
        var styleAttr = bg ? ' style="background:' + escapeAttrSheet(bg) + '"' : '';
        if (!text) return '';
        var isCountryValue = isCountryLocaleDisplayValue(text);
        var displayText = (!skipCountryLocaleDisplay && isCountryValue) ? displayCountryFullName(text) : text;
        var thClass = (!skipCountryLocaleDisplay && (isCountryDisplayHeader(text) || isCountryValue)) ? ' class="sheet-country-col"' : '';
        return '<th' + thClass + styleAttr +
          (colspan > 1 ? ' colspan="' + colspan + '"' : '') +
          (rowspan > 1 ? ' rowspan="' + rowspan + '"' : '') +
          '>' + escapeHtmlSheet(displayText) + '</th>';
      }).join('');
      return '<tr>' + cells + '</tr>';
    }).join('');

    return '<thead>' + rowsHtml + '</thead>';
  }

  var thead = headers.map(function(h) {
    var isCountryValue = isCountryLocaleDisplayValue(h);
    var displayText = (!skipCountryLocaleDisplay && isCountryValue) ? displayCountryFullName(h) : h;
    var thClass = (!skipCountryLocaleDisplay && (isCountryDisplayHeader(h) || isCountryValue)) ? ' class="sheet-country-col"' : '';
    return '<th' + thClass + '>' + escapeHtmlSheet(displayText) + '</th>';
  }).join('');
  return '<thead><tr>' + thead + '</tr></thead>';
}

function renderSheetCell(value, header, row, sheetData) {
  if (isCountryDisplayHeader(header)) value = displayCountryFullName(value);
  var text = String(value || '').trim();
  var exceptionRules = window.SHEET_EXCEPTION_RULES || null;
  if (exceptionRules && typeof exceptionRules.renderCell === 'function') {
    var customHtml = exceptionRules.renderCell({
      value: value,
      text: text,
      header: header,
      row: row || {},
      sheet: sheetData || DATA[currentKey] || {},
      currentKey: currentKey
    });
    if (customHtml != null) return customHtml;
  }

  if (!text) return '<span class="sheet-empty">—</span>';

  if (/^https?:\/\//i.test(text)) {
    if (exceptionRules && typeof exceptionRules.isExceptionSheet === 'function' &&
        typeof exceptionRules.isUrlHeader === 'function' &&
        exceptionRules.isExceptionSheet(sheetData || DATA[currentKey] || {}) &&
        exceptionRules.isUrlHeader(header) &&
        typeof exceptionRules.renderDonePill === 'function') {
      return exceptionRules.renderDonePill(text);
    }
    return '<a class="sheet-link" href="' + escapeAttrSheet(text) + '" target="_blank" rel="noopener">' + escapeHtmlSheet(shortenUrlSheet(text)) + '</a>';
  }

  var status = normalizeSheetRendererStatus(text);
  if (status) {
    var cfg = SC[status] || SC['Pre-Review'];
    return '<span class="sheet-status-pill" style="background:' + cfg.bg + ';color:' + cfg.tc + '"><span style="background:' + cfg.dot + '"></span>' + escapeHtmlSheet(cfg.label || status) + '</span>';
  }

  return escapeHtmlSheet(text);
}

function normalizeSheetRendererStatus(value) {
  var v = String(value || '').trim().toLowerCase();
  if (!v) return '';
  if (['done','complete','completed','closed','완료','등록완료'].indexOf(v) >= 0) return 'Done';
  if (['corp. review','corp review','client review','법인리뷰','법인 리뷰'].indexOf(v) >= 0) return 'Corp. Review';
  if (['in progress','wip','working','작업중','진행중'].indexOf(v) >= 0) return 'In Progress';
  if (['cancel','cancelled','canceled','취소'].indexOf(v) >= 0) return 'Cancel';
  if (['pre-review','pre review','사전검토','사전 검토'].indexOf(v) >= 0) return 'Pre-Review';
  return '';
}

function shortenUrlSheet(url) {
  return url.length > 54 ? url.slice(0, 28) + '…' + url.slice(-18) : url;
}

function escapeHtmlSheet(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttrSheet(value) {
  return escapeHtmlSheet(value);
}