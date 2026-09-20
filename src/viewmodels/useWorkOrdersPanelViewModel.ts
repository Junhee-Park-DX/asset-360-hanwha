import { useServices } from '../context/services';
import type { InstanceRef, WorkOrderSummary } from '../services/types';

import type { PanelState } from './panelState';
import { useAsyncPanelData } from './useAsyncPanelData';

export interface WorkOrdersPanelViewModel {
  state: PanelState<WorkOrderSummary[]>;
  refetch: () => void;
}

/** Work orders panel (FR-007): recent CogniteActivity instances for the asset. */
export function useWorkOrdersPanelViewModel(assetId: InstanceRef): WorkOrdersPanelViewModel {
  const { workOrdersService } = useServices();
  const { state, refetch } = useAsyncPanelData(
    () => workOrdersService.listForAsset(assetId),
    [workOrdersService, assetId.space, assetId.externalId]
  );
  return { state, refetch };
}
