# File inventory — asset-360-hanwha, round 2

Every `.ts`/`.tsx` under `src/`, excluding `node_modules`, `dist`, `.cognite-bundles`.
`src/cognite-file-viewer/**` (9 files) is the `integrate-file-viewer` skill's vendored bundle —
listed separately at the end, not authored/maintained by this app (same treatment as round 1 and
`asset-360`).

Since round 1 (`1763db8`), 10 files changed and 2 were deleted, across two commits
(`26e5011` fix(time-series), `7061f16` perf). All were re-read in full for this round. The
remaining 31 files are unchanged — carried forward from round 1's assessment, spot-checked via
`git diff 1763db8..HEAD -- src/` to confirm no drift.

| File | Structure | Quality | Patterns | Tests | Notes |
| --- | --- | --- | --- | --- | --- |
| `src/App.tsx` | ✓ | ✓ | ✓ | ✓ | Unchanged since round 1. |
| `src/main.tsx` | ✓ | ✓ | ✓ | — (bootstrap, exempt) | Unchanged since round 1. |
| `src/components/AppErrorBoundary.tsx` | ✓ | ✓ | ✓ | ✓ | Unchanged since round 1. |
| `src/components/AssetDetailContent.tsx` | ✓ | ✓ | ✓ | ✓ | **Changed.** Now calls `useTimeSeriesPanelViewModel`/`useWorkOrdersPanelViewModel`/`useDocumentsPanelViewModel` once each and passes the results down as `vm` props to both the panels and `AssetGovernanceScorecard`, per CLAUDE.md §5 — fixes a real duplicate-fetch bug where the scorecard independently re-fetched the same three lists. 3D preview panel moved to after the 3-column grid (was before it). |
| `src/components/AssetGovernanceScorecard.tsx` | ✓ | ✓ | ✓ | ✓ | **Changed.** Rewritten from a fetching component to pure presentational — takes `timeSeriesState`/`workOrdersState`/`documentsState`/`has3DMapping` as props instead of calling ViewModels itself. |
| `src/components/AssetHeader.tsx` | ✓ | ✓ | ✓ | ✓ | Unchanged since round 1. |
| `src/components/AssetHierarchyTree.tsx` | ✓ | ✓ | ✓ | ✓ | Unchanged since round 1. |
| `src/components/AssetNavigatorPanel.tsx` | ✓ | ✓ | ✓ | ✓ | Unchanged since round 1. |
| `src/components/DocumentPreview.tsx` | ✓ | ✓ | ✓ | Indirect only (see review-findings.md) | **New.** Extracted from `DocumentsPanel.tsx` and `React.lazy`-loaded so `react-pdf`/pdf.js only enter the bundle once a user clicks "Preview" — same pattern as `ThreeDViewer.tsx`. No dedicated `DocumentPreview.test.tsx`; fully exercised (2/2 statements, 100%) via `DocumentsPanel.test.tsx`'s preview-click test, but CLAUDE.md §6 expects a co-located test file for every new component with logic — flagged as Nice Fix. |
| `src/components/DocumentsPanel.tsx` | ✓ | ✓ | ✓ | ✓ | **Changed.** Takes `vm` prop instead of `assetId` (duplicate-fetch fix); `DocumentPreview` now lazy-loaded with `Suspense`. |
| `src/components/PanelEmptyState.tsx` | ✓ | ✓ | ✓ | ✓ | Unchanged since round 1. |
| `src/components/ThreeDPreviewPanel.tsx` | ✓ | ✓ | ✓ | ✓ | Unchanged since round 1. |
| `src/components/ThreeDViewer.tsx` | ✓ | ✓ | ✓ | ✓ | Unchanged since round 1. |
| `src/components/TimeSeriesPanel.tsx` | ✓ | ✓ | ✓ | ✓ | **Changed.** Takes `vm` prop instead of `assetId`. Still 179 lines (grew from 173) — still presentational only, no fetch mixed in (verified: no `useAsyncPanelData`/`await`/`.then` in the file); Nice Fix, unchanged conclusion from round 1. |
| `src/components/WorkOrdersPanel.tsx` | ✓ | ✓ | ✓ | ✓ | **Changed.** Takes `vm` prop instead of `assetId`. |
| `src/components/WorkspaceView.tsx` | ✓ | ✓ | ✓ | ✓ | Unchanged since round 1. |
| `src/context/ServicesContext.tsx` | ✓ | ✓ | ✓ | — (thin wrapper; `buildServices` itself is tested) | Unchanged since round 1. |
| `src/context/services.ts` | ✓ | ✓ | ✓ | ✓ | Unchanged since round 1. |
| `src/services/AssetHierarchyService.ts` | ✓ | ✓ | ✓ | ✓ | Unchanged since round 1. |
| `src/services/AssetService.ts` | ✓ | ✓ | ✓ | ✓ | Unchanged since round 1. |
| `src/services/DocumentsService.ts` | ✓ | ✓ | ✓ | ✓ | Unchanged since round 1. |
| `src/services/RecentlyViewedService.ts` | ✓ | ✓ | ✓ | ✓ | Unchanged since round 1. |
| `src/services/ThreeDService.ts` | ✓ | ✓ | ✓ | ✓ | Unchanged since round 1. |
| `src/services/TimeSeriesService.ts` | ✓ | ✓ | ✓ | ✓ | Unchanged since round 1. |
| `src/services/WorkOrdersService.ts` | ✓ | ✓ | ✓ | ✓ | Unchanged since round 1. |
| `src/services/assetTree.ts` | ✓ | ✓ | ✓ | ✓ | Unchanged since round 1. |
| `src/services/cdmViews.ts` | ✓ | ✓ | ✓ | — (pure constants, CLAUDE.md-exempt) | Unchanged since round 1. |
| `src/services/errors.ts` | ✓ | ✓ | ✓ | — (1-line predicate, 100% covered via other tests) | Unchanged since round 1. |
| `src/services/instanceKey.ts` | ✓ | ✓ | ✓ | — (1-line pure fn, 100% covered via other tests) | Unchanged since round 1. |
| `src/services/propertyReader.ts` | ✓ | ✓ | ✓ | ✓ | Unchanged since round 1. |
| `src/services/retryWithBackoff.ts` | ✓ | ✓ | ✓ | ✓ | Unchanged since round 1. |
| `src/services/types.ts` | ✓ | ✓ | ✓ | — (pure types, CLAUDE.md-exempt) | Unchanged since round 1. |
| `src/viewmodels/panelState.ts` | ✓ | ✓ | ✓ | — (pure types, CLAUDE.md-exempt) | Unchanged since round 1. |
| ~~`src/viewmodels/useAssetGovernanceViewModel.ts`~~ | — | — | — | — | **Deleted.** No longer needed — counts now derived from sibling panels' own `PanelState` via props (see `AssetDetailContent.tsx`, `AssetGovernanceScorecard.tsx`). Confirmed no dangling references (unused-file hunt: clean). |
| `src/viewmodels/useAssetHeaderViewModel.ts` | ✓ | ✓ | ✓ | ✓ | Unchanged since round 1. |
| `src/viewmodels/useAssetHierarchyViewModel.ts` | ✓ | ✓ | ✓ | ✓ | Unchanged since round 1. |
| `src/viewmodels/useAssetSearchViewModel.ts` | ✓ | ✓ | ✓ | ✓ | Unchanged since round 1. |
| `src/viewmodels/useAsyncPanelData.ts` | ✓ | ✓ | ✓ | ✓ | Unchanged since round 1. |
| `src/viewmodels/useDocumentsPanelViewModel.ts` | ✓ | ✓ | ✓ | ✓ | Unchanged since round 1. |
| `src/viewmodels/useRecentlyViewedViewModel.ts` | ✓ | ✓ | ✓ | ✓ | Unchanged since round 1. |
| `src/viewmodels/useThreeDPreviewViewModel.ts` | ✓ | ✓ | ✓ | ✓ | Unchanged since round 1. |
| `src/viewmodels/useTimeSeriesPanelViewModel.ts` | ✓ | ✓ | ✓ | ✓ | **Changed.** Added an asset-change reset for `selectedSeriesIds` (fixes a real stale-data bug: switching to an asset with no time series kept showing the previous asset's chart) via React's "adjust state during render" pattern, matching `useAsyncPanelData`'s existing deps-changed reset — not a `useEffect`. `WINDOW_OPTIONS` labels shortened (`24 hours` → `24h`, etc.) to fix a real segmented-control overflow when the navigator sidebar is expanded. |
| `src/viewmodels/useWorkOrdersPanelViewModel.ts` | ✓ | ✓ | ✓ | ✓ | Unchanged since round 1. |

## Vendored (not reviewed against this repo's conventions)

`src/cognite-file-viewer/{CogniteFileViewer,DocumentAnnotationOverlay,fileResolution,index,mimeTypes,types,useDocumentAnnotations,useFileResolver,useViewport}.{ts,tsx}` —
copied verbatim by the `integrate-file-viewer` skill, excluded from lint's hooks-purity rules and
from the coverage gate (both documented in `eslint.config.mjs`/`vitest.config.ts` with the same
rationale used in round 1 and `asset-360`). Unchanged since round 1.
