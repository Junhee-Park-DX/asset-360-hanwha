import { useServices } from '../context/services';
import { buildAssetTree, type AssetTreeNode } from '../services/assetTree';

import type { PanelState } from './panelState';
import { useAsyncPanelData } from './useAsyncPanelData';

export interface AssetHierarchy {
  tree: AssetTreeNode[];
  /** True when the underlying fetch hit its page cap — the tree may be missing assets. */
  truncated: boolean;
}

export interface AssetHierarchyViewModel {
  state: PanelState<AssetHierarchy>;
}

/** Dashboard: the workspace's asset parent/child structure, as a tree. */
export function useAssetHierarchyViewModel(): AssetHierarchyViewModel {
  const { assetHierarchyService } = useServices();
  const { state } = useAsyncPanelData(async (): Promise<AssetHierarchy> => {
    const { nodes, truncated } = await assetHierarchyService.fetchAll();
    return { tree: buildAssetTree(nodes), truncated };
  }, [assetHierarchyService]);
  return { state };
}
