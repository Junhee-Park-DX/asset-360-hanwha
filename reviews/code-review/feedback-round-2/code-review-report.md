# Asset 360 Investigation Workspace (Hanwha) — Flows code review

This document is the platform review for Asset 360 Investigation Workspace (Hanwha), conducted as
part of the Cognite Flows app certification process.

## Path to approval

This review found **0 must-fix item(s)** that block approval. No further action is required before
proceeding to `flows-design-review`.

### Reviewed commit

`998bb80a02ccf2f46cdef5d35ad64cec2c711a92`

---

## Context: what changed since round 1

Round 1 (commit `1763db8`) closed at 0 Must Fix / 0 Should Fix / 3 Nice Fix. Since then, two
commits landed real fixes reported live by the app's user:

- `26e5011` — `useTimeSeriesPanelViewModel` now resets `selectedSeriesIds` when the asset changes
  (fixes a stale-chart bug), and `WINDOW_OPTIONS` labels were shortened to fix a segmented-control
  overflow.
- `7061f16` — `AssetGovernanceScorecard` no longer independently re-fetches what the sibling panels
  already fetch (duplicate-network-call fix); `DocumentPreview` was extracted and lazy-loaded to
  keep `react-pdf`/pdf.js out of the eager bundle; the 3D preview panel was reordered to after the
  summary grid.

This round re-ran the full hunt from scratch (not a diff-only pass) per `flows-review-checks`, to
confirm the refactor didn't regress anything and to score the two new/changed pieces on their own
merits.

## Checks performed

