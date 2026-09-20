import { useServices } from '../context/services';
import type { DocumentSummary, InstanceRef } from '../services/types';

import type { PanelState } from './panelState';
import { useAsyncPanelData } from './useAsyncPanelData';

export interface DocumentsPanelViewModel {
  state: PanelState<DocumentSummary[]>;
  refetch: () => void;
  download: (document: DocumentSummary) => Promise<string | null>;
}

/** Documents panel (FR-009, FR-010): CogniteFile instances for the asset. */
export function useDocumentsPanelViewModel(assetId: InstanceRef): DocumentsPanelViewModel {
  const { documentsService } = useServices();
  const { state, refetch } = useAsyncPanelData(
    () => documentsService.listForAsset(assetId),
    [documentsService, assetId.space, assetId.externalId]
  );

  return { state, refetch, download: (document) => documentsService.getDownloadUrl(document.instanceId) };
}
