# File inventory — asset-360-hanwha, round 1

Every `.ts`/`.tsx` under `src/`, excluding `node_modules`, `dist`, `.cognite-bundles`.
`src/cognite-file-viewer/**` (9 files) is the `integrate-file-viewer` skill's vendored bundle —
listed separately at the end, not authored/maintained by this app (same treatment as `asset-360`).

| File | Structure | Quality | Patterns | Tests | Notes |
| --- | --- | --- | --- | --- | --- |
| `src/App.tsx` | ✓ | ✓ | ✓ | ✓ | Host-sync via a single effect keyed on `state`, not scattered imperative calls — see review-findings.md. |
| `src/main.tsx` | ✓ | ✓ | ✓ | — (bootstrap, exempt) | No `React.StrictMode` — intentional, documented, required by `RevealWidget`. |
| `src/components/AppErrorBoundary.tsx` | ✓ | ✓ | ✓ | ✓ | FR-016 app-level boundary. |
| `src/components/AssetDetailContent.tsx` | ✓ | ✓ | ✓ | ✓ | `recordVisit` passed as a prop, not a second `useRecentlyViewedViewModel()` call — avoids the CLAUDE.md §5 anti-pattern. |
| `src/components/AssetGovernanceScorecard.tsx` | ✓ | ✓ | ✓ | ✓ | FR-020 scorecard; `warning` vs `fjord` Badge variant for gap-flagging. |
| `src/components/AssetHeader.tsx` | ✓ | ✓ | ✓ | ✓ | Presentational only, state/onRetry as props. |
| `src/components/AssetHierarchyTree.tsx` | ✓ | ✓ | ✓ | ✓ | Now selectable (FR-018) — extended from the read-only version in `asset-360`. |
| `src/components/AssetNavigatorPanel.tsx` | ✓ | ✓ | ✓ | ✓ | Foldable navigator; recently-viewed + tree. |
| `src/components/DocumentsPanel.tsx` | ✓ | ✓ | ✓ | ✓ | FR-009/010; empty for every asset in this dataset (documented, verified, expected). |
| `src/components/PanelEmptyState.tsx` | ✓ | ✓ | ✓ | ✓ | Shared loading/empty/error/no-access pattern. |
| `src/components/ThreeDPreviewPanel.tsx` | ✓ | ✓ | ✓ | ✓ | FR-019 wrapper; lazy-loads `ThreeDViewer`. |
| `src/components/ThreeDViewer.tsx` | ✓ | ✓ | ✓ | ✓ | Imperative `RevealWidgetController` driver per the reveal-3d skill's pattern. |
| `src/components/TimeSeriesPanel.tsx` | ✓ | ✓ | ✓ | ✓ | 173 lines (over 150) — presentational only, no fetch mixed in; see review-findings.md (Nice Fix). |
| `src/components/WorkOrdersPanel.tsx` | ✓ | ✓ | ✓ | ✓ | FR-007/008. |
| `src/components/WorkspaceView.tsx` | ✓ | ✓ | ✓ | ✓ | The single merged page (FR-017); composes navigator + search + detail. |
| `src/context/ServicesContext.tsx` | ✓ | ✓ | ✓ | — (thin wrapper; `buildServices` itself is tested) | |
| `src/context/services.ts` | ✓ | ✓ | ✓ | ✓ | DI registry; no audit/org-stats services carried over from `asset-360`. |
| `src/services/AssetHierarchyService.ts` | ✓ | ✓ | ✓ | ✓ | Now carries `space` per node (needed for tree selection). |
| `src/services/AssetService.ts` | ✓ | ✓ | ✓ | ✓ | `rankByRelevance` re-ranking; now also reads `object3DRef`. |
| `src/services/DocumentsService.ts` | ✓ | ✓ | ✓ | ✓ | |
| `src/services/RecentlyViewedService.ts` | ✓ | ✓ | ✓ | ✓ | FR-012. |
| `src/services/ThreeDService.ts` | ✓ | ✓ | ✓ | ✓ | `instances.list` on the base `Cognite3DRevision` view, filtered `type: CAD, status: Done` — see review-findings.md for why, verified live. |
| `src/services/TimeSeriesService.ts` | ✓ | ✓ | ✓ | ✓ | |
| `src/services/WorkOrdersService.ts` | ✓ | ✓ | ✓ | ✓ | |
| `src/services/assetTree.ts` | ✓ | ✓ | ✓ | ✓ | Pure function. |
| `src/services/cdmViews.ts` | ✓ | ✓ | ✓ | — (pure constants, CLAUDE.md-exempt) | |
| `src/services/errors.ts` | ✓ | ✓ | ✓ | — (1-line predicate, 100% covered via other tests) | |
| `src/services/instanceKey.ts` | ✓ | ✓ | ✓ | — (1-line pure fn, 100% covered via other tests) | |
| `src/services/propertyReader.ts` | ✓ | ✓ | ✓ | ✓ | |
| `src/services/retryWithBackoff.ts` | ✓ | ✓ | ✓ | ✓ | Exponential backoff + jitter + `Retry-After` on 429. |
| `src/services/types.ts` | ✓ | ✓ | ✓ | — (pure types, CLAUDE.md-exempt) | |
| `src/viewmodels/panelState.ts` | ✓ | ✓ | ✓ | — (pure types, CLAUDE.md-exempt) | |
| `src/viewmodels/useAssetGovernanceViewModel.ts` | ✓ | ✓ | ✓ | ✓ | |
| `src/viewmodels/useAssetHeaderViewModel.ts` | ✓ | ✓ | ✓ | ✓ | |
| `src/viewmodels/useAssetHierarchyViewModel.ts` | ✓ | ✓ | ✓ | ✓ | |
| `src/viewmodels/useAssetSearchViewModel.ts` | ✓ | ✓ | ✓ | ✓ | `query`/`setQuery` host-synced, taken as params rather than owned locally — improvement over `asset-360`. |
| `src/viewmodels/useAsyncPanelData.ts` | ✓ | ✓ | ✓ | ✓ | Shared fetch/loading/error/no-access state machine + 429 backoff. |
| `src/viewmodels/useDocumentsPanelViewModel.ts` | ✓ | ✓ | ✓ | ✓ | |
| `src/viewmodels/useRecentlyViewedViewModel.ts` | ✓ | ✓ | ✓ | ✓ | |
| `src/viewmodels/useThreeDPreviewViewModel.ts` | ✓ | ✓ | ✓ | ✓ | Delegates to `useAsyncPanelData`; `has3DMapping` gates the returned state, not a hand-rolled effect. |
| `src/viewmodels/useTimeSeriesPanelViewModel.ts` | ✓ | ✓ | ✓ | ✓ | FR-005/006/006a/006b. |
| `src/viewmodels/useWorkOrdersPanelViewModel.ts` | ✓ | ✓ | ✓ | ✓ | |

## Vendored (not reviewed against this repo's conventions)

`src/cognite-file-viewer/{CogniteFileViewer,DocumentAnnotationOverlay,fileResolution,index,mimeTypes,types,useDocumentAnnotations,useFileResolver,useViewport}.{ts,tsx}` —
copied verbatim by the `integrate-file-viewer` skill, excluded from lint's hooks-purity rules and
from the coverage gate (both documented in `eslint.config.mjs`/`vitest.config.ts` with the same
rationale used in `asset-360`).
