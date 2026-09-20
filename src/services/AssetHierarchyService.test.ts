import type { CogniteClient, NodeOrEdge } from '@cognite/sdk';
import { describe, expect, it, vi } from 'vitest';

import { CogniteAssetHierarchyService } from './AssetHierarchyService';

function makeNode(externalId: string, name: string, path: string[]): NodeOrEdge {
  return {
    instanceType: 'node',
    space: 'sp_assets',
    externalId,
    createdTime: 0,
    lastUpdatedTime: 0,
    version: 1,
    properties: {
      cdf_cdm: {
        'CogniteAsset/v1': {
          name,
          path: path.map((id) => ({ space: 'sp_assets', externalId: id })),
        },
      },
    },
  } as NodeOrEdge;
}

describe('CogniteAssetHierarchyService', () => {
  it('derives each parent from the second-to-last entry of the self-inclusive path (no separate `parent` property in this dataset)', async () => {
    const client = {
      instances: {
        search: vi.fn(() =>
          Promise.resolve({
            items: [
              makeNode('VAL', 'Valhall', ['VAL']),
              makeNode('23', '1st stage compression', ['VAL', '23']),
              makeNode('23-KA-9101', 'Compressor', ['VAL', '23', '23-KA-9101']),
            ],
          })
        ),
      },
    } as unknown as CogniteClient;
    const service = new CogniteAssetHierarchyService(client);

    const result = await service.fetchAll();

    expect(result.nodes).toEqual([
      { space: 'sp_assets', externalId: 'VAL', name: 'Valhall', parentExternalId: null },
      { space: 'sp_assets', externalId: '23', name: '1st stage compression', parentExternalId: 'VAL' },
      { space: 'sp_assets', externalId: '23-KA-9101', name: 'Compressor', parentExternalId: '23' },
    ]);
    expect(result.truncated).toBe(false);
    expect(client.instances.search).toHaveBeenCalledWith(
      expect.objectContaining({ view: expect.objectContaining({ externalId: 'CogniteAsset' }), instanceType: 'node', limit: 1000 })
    );
  });

  it('treats an asset with an empty or missing path as a root', async () => {
    const client = {
      instances: { search: vi.fn(() => Promise.resolve({ items: [makeNode('ORPHAN', 'Orphan', [])] })) },
    } as unknown as CogniteClient;
    const service = new CogniteAssetHierarchyService(client);

    const result = await service.fetchAll();

    expect(result.nodes).toEqual([{ space: 'sp_assets', externalId: 'ORPHAN', name: 'Orphan', parentExternalId: null }]);
  });

  it('reports truncated when the fetch returns exactly the page limit (1000)', async () => {
    const items = Array.from({ length: 1000 }, (_, index) => makeNode(`A-${index}`, `Asset ${index}`, [`A-${index}`]));
    const client = { instances: { search: vi.fn(() => Promise.resolve({ items })) } } as unknown as CogniteClient;
    const service = new CogniteAssetHierarchyService(client);

    const result = await service.fetchAll();

    expect(result.truncated).toBe(true);
    expect(result.nodes).toHaveLength(1000);
  });
});
