import type { CogniteClient, NodeOrEdge } from '@cognite/sdk';

import { COGNITE_ASSET_VIEW } from './cdmViews';
import { readDirectRelationList, readString, readViewProperties } from './propertyReader';

export interface AssetHierarchyNode {
  space: string;
  externalId: string;
  name: string;
  parentExternalId: string | null;
}

export interface AssetHierarchyFetchResult {
  nodes: AssetHierarchyNode[];
  /** True when the fetch hit FETCH_LIMIT — the tree built from `nodes` may be missing assets. */
  truncated: boolean;
}

export interface AssetHierarchyService {
  fetchAll(): Promise<AssetHierarchyFetchResult>;
}

// The DMS search endpoint caps a single page at 1000 items. This dataset has
// ~1,100 assets, so a v1 tree may omit a handful of the newest/last ones
// rather than paging through a second request — acceptable for a workspace
// structure overview, not for anything requiring a complete asset list.
const FETCH_LIMIT = 1000;

/**
 * This dataset doesn't populate a separate `parent` direct-relation property
 * (verified directly against Fusion's own Properties panel for a live
 * asset — it isn't listed) — only `path`, the self-inclusive ancestor chain
 * (root ... immediate parent, self), which the header's breadcrumb already
 * reads. The immediate parent is therefore `path`'s second-to-last entry;
 * a path of length 1 (or 0) means the asset is a root.
 */
function toHierarchyNode(node: NodeOrEdge): AssetHierarchyNode {
  const properties = readViewProperties(node, COGNITE_ASSET_VIEW);
  const path = readDirectRelationList(properties, 'path');
  const parentExternalId = path.length >= 2 ? path[path.length - 2] : null;
  return {
    space: node.space,
    externalId: node.externalId,
    name: readString(properties, 'name', node.externalId),
    parentExternalId,
  };
}

/** Powers the Dashboard's asset hierarchy tree (parent/child structure of the workspace). */
export class CogniteAssetHierarchyService implements AssetHierarchyService {
  constructor(private readonly client: CogniteClient) {}

  async fetchAll(): Promise<AssetHierarchyFetchResult> {
    const response = await this.client.instances.search({
      view: COGNITE_ASSET_VIEW,
      instanceType: 'node',
      limit: FETCH_LIMIT,
    });
    return { nodes: response.items.map(toHierarchyNode), truncated: response.items.length === FETCH_LIMIT };
  }
}
