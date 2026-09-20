# Findings: Asset 360 Investigation Workspace (Hanwha) — round 2

## Config inspected

- Coverage config file(s): `vitest.config.ts`
- Production paths excluded from coverage: `src/cognite-file-viewer/**` only — the
  `integrate-file-viewer` skill's vendored, not-authored-by-this-app bundle (unchanged from round
  1, same treatment `asset-360` established). No other `src/` path is excluded.
- Tests excluded from the test run: none beyond Vitest's own defaults (`configDefaults.exclude`)
  plus `.claude/**`/`.agents/**` (pulled review-skill copies, not app tests).

## Searches

| Check | Hits (file:line or none) |
| ----- | ------------------------ |
| ErrorBoundary | `src/App.tsx:13,134,138`; `src/components/AppErrorBoundary.tsx` (class + `getDerivedStateFromError` + `componentDidCatch`) — present and wired at the app root. |
| TODO/FIXME/HACK/XXX | none |
| `useEffect` without cleanup | none — every hit has a cleanup function or is a plain derived-state effect with no subscription/timer: `App.tsx:97` (sync-to-host, no subscription to clean up), `App.tsx:123` (cancelled flag), `useAssetSearchViewModel.ts:37` (`clearTimeout`), `useAsyncPanelData.ts:55` (cancelled flag), `AssetDetailContent.tsx:46` (plain derived write, no subscription). `useTimeSeriesPanelViewModel.ts`'s hit is a comment referencing "rather than a `useEffect`" — not actual usage; that file uses the render-time-adjustment pattern instead. |
| coverage/test exclude | `src/cognite-file-viewer/**` only (see above) — allowed per round-1 precedent (vendored bundle, not this app's authored code). |
| CDF Raw | none — 2.6 is N/A |
| `instances.list/query/search` | `TimeSeriesService.ts:37` (search), `DocumentsService.ts:38` (search), `WorkOrdersService.ts:34` (search), `WorkOrdersService.ts:49` (retrieve), `AssetHierarchyService.ts:54` (search), `AssetService.ts:58` (search), `AssetService.ts:68` (retrieve), `ThreeDService.ts:36` (**list**, not search/query). |
| QueuedTaskRunner / 429 | No `QueuedTaskRunner`/`cdfTaskRunner` concurrency cap anywhere (same gap as round 1). `retryWithBackoff.ts` implements exponential backoff + jitter + `Retry-After` handling, bounded at `MAX_RETRIES`, and every panel fetch routes through it via `useAsyncPanelData.ts:55-59`. |
| `any` / `vi.mock` | Zero production `any`/`as any`/`as unknown as` — every hit is in a `*.test.ts(x)` file (test-mock exception per CLAUDE.md §7). `vi.mock` calls: 14 across 7 test files; all but 5 have a direct explanatory comment (see "vi.mock without a comment" below). |
| lint / tsc | `npm run lint` — 0 errors, 0 warnings. `npx tsc --noEmit` — 0 errors. |
| CogniteClient / DI / ViewModel | No `new CogniteClient` in production code — only in `App.test.tsx`'s `vi.fn` factory (test-only). DI via `ServicesReactContext`/`useContext` in `src/context/services.ts`; no hook in `src/viewmodels/` imports a service or the SDK directly — all go through `useServices()`. 8 `useXViewModel` hooks in `src/viewmodels/`, all stateless composition over a shared storage layer (`useAsyncPanelData`) per CLAUDE.md §5. |
| unused files / console.log | Zero `console.log`/`console.debug` in `src/`. Zero unused production files (ran the possibly-unused-file hunt across all 41 non-test, non-vendored files — 0 hits), confirming the `useAssetGovernanceViewModel.ts` deletion left no dangling references and `DocumentPreview.tsx` is correctly wired in. |
| components > 150 lines | `src/cognite-file-viewer/CogniteFileViewer.tsx` (483, vendored, exempt), `src/cognite-file-viewer/DocumentAnnotationOverlay.tsx` (230, vendored, exempt), `src/components/TimeSeriesPanel.tsx` (179, up from 173 in round 1 — still presentational only, no fetch mixed in; verified no `useAsyncPanelData`/`await`/`.then` in the file). |

## Additional findings from this round's diff

### `vi.mock` without its own comment (1.6)

5 of 14 `vi.mock` calls rely on a comment attached to a *different* mock in the same file rather
than having their own:

- `src/components/WorkspaceView.test.tsx:30` (`@cognite/app-sdk/react`) and `:34` (`./ThreeDViewer`)
- `src/components/DocumentsPanel.test.tsx:18` (`../cognite-file-viewer`)
- `src/components/ThreeDViewer.test.tsx:29` (`@cognite/app-sdk/react`)

The rationale in each case is inferable from context (mocking a third-party/WebGL-dependent
module that can't run in `happy-dom`), but CLAUDE.md's own bar ("add a short reason when `vi.mock`
is unavoidable") expects a reason attached to each call, not implied by proximity. Minor —
Nice Fix.

### New component without its own colocated test (CLAUDE.md §6)

`src/components/DocumentPreview.tsx` is new this round and has real logic (JSX composition, an
`onClick` handler, a dependency on `useCogniteSdk()`), but has no `DocumentPreview.test.tsx`. It is
fully exercised indirectly — 2/2 statements, 100% — via `DocumentsPanel.test.tsx`'s
"opens an inline preview for a PDF" test, which lazy-loads and renders it for real. Coverage is not
at risk, but CLAUDE.md §6 expects "every new module with logic (service, hook, **component**,
utility)" to include its own `*.test.ts(x)` file in the same changeset. Nice Fix.

## Must / should / nice

No Must Fix or Should Fix items found this round (same as round 1).

- [ ] Add a `src/components/DocumentPreview.test.tsx` with its own direct render test, rather than
      relying solely on `DocumentsPanel.test.tsx`'s indirect coverage — `src/components/DocumentPreview.tsx` —
      criterion 1.6 / CLAUDE.md §6 — Nice Fix
- [ ] Attach a direct explanatory comment to each `vi.mock` call rather than relying on a
      neighboring mock's comment — `src/components/WorkspaceView.test.tsx:30,34`,
      `src/components/DocumentsPanel.test.tsx:18`, `src/components/ThreeDViewer.test.tsx:29` —
      criterion 1.6 — Nice Fix
- [ ] No `QueuedTaskRunner`/concurrency cap around CDF calls; TanStack-style retry-with-backoff
      exists (`retryWithBackoff.ts`) but isn't a true concurrency cap — `src/viewmodels/useAsyncPanelData.ts` —
      criterion 2.5 — Nice Fix (unchanged from round 1)
- [ ] `react`/`react-dom` 1 major behind (18.3.1 → 19.3.0), `@tanstack/react-table` 1 major behind
      (8.21.3 → 9.2.4), `react-pdf` 2 majors behind (9.2.1 → 11.0.0, pinned/vendored dependency
      via `integrate-file-viewer`) — criterion 1.3 — Nice Fix (unchanged from round 1)
- [ ] `src/components/TimeSeriesPanel.tsx` at 179 lines (over the 150-line guideline), presentational
      only — criterion 1.5 — Nice Fix (unchanged from round 1, grew by 6 lines)
- [ ] 4 moderate `vitest`/`@vitest/mocker` CVEs (dev-only, path-traversal in the dev-server mock
      redirect — not shipped to users) — criterion 1.3 — Nice Fix (unchanged from round 1)
