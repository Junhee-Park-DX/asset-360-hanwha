import { lazy, Suspense } from 'react';

import type { InstanceRef } from '../services/types';
import { useThreeDPreviewViewModel } from '../viewmodels/useThreeDPreviewViewModel';

import { PanelEmptyState } from './PanelEmptyState';

// Lazy-loaded so @cognite/reveal-widget/three.js only enter the bundle once
// an asset with a real 3D mapping is actually selected, per the reveal-3d
// skill's own "lazy-load canvas-heavy viewer content" rule.
const ThreeDViewer = lazy(() => import('./ThreeDViewer'));

/**
 * 3D preview panel (FR-019): shows the selected asset's position in the
 * workspace's CAD model when it has a 3D mapping, so an analyst can visually
 * confirm they're looking at the right physical equipment. Independent
 * loading/empty/error/no-access states per FR-011, extended to this panel.
 */
export function ThreeDPreviewPanel({ assetId, has3DMapping }: { assetId: InstanceRef; has3DMapping: boolean }) {
  const { state, refetch } = useThreeDPreviewViewModel(assetId, has3DMapping);

  return (
    <section aria-label="3D preview" className="rounded border">
      <h2 className="border-b p-3 text-sm font-medium">3D preview</h2>
      {state.status === 'loading' ? (
        <PanelEmptyState kind="loading" emptyMessage="" />
      ) : state.status === 'success' && state.data ? (
        <Suspense fallback={<PanelEmptyState kind="loading" emptyMessage="" />}>
          <ThreeDViewer revision={state.data} assetId={assetId} />
        </Suspense>
      ) : (
        <PanelEmptyState
          kind={state.status === 'success' ? 'empty' : state.status}
          emptyMessage="This asset has no 3D model mapped yet."
          errorMessage={state.status === 'error' ? state.message : undefined}
          onRetry={refetch}
        />
      )}
    </section>
  );
}
