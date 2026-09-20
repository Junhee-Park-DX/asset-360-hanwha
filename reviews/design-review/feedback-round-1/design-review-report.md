# Design Review — Asset 360 Investigation Workspace (Hanwha) — round 1

This document is the manual design-quality assessment for Asset 360 Investigation Workspace (Hanwha), conducted as part of the Cognite Flows app certification process (step 3, after `flows-code-review`).

### Reviewed commit
`3de0156`

## User and tasks

- **Primary user:** Operations Analyst / Reliability Engineer at an industrial facility. Reviews shift reports/alarms each morning; when an asset is flagged, investigates its history, current state, and documentation to brief the maintenance team. Works primarily at a desk, occasionally the control room, on a standard desktop/laptop. (Source: `App-Brief.md` `userRole`, accepted as-is.)
- **Tasks evaluated:**
  1. Find a specific asset by search or by browsing the hierarchy tree, and review its full 360° detail on one page.
  2. Assess an asset's data completeness via the governance scorecard (time series/work orders/documents/3D mapping) without opening each panel.
  3. Investigate an asset's time-series data across different time windows to spot anomalies.
- **Context:** Time-constrained (success criteria targets under 15 minutes per investigation, down from 1–2 hours); desktop/laptop only; no formal usability testing performed yet — see `App-Brief.md` `userEvidence`.

## Task walkthrough findings

Performed by the agent using live browser testing earlier in this same session (while verifying three user-reported bugs against the running dev build at the currently-reviewed commit), rather than re-run live during this review pass — browser click automation was not registering reliably at review time (confirmed across two tabs; not an app-side issue). The user confirmed this substitution was acceptable before scoring proceeded.

- **Task 1 — Find asset, see 360° detail on one page.** Verified via both entry points: searching "23-KA-9101" / "pump" and clicking a result, and expanding the hierarchy tree (VAL → 23 → 230900) and clicking a leaf node, both land on the identical full-detail page (header, data-completeness badges, time series/work orders/documents grid, 3D preview) with no page navigation. One friction point: on a cold page load, the asset-hierarchy tree takes roughly 5–8 seconds to populate (a single broad `/search` call fetching up to 1000 assets) before it's browsable; the search path is available immediately and unaffected.
- **Task 2 — Assess data completeness via the governance scorecard.** Verified: selecting an asset immediately surfaces "Time series: N linked · Work orders: N linked · Documents: N linked · 3D mapping: Mapped/Not mapped" directly under the header, with zero additional clicks. Verified switching between a fully-linked asset (23-KA-9101: 12/100/0/Mapped) and a zero-linked asset (23-KA-9101-A01: 0/12/0/Mapped) correctly updated every badge and the panels beneath — the stale-data bug reported and fixed earlier this session is confirmed resolved.
- **Task 3 — Investigate time series across time windows.** Verified: checking a series checkbox renders a chart; the 24h/7d/30d/90d segmented control refetches and relabels correctly; confirmed the control no longer overflows its panel border with the navigator sidebar expanded (a second bug reported and fixed earlier this session). Verified switching to an asset with no linked series clears the previous chart instead of showing stale data for the wrong asset.

## Scores

| Question | Score | Rationale | Improvement note |
| --- | --- | --- | --- |
| Q1 Aura consistency | 5 | 11 files import `@cognite/aura`; zero hard-coded hex/rgb colors in app code (only in the vendored `cognite-file-viewer`, same precedent as sibling app `asset-360`); round-2 code review independently scored criterion 3.1 (Aura) a 5. | None — maintain the per-subpath import discipline as the app grows. |
| Q2 Navigation & hierarchy | 5 | Zero client-side routes by design — the single-page workspace is the app's core differentiator, so there is no "where am I" ambiguity. Selected asset, search query, and sidebar collapse state are all URL-synced (`syncInternalState`); recently-viewed and the hierarchy tree stay visible alongside content at all times. | None. |
| Q3 Labels & language | 5 | Zero vague button labels found (no bare "Submit"/"OK"/"Click here"); buttons read "Preview"/"Hide preview"/"Download"/"Refresh"; collapse/expand controls carry descriptive `aria-label`s; search placeholder gives a concrete example ("e.g. PUMP-101"). | None. |
| Q4 Feedback & validation | 5 | `AppErrorBoundary` at the app root; every fetch surface (search, hierarchy tree, header, time series, work orders, documents, 3D preview) has independent loading/error/empty/no-access states via the shared `PanelState`/`useAsyncPanelData` machine — independently confirmed by round-2 code review's 1.1 (Known bugs) score of 5. | None. |
| Q5 Clickability | 5 | Zero `<div>`/`<span onClick>` without a `role`; hover/focus affordances come from Aura's own `Button` variants rather than custom overrides; walkthrough confirmed rows and buttons behave predictably on click. | None. |
| Q6 Error prevention & recovery | 5 (N/A — no destructive actions) | Read-only investigation/viewer app; no delete/edit/create action exists anywhere in the UI. The single "remove" hit in the codebase (`ThreeDViewer.tsx`) is internal Reveal-viewer cleanup on unmount, not a user-facing action. | None — revisit only if a future version adds mutating actions. |
| Q7 Responsive | 4 | `App-Brief.md`'s `userRole` states the user works at a desk/control room on a standard desktop or laptop — desktop-only is an intentional, acceptable scope per the rubric. Viewport meta tag present; zero fixed-px sizing hits. Scored 4 rather than 5 because only one desktop width (~1520px) was actually exercised this session, not a range down to a smaller laptop panel. | Manually verify layout at ~1280px and ~1366px laptop widths. |
| Q8 Empty states | 5 | Every data-bearing panel (time series/work orders/documents/3D preview/hierarchy tree/search results/recently-viewed) renders a `PanelEmptyState`-driven message with clear next-step copy. Walkthrough confirmed correct per-panel empty copy when switching to a zero-linked asset. | None. |
| Q9 Performance | 4 | This session's own fix cut the eager JS bundle from 418 KB to 309 KB gzipped by lazy-loading the PDF preview and 3D viewer; every list-fetching service call has an explicit `limit`; the governance scorecard's duplicate fetches (found and fixed this session) are eliminated. Not a 5: the 3D viewer's own lazy chunk is still large (~895 KB gzipped), and the hierarchy tree takes ~5–8 seconds to populate on a cold load. | Consider further code-splitting `@cognite/reveal-widget`/`@cognite/reveal`, and add a visible progress indicator (not just a skeleton) for the hierarchy fetch. |
| Q10 Accessibility | 4 | 22 `aria-label` uses across the app; the two real `<img>` tags (in the vendored file viewer) correctly use `alt=""` for decorative preview content; Aura's own components carry built-in `focus-visible` ring styling, so the app inherits keyboard-focus affordances without needing to reimplement them. Not a 5: no manual keyboard-only navigation pass or automated axe/contrast scan was run this session to independently verify. | Run a manual keyboard-only pass and an axe-core scan before wider rollout. |

## Summary

- Average score: 4.7
- Quality level: Excellent — ready to launch

## Must Fix (any score < 3)

- None.

## Should Fix (any score 3 – 3.7)

- None.

## Nice to Fix (any score 3.8 – 4.4)

- Q7 Responsive (4): manually verify layout at ~1280px/1366px laptop widths.
- Q9 Performance (4): further code-split the 3D viewer bundle; add a progress indicator for the hierarchy tree's cold-load fetch.
- Q10 Accessibility (4): run a manual keyboard-only pass and an axe-core scan before wider rollout.
