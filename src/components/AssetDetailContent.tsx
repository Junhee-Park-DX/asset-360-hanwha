import { useEffect } from 'react';

import type { AssetSummary, InstanceRef } from '../services/types';
import { useAssetHeaderViewModel } from '../viewmodels/useAssetHeaderViewModel';
import { useDocumentsPanelViewModel } from '../viewmodels/useDocumentsPanelViewModel';
import { useTimeSeriesPanelViewModel } from '../viewmodels/useTimeSeriesPanelViewModel';
import { useWorkOrdersPanelViewModel } from '../viewmodels/useWorkOrdersPanelViewModel';

import { AssetGovernanceScorecard } from './AssetGovernanceScorecard';
import { AssetHeader } from './AssetHeader';
import { DocumentsPanel } from './DocumentsPanel';
import { ThreeDPreviewPanel } from './ThreeDPreviewPanel';
import { TimeSeriesPanel } from './TimeSeriesPanel';
import { WorkOrdersPanel } from './WorkOrdersPanel';

interface AssetDetailContentProps {
  assetId: InstanceRef;
  /**
   * Owned by WorkspaceView (called once there, per CLAUDE.md §5) and passed
   * down rather than called again here — `useRecentlyViewedViewModel`'s
   * entries live in its own local `useState`, so a second call site here
   * would create an unsynced second copy that the navigator panel's list
   * wouldn't see update.
   */
  recordVisit: (asset: AssetSummary) => void;
}

/**
 * Fills in the workspace's content area once an asset is selected (FR-003,
 * FR-004). No "back" affordance — the navigator (search + tree) stays
 * visible alongside this content on the same page, so there's nowhere to
 * "return" from.
 *
 * The Time series/Work orders/Documents ViewModels are called once here
 * (per CLAUDE.md §5) and passed down to both their own panel and the
 * governance scorecard, which needs the same lists just to count them —
 * calling each ViewModel a second time inside the scorecard would double
 * the network calls on every asset selection.
 */
export function AssetDetailContent({ assetId, recordVisit }: AssetDetailContentProps) {
  const { state: headerState, refetch: refetchHeader } = useAssetHeaderViewModel(assetId);
  const timeSeriesVM = useTimeSeriesPanelViewModel(assetId);
  const workOrdersVM = useWorkOrdersPanelViewModel(assetId);
  const documentsVM = useDocumentsPanelViewModel(assetId);

  useEffect(() => {
    if (headerState.status === 'success') {
      recordVisit(headerState.data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recordVisit is service-backed and stable per render pass; re-running on every render would just re-write the same localStorage entry.
  }, [headerState]);

  const has3DMapping = headerState.status === 'success' && headerState.data.object3DRef !== null;

  return (
    <main className="flex flex-col gap-4 p-4">
      <AssetHeader state={headerState} onRetry={refetchHeader} />
      {headerState.status === 'success' ? (
        <AssetGovernanceScorecard
          timeSeriesState={timeSeriesVM.seriesListState}
          workOrdersState={workOrdersVM.state}
          documentsState={documentsVM.state}
          has3DMapping={has3DMapping}
        />
      ) : null}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section aria-label="Time series" className="rounded border">
          <h2 className="border-b p-3 text-sm font-medium">Time series</h2>
          <TimeSeriesPanel vm={timeSeriesVM} />
        </section>
        <section aria-label="Work orders" className="rounded border">
          <h2 className="border-b p-3 text-sm font-medium">Work orders</h2>
          <WorkOrdersPanel vm={workOrdersVM} />
        </section>
        <section aria-label="Documents" className="rounded border">
          <h2 className="border-b p-3 text-sm font-medium">Documents</h2>
          <DocumentsPanel vm={documentsVM} />
        </section>
      </div>
      {headerState.status === 'success' ? <ThreeDPreviewPanel assetId={assetId} has3DMapping={has3DMapping} /> : null}
    </main>
  );
}
