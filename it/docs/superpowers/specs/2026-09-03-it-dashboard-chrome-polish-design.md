# IT Dashboard Chrome Polish — Design Spec

**Date:** 2026-09-03  
**Scope:** `hs-dashboard/it/` (live) + implement first in `it-dashboard` worktree  
**Out of scope:** NPI menu re-show, GR/CMS/PTT data updates, hs/ms dashboards, full visual redesign

## Goals

Reduce first-screen chrome duplication, unify status meaning, simplify country/URL drill-in, keep tablet findability and basic keyboard/dialog a11y — without changing brand (wine `#A50034`, Pretendard) or GR IA (In Progress / Planned / Done + region table).

**Success (dev):** Table visible within one scroll on a typical GR task; In Progress color identical across pipeline/pills/modal; collapsed rail shows abbr; search works ~800px; GR modals close with Esc and expose dialog semantics; Live URL Library + `HIDE_NPI_NAV` + weekly `N` badge counts unchanged.

## Constraints

| Decision | Choice |
|---|---|
| Depth | Chrome cleanup only (not mid/full redesign) |
| Delivery | One polish branch on **dev**; single **live backport** when done |
| Order inside branch | 1 → 2 → 3 → 4 → 5 → 6 → 7 (atomic commits, one remote live push at end) |
| Calculation code | `contentStats`, `grCountTaskChanges`, site-% logic — **read/bind only**, no formula changes |

## Phases

### 1. GR overview

- Keep task title in topbar only; drop duplicate `.ov-head-name` title (or reduce to week/owner meta).
- One summary row: Sites/Pages, completion %, owner, weekly-change line.
- Keep **either** Status Pipeline **or** four stat cards — not both. Preferred: pipeline (compact) **or** four stats if they become clickable filters.
- Clicking a stage filters via existing `switchTab` / status tabs.
- Remove the prose “Status Pipeline …” restatement under the bar.
- Stat cards must not look clickable unless they filter (`cursor:default` today is a trap — either wire or demote visually).

### 2. Sidebar

- Make **In Progress** collapsible (default expanded); Planned/Done stay as today.
- Collapsed rail: show `data-abbr` (already written, never displayed).
- One numeric badge: `%`. Weekly signal: small `N` pip only (not a second number).
- Render `%` from first paint — no Total→% flash (`syncNavBadges` vs initial Total).

### 3. Status colors

Single map everywhere (overview, tabs, pills, country modal, dots):

| Stage | Color role |
|---|---|
| 사전검토 | Slate |
| 작업중 / In Progress | Blue `#3B82F6` |
| 법인리뷰 / Corp. Review | Amber `#F59E0B` |
| 완료 / Done | Green |
| 취소 / Cancel | Gray |

Remove modal “신호등” palette where In Progress=amber and Corp. Review=red.

### 4. Country / URL modal

- Content: header (country + aggregate status) + model/URL list + “전체 열기 (N)”.
- Remove stacked mini-dashboard: duplicate pipeline + 신호등 grid inside the same card.
- Unify FAQ `grOpenUrlModal` and country-cell URL pattern enough that users learn one flow.
- If N > 5, confirm before `grOpenAllUrls` (“N개 탭을 엽니다”).
- Keep `window._grUrlModalUrls` approach (no onclick JSON).

### 5. Responsive

- Below 900px: keep a search **icon** that opens the existing combobox in an overlay — do not `display:none` the only cross-task finder.
- Table horizontal scroll: keep thead sticky; freeze Country (and Status if feasible) instead of disabling sticky at 768px.

### 6. Typography & copy

- Apply existing `--fs-*` tokens to GR surfaces (today GR explicitly ignores them).
- Floor: body ≥ 12px, badges ≥ 10px.
- Chrome labels in Korean (e.g. Status Pipeline → 상태 파이프라인). Keep English for proper nouns (Live URL, FAQ).

### 7. Accessibility

- Nav items and country cells: keyboard activatable (Enter/Space); prefer `button`/role patterns over bare `div onclick` where low-risk.
- GR modals: `role="dialog"`, `aria-modal="true"`, Escape, focus handling at least at NPI modal level (full focus-trap nice-to-have).
- `:focus-visible` rings; sidebar collapse control `aria-expanded`.
- Do not rely on hover-only pipeline tooltips for essential counts — show counts in text when space allows.

## Files (expected)

| Area | Primary files |
|---|---|
| Overview / tabs / modals / search go-to | `common.js` |
| Sidebar nav | `sheet-loader.js` |
| Layout / responsive / type / focus | `style.css` |
| Cache bust | `index.html` (`?v=`, `__BUILD_V`) — bump **on live backport** |

Dev may use independent `0.7.x`; live stays on `0.6.x` line.

## Backport checklist

1. Diff function-by-function: do not overwrite live-only gates (`HIDE_NPI_NAV`, weekly badge wiring, FAQ URL exceptions).
2. Copy polished `common.js` / `sheet-loader.js` / `style.css` slices (or full files if byte-identical base verified).
3. Bump live `?v=` and `__BUILD_V`.
4. Smoke live: GR task, sidebar, country modal, search at narrow width, N badge, NPI still hidden.

## Test plan (dev :8010, hard reload)

1. Latest In Progress GR: single overview chrome; stage click filters tabs; table early in viewport.
2. Sidebar: collapse In Progress; collapsed rail abbr; `%` + `N` pip; no badge flash.
3. Country modal: no 신호등; URL list; confirm when opening >5 tabs.
4. Colors match across pipeline / pills / modal.
5. ~800px width: search icon works; Country sticky on h-scroll.
6. Keyboard: open/close modal, focus ring visible.
7. Live URL Library OK; NPI section absent; weekly `N` counts match `gr-changes.json`.

## Non-goals

- Redesigning card grids, new illustration, dark mode, or replacing Pretendard.
- Changing site-based completion % rules or Status vocabulary.
- Re-enabling NPI product status nav.
