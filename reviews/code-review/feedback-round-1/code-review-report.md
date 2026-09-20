# Asset 360 Investigation Workspace (Hanwha) — Flows code review

This document is the platform review for Asset 360 Investigation Workspace (Hanwha), conducted
as part of the Cognite Flows app certification process.

## Path to approval

This review found **0 must-fix items** — approved as-is.

### Reviewed commit

`1763db8` (includes this review's own follow-up commits: removing the unused
`src/lib/utils.ts`/`clsx`/`tailwind-merge`, and syncing `AGENTS.md` with the current coding
standards)

## Summary of the codebase

Single-page Flows app: search + a selectable asset-hierarchy tree (navigator) drive a content
area that fills in with the selected asset's full detail (header, data-completeness governance
scorecard, 3D CAD preview, time series, work orders, documents) — no client-side routing, only
host-synced selection state. 349 files, ~40 app-authored source modules (services, ViewModels,
components) plus their co-located tests, plus a vendored file-viewer bundle from the
`integrate-file-viewer` skill.

## Coverage scope

`npx vitest run --coverage`: **147/147 tests pass**, all 35 test files green.

Aggregate: **96.5% statements, 87.4% branches, 95.0% functions, 98.25% lines** — well above the
80% line-coverage hard gate, and honestly scoped: the only `coverage.exclude` entry is the
vendored `src/cognite-file-viewer/**` bundle (not authored by this app, same documented exception
`asset-360` uses), plus standard boilerplate (`*.config.ts`, `*.d.ts`, `vitest.setup.ts`). No
app-authored production path is hidden from the measurement, and every app-authored `.test.ts(x)`
runs (no `test.exclude` entries beyond Vitest's own defaults). Per-file line coverage (from the
raw `coverage-final.json`, not just the aggregate) ranges from 83.3% (`src/context/services.ts`,
a 6-line DI factory) to 100% across the large majority of files — no file is a coverage sinkhole
propping up the aggregate.

## Scores

