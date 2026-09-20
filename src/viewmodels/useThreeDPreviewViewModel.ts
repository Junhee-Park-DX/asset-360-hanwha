import { useServices } from '../context/services';
import type { InstanceRef } from '../services/types';

import type { PanelState } from './panelState';
import { useAsyncPanelData } from './useAsyncPanelData';

const UNMAPPED_STATE: PanelState<InstanceRef | null> = { status: 'success', data: null };

export interface ThreeDPreviewViewModel {
  /** `data: null` means "nothing to preview" — either the asset has no 3D mapping, or the workspace has no CAD model at all. */
  state: PanelState<InstanceRef | null>;
  refetch: () => void;
}

/**
 * 3D preview panel (FR-019). `has3DMapping` comes from the already-fetched
 * asset header's `object3DRef` (per CLAUDE.md §5, not re-fetched here) —
 * when false, `state` is the fixed "nothing to preview" value regardless of
 * `fetchState`, so an unmapped asset never shows a loading flash for a fetch
 * whose result it's about to discard. `useAsyncPanelData` owns the actual
 * loading/error/no-access transitions.
 */
export function useThreeDPreviewViewModel(assetId: InstanceRef, has3DMapping: boolean): ThreeDPreviewViewModel {
  const { threeDService } = useServices();
  const { state: fetchState, refetch } = useAsyncPanelData(
    () => (has3DMapping ? threeDService.getCadRevision() : Promise.resolve(null)),
    [threeDService, assetId.space, assetId.externalId, has3DMapping]
  );

  return { state: has3DMapping ? fetchState : UNMAPPED_STATE, refetch };
}
