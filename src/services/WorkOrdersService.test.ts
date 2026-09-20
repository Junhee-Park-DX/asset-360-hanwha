import type { CogniteClient, NodeOrEdge } from '@cognite/sdk';
import { describe, expect, it, vi } from 'vitest';

import { CogniteWorkOrdersService } from './WorkOrdersService';

function makeNode(externalId: string, endTime: string | undefined, scheduledEndTime?: string): NodeOrEdge {
  return {
    instanceType: 'node',
    space: 'sp_assets',
    externalId,
    createdTime: 0,
    lastUpdatedTime: 0,
    version: 1,
    properties: {
      cdf_cdm: {
        'CogniteActivity/v1': {
          name: `WO ${externalId}`,
          description: 'desc',
          endTime,
          scheduledEndTime,
        },
      },
    },
  } as NodeOrEdge;
}

function makeClient(items: NodeOrEdge[]) {
  return {
    instances: {
      search: vi.fn(() => Promise.resolve({ items })),
      retrieve: vi.fn(() => Promise.resolve({ items })),
    },
  } as unknown as CogniteClient;
}

describe('CogniteWorkOrdersService', () => {
  it('filters CogniteActivity by the asset via containsAny on `assets`', async () => {
    const client = makeClient([]);
    const service = new CogniteWorkOrdersService(client);

    await service.listForAsset({ space: 'sp_assets', externalId: 'PUMP-101' });

    expect(client.instances.search).toHaveBeenCalledWith(
      expect.objectContaining({
        view: expect.objectContaining({ externalId: 'CogniteActivity' }),
        filter: {
          containsAny: {
            property: ['cdf_cdm', 'CogniteActivity/v1', 'assets'],
            values: [{ space: 'sp_assets', externalId: 'PUMP-101' }],
          },
        },
      })
    );
  });

  it('sorts results by endTime, falling back to scheduledEndTime, descending', async () => {
    const older = makeNode('WO-1', '2024-01-01T00:00:00.000Z');
    const newer = makeNode('WO-2', '2024-06-01T00:00:00.000Z');
    const scheduledOnly = makeNode('WO-3', undefined, '2024-03-01T00:00:00.000Z');
    const client = makeClient([older, newer, scheduledOnly]);
    const service = new CogniteWorkOrdersService(client);

    const results = await service.listForAsset({ space: 'sp_assets', externalId: 'PUMP-101' });

    expect(results.map((wo) => wo.instanceId.externalId)).toEqual(['WO-2', 'WO-3', 'WO-1']);
  });

  it('retrieve returns null when the work order is not found', async () => {
    const client = makeClient([]);
    const service = new CogniteWorkOrdersService(client);

    const result = await service.retrieve({ space: 'sp_assets', externalId: 'MISSING' });

    expect(result).toBeNull();
  });
});
