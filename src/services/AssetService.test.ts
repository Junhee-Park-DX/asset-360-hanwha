import type { CogniteClient, NodeOrEdge } from '@cognite/sdk';
import { HttpError } from '@cognite/sdk';
import { describe, expect, it, vi } from 'vitest';

import { CogniteAssetService, rankByRelevance } from './AssetService';
import type { AssetSummary } from './types';

function makeNode(overrides: Partial<NodeOrEdge> = {}, externalId = 'PUMP-101'): NodeOrEdge {
  return {
    instanceType: 'node',
    space: 'sp_assets',
    externalId,
    createdTime: 0,
    lastUpdatedTime: 0,
    properties: {
      cdf_cdm: {
        'CogniteAsset/v1': {
          name: 'Pump 101',
          description: 'Main feed pump',
          type: { space: 'cdf_cdm', externalId: 'Pump' },
          path: [{ space: 'sp_assets', externalId: 'PLANT-A' }],
        },
      },
    },
    ...overrides,
  } as NodeOrEdge;
}

function makeClient(overrides: Partial<CogniteClient['instances']> = {}) {
  return {
    instances: {
      search: vi.fn(() => Promise.resolve({ items: [makeNode()] })),
      retrieve: vi.fn(() => Promise.resolve({ items: [makeNode()] })),
      ...overrides,
    },
  } as unknown as CogniteClient;
}

describe('CogniteAssetService', () => {
  describe('search', () => {
    it('sends a query-based search request against the CogniteAsset view', async () => {
      const client = makeClient();
      const service = new CogniteAssetService(client);

      await service.search('PUMP-1');

      expect(client.instances.search).toHaveBeenCalledWith(
        expect.objectContaining({
          view: expect.objectContaining({ externalId: 'CogniteAsset', space: 'cdf_cdm', version: 'v1' }),
          query: 'PUMP-1',
          instanceType: 'node',
        })
      );
    });

    it('parses the response into ranked asset summaries with disambiguating context', async () => {
      const client = makeClient();
      const service = new CogniteAssetService(client);

      const results = await service.search('pump');

      expect(results).toEqual([
        {
          instanceId: { space: 'sp_assets', externalId: 'PUMP-101' },
          tag: 'PUMP-101',
          name: 'Pump 101',
          description: 'Main feed pump',
          type: 'Pump',
          parentPath: 'PLANT-A',
          object3DRef: null,
        },
      ]);
    });

    it('parses a populated object3D relation into object3DRef (FR-019)', async () => {
      const client = makeClient({
        search: vi.fn(() =>
          Promise.resolve({
            items: [
              makeNode({
                properties: {
                  cdf_cdm: {
                    'CogniteAsset/v1': {
                      name: 'Pump 101',
                      object3D: { space: 'valhall-three_d', externalId: 'obj-1' },
                    },
                  },
                },
              }),
            ],
          })
        ),
      });
      const service = new CogniteAssetService(client);

      const results = await service.search('pump');

      expect(results[0].object3DRef).toEqual({ space: 'valhall-three_d', externalId: 'obj-1' });
    });

    it('returns no results for a blank query without calling the API', async () => {
      const client = makeClient();
      const service = new CogniteAssetService(client);

      const results = await service.search('   ');

      expect(results).toEqual([]);
      expect(client.instances.search).not.toHaveBeenCalled();
    });

    it('propagates an HttpError from the SDK on a non-OK response', async () => {
      const client = makeClient({
        search: vi.fn(() => Promise.reject(new HttpError(403, { error: { code: 403, message: 'Forbidden' } }, {}))),
      });
      const service = new CogniteAssetService(client);

      await expect(service.search('pump')).rejects.toThrow(HttpError);
    });

    it('ranks a result whose tag exactly matches the query above one that only mentions it in the description', async () => {
      const client = makeClient({
        search: vi.fn(() =>
          Promise.resolve({
            items: [
              makeNode({ properties: { cdf_cdm: { 'CogniteAsset/v1': { name: '48-FE-9189', description: 'VRD - RIO CABINET SPACE HEATER (23-KA-9101)' } } } }, '48-FE-9189'),
              makeNode({ properties: { cdf_cdm: { 'CogniteAsset/v1': { name: '23-KA-9101', description: 'VRD - 1ST STAGE COMPRESSOR' } } } }, '23-KA-9101'),
            ],
          })
        ),
      });
      const service = new CogniteAssetService(client);

      const results = await service.search('23-KA-9101');

      expect(results[0].tag).toBe('23-KA-9101');
      expect(results[1].tag).toBe('48-FE-9189');
    });
  });

  describe(rankByRelevance.name, () => {
    function asset(overrides: Partial<AssetSummary>): AssetSummary {
      return {
        instanceId: { space: 'sp', externalId: 'x' },
        tag: '',
        name: '',
        description: '',
        type: '',
        parentPath: '',
        object3DRef: null,
        ...overrides,
      };
    }

    it('puts an exact tag match first', () => {
      const exact = asset({ tag: '23-KA-9101', name: '23-KA-9101' });
      const mention = asset({ tag: '48-FE-9189', name: '48-FE-9189', description: 'mentions 23-KA-9101' });

      expect(rankByRelevance([mention, exact], '23-KA-9101')).toEqual([exact, mention]);
    });

    it('ranks a tag prefix match above a name-only match', () => {
      const tagPrefix = asset({ tag: 'PUMP-101-A', name: 'Something else' });
      const nameMatch = asset({ tag: 'X-1', name: 'PUMP-101 motor' });

      expect(rankByRelevance([nameMatch, tagPrefix], 'PUMP-101')).toEqual([tagPrefix, nameMatch]);
    });

    it('is case-insensitive', () => {
      const exact = asset({ tag: 'pump-101', name: 'pump-101' });

      expect(rankByRelevance([exact], 'PUMP-101')).toEqual([exact]);
    });

    it('preserves original order within the same relevance tier', () => {
      const a = asset({ tag: 'A', name: 'A', description: 'pump' });
      const b = asset({ tag: 'B', name: 'B', description: 'pump' });

      expect(rankByRelevance([a, b], 'pump')).toEqual([a, b]);
    });
  });

  describe('retrieve', () => {
    it('returns null when the asset is not found', async () => {
      const client = makeClient({ retrieve: vi.fn(() => Promise.resolve({ items: [] })) });
      const service = new CogniteAssetService(client);

      const result = await service.retrieve({ space: 'sp_assets', externalId: 'MISSING' });

      expect(result).toBeNull();
    });
  });
});
