import { useServices } from '../context/services';
import type { AssetConnections, InstanceRef } from '../services/types';

import type { PanelState } from './panelState';
import { useAsyncPanelData } from './useAsyncPanelData';

export interface AssetGovernanceViewModel {
  state: PanelState<AssetConnections>;
}

/**
 * Data-completeness governance scorecard (FR-020): counts how many time
 * series, work orders, and documents are actually linked to this asset, plus
 * whether it has a 3D mapping — so gaps in the digital twin are visible at a
 * glance instead of discovered by clicking through each panel. `has3DMapping`
 * is derived from the asset header's already-fetched `object3DRef` (passed
 * in) rather than re-fetched here, per CLAUDE.md §5's "call once" rule.
 */
export function useAssetGovernanceViewModel(assetId: InstanceRef, has3DMapping: boolean): AssetGovernanceViewModel {
  const { timeSeriesService, workOrdersService, documentsService } = useServices();

  const { state } = useAsyncPanelData(async (): Promise<AssetConnections> => {
    const [timeSeries, workOrders, documents] = await Promise.all([
      timeSeriesService.listForAsset(assetId),
      workOrdersService.listForAsset(assetId),
      documentsService.listForAsset(assetId),
    ]);
    return {
      timeSeriesCount: timeSeries.length,
      workOrdersCount: workOrders.length,
      documentsCount: documents.length,
      has3DMapping,
    };
  }, [timeSeriesService, workOrdersService, documentsService, assetId.space, assetId.externalId, has3DMapping]);

  return { state };
}
