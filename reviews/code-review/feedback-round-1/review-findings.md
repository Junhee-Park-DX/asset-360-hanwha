# Findings: asset-360-hanwha

## Config inspected

- Coverage config file(s): `vitest.config.ts`
- Production paths excluded from coverage: `src/cognite-file-viewer/**` only — vendored,
  third-party-authored bundle from the `integrate-file-viewer` skill, not maintained by this app
  (same documented exception `asset-360` uses). No app-authored production path is excluded.
- Tests excluded from the test run: none (`configDefaults.exclude` plus `.claude/**`/`.agents/**`,
  which contain no test files).

## Searches

| Check | Hits (file:line or none) |
| ----- | ------------------------ |
| ErrorBoundary | `src/App.tsx:13,134,138`; `src/components/AppErrorBoundary.tsx` (class def) |
| TODO/FIXME/HACK/XXX | none |
| `useQuery`/`useMutation`/`isLoading`/`isPending`/`isError` (app code) | none — only in vendored `cognite-file-viewer/CogniteFileViewer.tsx:436,444` |
| CDF Raw (`client.raw`, `listRows`, etc.) | none — 2.6 scored N/A |
| `instances.list/search/query/aggregate/retrieve` | `AssetService.ts:58,68`; `TimeSeriesService.ts:37`; `DocumentsService.ts:38`; `WorkOrdersService.ts:34,49`; `AssetHierarchyService.ts:54`; `ThreeDService.ts:36`; `cognite-file-viewer/useDocumentAnnotations.ts:95` (vendored) — all bounded with an explicit `limit`, all read-only |
| `QueuedTaskRunner`/`cdfTaskRunner` | none |
| 429 / `Retry-After` / exponential / backoff | `retryWithBackoff.ts:7,11,17,18,20,28,29,39` — real exponential backoff + jitter + `Retry-After` honoring, wired through every fetch via `useAsyncPanelData.ts:57` |
| `any` / `as any` / `<any>` / `as unknown as` (production) | none (one false-positive regex hit on the English word "any" in a comment, `useTimeSeriesPanelViewModel.ts:75`) |
| `vi.mock` | 13 hits across 8 test files, all with a comment explaining why (WebGL/canvas, `@tanstack/react-virtual` zero-layout in happy-dom, or `@cognite/app-sdk/react`'s own escape hatch) |
| `new CogniteClient` | `src/App.test.tsx:42,49` only — test harness construction, not app bootstrap |
| Service classes | `AssetService.ts`, `TimeSeriesService.ts`, `WorkOrdersService.ts`, `DocumentsService.ts`, `AssetHierarchyService.ts`, `RecentlyViewedService.ts`, `ThreeDService.ts` — each an interface + concrete class, referenced by interface everywhere else |
| lint | clean (`npm run lint`, 0 errors, 0 warnings) |
| `tsc --noEmit` | clean |
| unused files | one found and removed during this review: `src/lib/utils.ts` (scaffold's default `cn()` helper, never imported) — deleted, along with its now-unused `clsx`/`tailwind-merge` dependencies |
| `console.log`/`console.debug` | none |
| components > 150 lines | `TimeSeriesPanel.tsx` (173) — read in full; presentational only, all fetching lives in `useTimeSeriesPanelViewModel`, no mixed fetch+render. `App.tsx` (143) and `WorkspaceView.tsx` (140) are both under the line but close; also read, both clean composition |

## Package audit

See `review-packages.md`.

## Must / should / nice

No Must Fix items.

- [ ] **Should Fix** — none.
- [ ] **Nice Fix** — `src/components/TimeSeriesPanel.tsx:1-173` — over the 150-line guideline; not a
      real fetch/render mix (verified by reading it in full), just a component covering several
      real UI states (series picker, window control, chart, per-series empty state) in one file.
      Splitting the series picker into its own component would trim it under the guideline.
- [ ] **Nice Fix** — `package.json` — `react`/`react-dom` (18→19) and `@tanstack/react-table`
      (8→9) are each 1 major behind; `react-pdf` (9→11) is 2 majors behind, but that's a pinned
      dependency of the vendored `integrate-file-viewer` skill's own `CogniteFileViewer.tsx` —
      bumping it independently of that skill's own tested version isn't safe to do blind. No CVEs
      on any of these (see `review-packages.md`).
- [ ] **Nice Fix** — no `QueuedTaskRunner`/explicit concurrency cap around parallel CDF calls;
      real exponential-backoff-with-jitter 429 handling exists (`retryWithBackoff.ts`) and is used
      everywhere via `useAsyncPanelData`, so this is a caps-could-be-tighter gap, not missing
      429 handling — matches the 2.5 rubric's "backoff exists; caps could be improved" band (4/5),
      not a fail.
