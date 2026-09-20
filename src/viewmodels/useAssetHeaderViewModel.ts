import { useServices } from '../context/services';
import type { AssetSummary, InstanceRef } from '../services/types';

import type { PanelState } from './panelState';
import { useAsyncPanelData } from './useAsyncPanelData';

export interface AssetHeaderViewModel {
  state: PanelState<AssetSummary>;
  refetch: () => void;
}

async function fetchAsset(
  assetService: { retrieve: (id: InstanceRef) => Promise<AssetSummary | null> },
  assetId: InstanceRef
): Promise<AssetSummary> {
  const asset = await assetService.retrieve(assetId);
  if (!asset) throw new Error(`Asset ${assetId.space}:${assetId.externalId} was not found`);
  return asset;
}

/**
 * Asset header (FR-004): tag, name, description, type sourced from
 * CogniteAsset.
 */
export function useAssetHeaderViewModel(assetId: InstanceRef): AssetHeaderViewModel {
  const { assetService } = useServices();
  const { state, refetch } = useAsyncPanelData(
    () => fetchAsset(assetService, assetId),
    [assetService, assetId.space, assetId.externalId]
  );
  return { state, refetch };
}
