import type { CogniteClient, NodeOrEdge } from '@cognite/sdk';
import { HttpError } from '@cognite/sdk';
import { describe, expect, it, vi } from 'vitest';

import { CogniteTimeSeriesService } from './TimeSeriesService';

function makeNode(): NodeOrEdge {
  return {
    instanceType: 'node',
    space: 'sp_assets',
    externalId: 'PUMP-101-FLOW',
    createdTime: 0,
    lastUpdatedTime: 0,
    version: 1,
    properties: {
      cdf_cdm: {
        'CogniteTimeSeries/v1': { name: 'Flow rate', description: 'Flow', sourceUnit: 'm3/h' },
      },
    },
  } as NodeOrEdge;
}

function makeClient(overrides: { search?: unknown; retrieve?: unknown; retrieveLatest?: unknown } = {}) {
  return {
    instances: { search: overrides.search ?? vi.fn(() => Promise.resolve({ items: [makeNode()] })) },
    datapoints: {
      retrieveLatest:
        overrides.retrieveLatest ??
        vi.fn(() =>
          Promise.resolve([
            {
              instanceId: { space: 'sp_assets', externalId: 'PUMP-101-FLOW' },
              isString: false,
              datapoints: [{ timestamp: new Date(5000), value: 99 }],
            },
          ])
        ),
      retrieve:
        overrides.retrieve ??
        vi.fn(() =>
          Promise.resolve([
            {
              instanceId: { space: 'sp_assets', externalId: 'PUMP-101-FLOW' },
              isString: false,
              datapoints: [{ timestamp: new Date(1000), value: 42 }],
            },
          ])
        ),
    },
  } as unknown as CogniteClient;
}

describe('CogniteTimeSeriesService', () => {
  describe('listForAsset', () => {
    it('filters CogniteTimeSeries by the asset via a containsAny filter on `assets`', async () => {
      const client = makeClient();
      const service = new CogniteTimeSeriesService(client);

      await service.listForAsset({ space: 'sp_assets', externalId: 'PUMP-101' });

      expect(client.instances.search).toHaveBeenCalledWith(
        expect.objectContaining({
          view: expect.objectContaining({ externalId: 'CogniteTimeSeries' }),
          filter: {
            containsAny: {
              property: ['cdf_cdm', 'CogniteTimeSeries/v1', 'assets'],
              values: [{ space: 'sp_assets', externalId: 'PUMP-101' }],
            },
          },
        })
      );
    });

    it('parses series summaries from the response', async () => {
      const client = makeClient();
      const service = new CogniteTimeSeriesService(client);

      const results = await service.listForAsset({ space: 'sp_assets', externalId: 'PUMP-101' });

      expect(results).toEqual([
        {
          instanceId: { space: 'sp_assets', externalId: 'PUMP-101-FLOW' },
          name: 'Flow rate',
          description: 'Flow',
          unit: 'm3/h',
        },
      ]);
    });

    it('propagates an HttpError on a non-OK response', async () => {
      const client = makeClient({
        search: vi.fn(() => Promise.reject(new HttpError(500, { error: { code: 500, message: 'boom' } }, {}))),
      });
      const service = new CogniteTimeSeriesService(client);

      await expect(service.listForAsset({ space: 's', externalId: 'a' })).rejects.toThrow(HttpError);
    });
  });

  describe('retrieveDatapoints', () => {
    it('returns an empty map without calling the API when no series are selected', async () => {
      const client = makeClient();
      const service = new CogniteTimeSeriesService(client);

      const result = await service.retrieveDatapoints([], { start: 0, end: 1 });

      expect(result).toEqual({});
      expect(client.datapoints.retrieve).not.toHaveBeenCalled();
    });

    it('keys returned datapoints by the response instanceId, filtering out non-numeric points', async () => {
      const client = makeClient();
      const service = new CogniteTimeSeriesService(client);

      const result = await service.retrieveDatapoints(
        [{ space: 'sp_assets', externalId: 'PUMP-101-FLOW' }],
        { start: 0, end: 2000 }
      );

      expect(result).toEqual({ 'sp_assets:PUMP-101-FLOW': [{ timestamp: 1000, value: 42 }] });
    });
  });

  describe('retrieveLatestTimestamp', () => {
    it('returns null without calling the API when no series are selected', async () => {
      const client = makeClient();
      const service = new CogniteTimeSeriesService(client);

      const result = await service.retrieveLatestTimestamp([]);

      expect(result).toBeNull();
      expect(client.datapoints.retrieveLatest).not.toHaveBeenCalled();
    });

    it('returns the max latest timestamp across the selected series', async () => {
      const client = makeClient({
        retrieveLatest: vi.fn(() =>
          Promise.resolve([
            { instanceId: { space: 'sp', externalId: 'A' }, isString: false, datapoints: [{ timestamp: new Date(1000), value: 1 }] },
            { instanceId: { space: 'sp', externalId: 'B' }, isString: false, datapoints: [{ timestamp: new Date(9000), value: 2 }] },
          ])
        ),
      });
      const service = new CogniteTimeSeriesService(client);

      const result = await service.retrieveLatestTimestamp([
        { space: 'sp', externalId: 'A' },
        { space: 'sp', externalId: 'B' },
      ]);

      expect(result).toBe(9000);
    });

    it('returns null when a series has no datapoints at all (FR-006a)', async () => {
      const client = makeClient({ retrieveLatest: vi.fn(() => Promise.resolve([{ instanceId: { space: 'sp', externalId: 'A' }, isString: false, datapoints: [] }])) });
      const service = new CogniteTimeSeriesService(client);

      const result = await service.retrieveLatestTimestamp([{ space: 'sp', externalId: 'A' }]);

      expect(result).toBeNull();
    });
  });
});
