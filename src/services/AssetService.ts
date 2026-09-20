import type { CogniteClient, NodeOrEdge } from '@cognite/sdk';

import { COGNITE_ASSET_VIEW } from './cdmViews';
import { readDirectRelationPath, readDirectRelationRef, readString, readViewProperties } from './propertyReader';
import type { AssetSummary, InstanceRef } from './types';

export interface AssetService {
  search(query: string): Promise<AssetSummary[]>;
  retrieve(instanceId: InstanceRef): Promise<AssetSummary | null>;
}

function toAssetSummary(node: NodeOrEdge): AssetSummary {
  const properties = readViewProperties(node, COGNITE_ASSET_VIEW);
  return {
    instanceId: { space: node.space, externalId: node.externalId },
    tag: node.externalId,
    name: readString(properties, 'name', node.externalId),
    description: readString(properties, 'description'),
    type: readDirectRelationPath(properties, 'type'),
    parentPath: readDirectRelationPath(properties, 'path'),
    object3DRef: readDirectRelationRef(properties, 'object3D'),
  };
}

const SEARCH_LIMIT = 25;

/**
 * The DMS full-text `/search` endpoint ranks by text-match score across all
 * indexed fields, so a result whose *description* merely mentions the query
 * (e.g. a space heater's description naming a nearby compressor tag) can
 * outrank the asset whose *tag* actually equals it. Re-rank client-side by a
 * simple, explainable tier: exact tag match, then tag prefix, then name
 * prefix, then tag/name substring, then everything else — stable within each
 * tier so the API's own relevance ordering still breaks ties.
 */
function relevanceTier(asset: AssetSummary, queryLower: string): number {
  const tagLower = asset.tag.toLowerCase();
  const nameLower = asset.name.toLowerCase();
  if (tagLower === queryLower) return 0;
  if (tagLower.startsWith(queryLower)) return 1;
  if (nameLower.startsWith(queryLower)) return 2;
  if (tagLower.includes(queryLower)) return 3;
  if (nameLower.includes(queryLower)) return 4;
  return 5;
}

export function rankByRelevance(assets: AssetSummary[], query: string): AssetSummary[] {
  const queryLower = query.trim().toLowerCase();
  return [...assets].sort((a, b) => relevanceTier(a, queryLower) - relevanceTier(b, queryLower));
}

export class CogniteAssetService implements AssetService {
  constructor(private readonly client: CogniteClient) {}

  async search(query: string): Promise<AssetSummary[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const response = await this.client.instances.search({
      view: COGNITE_ASSET_VIEW,
      query: trimmed,
      instanceType: 'node',
      limit: SEARCH_LIMIT,
    });
    return rankByRelevance(response.items.map(toAssetSummary), trimmed);
  }

  async retrieve(instanceId: InstanceRef): Promise<AssetSummary | null> {
    const response = await this.client.instances.retrieve({
      sources: [{ source: COGNITE_ASSET_VIEW }],
      items: [{ instanceType: 'node', externalId: instanceId.externalId, space: instanceId.space }],
    });
    const [node] = response.items;
    return node ? toAssetSummary(node) : null;
  }
}