- Full Step 1 hunt (1.1–1.5) from `flows-review-checks`, including the `code-quality` searches
  (searches only — no fixes applied, per that skill's own instruction).
- Package audit (`npm outdated --json`, `npm audit --json`).
- Coverage (`npx vitest run --coverage`), cross-checked against the raw `coverage/coverage-final.json`
  for files the terminal table might truncate (confirmed `DocumentPreview.tsx` is instrumented and
  fully covered, despite not appearing in the printed table).
- `npm run lint` and `npx tsc --noEmit` — both clean.

See `review-files.md` for the full file inventory and `review-findings.md` for every hunt's hits
(or `none`).

## Coverage scope

Line coverage: **98.26%** (454/462), well above the 80% gate. The only `coverage.exclude` entry is
`src/cognite-file-viewer/**`, the `integrate-file-viewer` skill's vendored bundle — not authored or
maintained by this app, same exception `asset-360` and round 1 both established. No other
production path (`components/`, `viewmodels/`, `services/`, etc.) is excluded, and no test file is
on an exclude list. This scope is honest per the skill's bar — the printed percentage is valid.

## Scores

| Area | Criterion | Score | Notes |
| ---- | --------- | ----- | ----- |
| User & customer | 1.1 Known bugs | 5 | ErrorBoundary at the app root; every fetch surface has loading/error/empty/no-access states via the shared `PanelState`/`useAsyncPanelData` machine; the two user-reported bugs fixed since round 1 (stale time-series chart on asset switch, segmented-control overflow) are both verified fixed with regression coverage. No known defects found this round. |
| User & customer | 1.3 Packages | 4 | `react`/`react-dom`/`@tanstack/react-table` 1 major behind; `react-pdf` 2 majors behind but pinned/vendored; 4 moderate CVEs, all dev-only (`vitest` tooling, never shipped). No high/critical CVEs, no deprecated production deps. Unchanged from round 1. |
| User & customer | 1.4 Tests & coverage | 5 | Honest ≥ 80% line coverage (98.26%) at full `src/` scope; only the vendored bundle excluded. 146/146 tests pass (34 files). Every non-trivial new/changed file this round has co-located test coverage except `DocumentPreview.tsx` (see 1.6/1.5 notes) — flagged as Nice Fix, not enough to move this score given 100% indirect coverage. |
| User & customer | 1.5 Dead code | 5 | Zero lint errors, zero `tsc` errors, zero unused production files (verified fresh this round — the `useAssetGovernanceViewModel.ts` deletion left no dangling references), zero `console.log`. `TimeSeriesPanel.tsx` remains over 150 lines (179, grew from 173) but stays presentational-only — Nice Fix, not a maintainability risk. |
| User & customer | 1.6 Patterns & testability | 5 | DI via `ServicesReactContext` throughout; no hook imports a service or the SDK directly; interface-based services; ViewModel hooks composed statelessly over a shared storage layer, called once per screen and passed down as props (the round's core fix — `AssetDetailContent` now calls the three panel ViewModels once and threads them to both the panels and the scorecard, closing a real duplicate-fetch bug). Minor gap: 5 of 14 `vi.mock` calls lack their own direct comment (rely on a neighboring mock's) — Nice Fix. |
| Cognite services | 2.1 DMS query patterns | 5 | Read paths use `search`/`retrieve`; the one `instances.list` call (`ThreeDService.ts`) targets `Cognite3DRevision`, a view with no indexed text properties where `/search` genuinely returns nothing (verified live against real data) — documented, justified exception, unchanged from round 1. |
| Cognite services | 2.2 Server-side filter | 5 | All filtering (asset relevance ranking aside, which operates on an already-bounded result set) happens in the request; no download-then-filter pattern found. |
| Cognite services | 2.3 Limits & pages | 5 | Every service call carries an explicit `limit` constant; no unbounded reads, no prefetch of content the user hasn't asked for (3D viewer and PDF preview are both lazy-loaded on demand, the latter newly so this round). |
| Cognite services | 2.4 Call rate | 5 | The round's fix directly improves this: 3 of the panel fetches that previously fired twice per asset selection (once from the panel, once from the scorecard) now fire once, sharing state through props. No polling, no tight loops. |
| Cognite services | 2.5 429 backoff | 4 | `retryWithBackoff.ts` gives every fetch exponential backoff + jitter + `Retry-After` handling, bounded retries — but there's still no `QueuedTaskRunner`/concurrency cap limiting how many panel fetches can be in flight at once. Unchanged from round 1 — real gap, not severe enough to fail given the backoff that does exist. |
| Cognite services | 2.6 CDF Raw | N/A | No Raw usage anywhere in the app. |
| Brand | 3.1 Aura | 5 | Aura components/tokens used throughout for layout, forms, tables, feedback, typography; the new `DocumentPreview.tsx` extraction is a pure refactor (Aura `Button` unchanged) with no new custom UI introduced. |

## Must Fix

None.

## Should Fix

None.

## Nice Fix

- [ ] Add a `src/components/DocumentPreview.test.tsx` with a direct render test, rather than
      relying solely on `DocumentsPanel.test.tsx`'s indirect coverage — `src/components/DocumentPreview.tsx` —
      criterion 1.6
- [ ] Attach a direct explanatory comment to each `vi.mock` call instead of relying on a
      neighboring mock's comment — `src/components/WorkspaceView.test.tsx:30,34`,
      `src/components/DocumentsPanel.test.tsx:18`, `src/components/ThreeDViewer.test.tsx:29` —
      criterion 1.6
- [ ] No `QueuedTaskRunner`/concurrency cap around CDF calls — `src/viewmodels/useAsyncPanelData.ts` —
      criterion 2.5 (unchanged from round 1)
- [ ] `react`/`react-dom` 1 major behind, `@tanstack/react-table` 1 major behind, `react-pdf` 2
      majors behind (pinned/vendored) — criterion 1.3 (unchanged from round 1)
- [ ] `src/components/TimeSeriesPanel.tsx` at 179 lines (over the 150-line guideline),
      presentational only — criterion 1.5 (unchanged from round 1, grew by 6 lines)
- [ ] 4 moderate `vitest`/`@vitest/mocker` CVEs, dev-only — criterion 1.3 (unchanged from round 1)

## Summary

- Must Fix open: 0
- Should Fix open: 0
- Nice Fix open: 6