| Area | Criterion | Score | Notes |
| ---- | --------- | ----- | ----- |
| User & customer | 1.1 Known bugs | 5 | No known defects. `AppErrorBoundary` wraps routed content (FR-016); every panel uses the shared `PanelEmptyState` for loading/empty/error/no-access (FR-011); every `useEffect` with async work has a `cancelled` guard and cleanup. Two real bugs (a state-update-batching bug in `App.tsx` and a wrong-view/wrong-filter bug in `ThreeDService.getCadRevision`) were found via a live walkthrough against real `publicdata` data during this build and fixed before this review, not left for the reviewer to find. |
| User & customer | 1.3 Packages | 4 | No CVEs on any production dependency, no deprecated packages. `react`/`react-dom` and `@tanstack/react-table` are each 1 major behind; `react-pdf` is 2 majors behind but pinned by the vendored `integrate-file-viewer` skill bundle, not independently upgradable without re-vendoring — a documented, deliberate reason, not an oversight. See `review-packages.md`. |
| User & customer | 1.4 Tests & coverage | 5 | Honest ≥ 80% line coverage (98.25%) at full `src/` scope; only a vendored, non-authored bundle is excluded. 147/147 tests pass. Every non-trivial module has a co-located `*.test.ts(x)`; the handful without one (`cdmViews.ts`, `errors.ts`, `instanceKey.ts`, `types.ts`, `panelState.ts`) are pure constants/types/one-line predicates, CLAUDE.md-exempt, and still individually 100% covered via other tests that exercise them. |
| User & customer | 1.5 Dead code | 5 | One unused file (`src/lib/utils.ts`, the scaffold's default `cn()` helper) was found and removed during this review, along with its now-orphaned `clsx`/`tailwind-merge` dependencies. No unreachable routes (there are none — single page by design), no commented-out blocks, no lint or `tsc` errors, no production `any`. |
| User & customer | 1.6 Patterns & testability | 5 | DI via React context throughout (`useServices()`/`ServicesReactContext`); every service is interface-first with a `Cognite*Service` concrete class referenced only by interface elsewhere; every non-trivial component has a `use*ViewModel` hook and is itself presentational; `new CogniteClient` appears only in `App.test.tsx`'s test harness. `useAssetSearchViewModel` and `useThreeDPreviewViewModel` both improve on the pattern further: host-synced state is taken as parameters rather than owned locally, and `useThreeDPreviewViewModel` delegates its fetch/loading/error state machine to the shared `useAsyncPanelData` hook rather than hand-rolling one. |
| Cognite services | 2.1 DMS query patterns | 5 | Every read uses `instances.search`/`.retrieve` with a bounded `limit`, except `ThreeDService.getCadRevision`, which correctly uses `instances.list` — deliberately, because the queried view (`Cognite3DRevision`) has no full-text-indexed properties at all, so DMS's `/search` genuinely cannot return results for it (verified live: `/search` returned empty for a revision confirmed to exist via Fusion's own UI; `/list` found it). This is the *right* API for that specific case, not a default-to-heavy pattern. |
| Cognite services | 2.2 Server-side filtering | 5 | All asset-scoped panels filter server-side via `containsAny` on the relevant relation property; no download-then-filter in the client. |
| Cognite services | 2.3 Limits & pages | 5 | Every list call has an explicit `limit` (`AssetHierarchyService` at 1000 with a surfaced `truncated` flag when hit; panel lists at 100; search at 25; the CAD revision lookup at 1). No prefetching of content the user hasn't asked for. |
| Cognite services | 2.4 Call rate | 5 | Search is debounced (250ms, `useAssetSearchViewModel`); the 3D preview panel skips its fetch entirely when the selected asset has no `object3D` mapping rather than querying and discarding; no polling anywhere (time series explicitly refresh-on-demand only, FR-006b). |
| Cognite services | 2.5 429 backoff | 4 | Real exponential backoff + jitter, honoring `Retry-After`, bounded at a max retry count (`retryWithBackoff.ts`), wired through every fetch via the shared `useAsyncPanelData` hook — not just TanStack Query's own retry. No explicit `QueuedTaskRunner` concurrency cap, which is the one gap keeping this at 4 rather than 5. |
| Cognite services | 2.6 CDF Raw | N/A | No `client.raw`/`listRows`/`insertRows`/`retrieveRow` usage anywhere. |
| Brand | 3.1 Aura | 5 | Every component imports Aura per-subpath (`@cognite/aura/components/...`, `@cognite/aura/chart`, `@cognite/aura/data-grid`), never the barrel. No hard-coded hex/rgb/hsl colors anywhere in app code — the "blue" identity is carried entirely through Aura's own `fjord` decorative/chart tokens (`bg-decorative-background-fjord`, `text-decorative-foreground-fjord`, `--chart-fjord-color-1`) and the `warning` semantic Badge variant for the governance scorecard's gap-flagging, never a custom palette. |

## Must Fix (any score < 3)

None.

## Should Fix (any score 3 – 3.7)

None.

## Nice to Fix (any score 3.8 – 4.4)

- **1.3 (4):** `react`/`react-dom` and `@tanstack/react-table` are each 1 major behind;
  `react-pdf` is 2 majors behind but pinned to the vendored `integrate-file-viewer` skill's own
  tested version — re-vendoring that skill (which would bring its own `react-pdf` bump) is the
  correct path, not an independent bump.
- **2.5 (4):** Add a `QueuedTaskRunner`-style concurrency cap around parallel CDF calls (e.g. when
  several panels fetch simultaneously on asset selection) on top of the existing backoff+jitter,
  for defense-in-depth under heavy concurrent load.
- **Component size:** `TimeSeriesPanel.tsx` is 173 lines — over the 150-line guideline, though
  read in full and confirmed to be presentational-only (no fetch/render mixing). Splitting the
  series-picker checkbox list into its own component would bring it under the line.

## Summary

- Must Fix open: 0
- Should Fix open: 0
- Nice Fix open: 3
