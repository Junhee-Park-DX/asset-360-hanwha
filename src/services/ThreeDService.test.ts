import type { CogniteClient, NodeOrEdge } from '@cognite/sdk';
import { describe, expect, it, vi } from 'vitest';

import { CogniteThreeDService } from './ThreeDService';

function makeRevisionNode(): NodeOrEdge {
  return {
    instanceType: 'node',
    space: 'valhall-three_d',
    externalId: 'cog_3d_revision_2314200102646614',
    createdTime: 0,
    lastUpdatedTime: 0,
    version: 1,
    properties: {},
  } as NodeOrEdge;
}

function makeClient(items: NodeOrEdge[]) {
  return {
    instances: { list: vi.fn(() => Promise.resolve({ items })) },
  } as unknown as CogniteClient;
}

describe('CogniteThreeDService', () => {
  describe('getCadRevision', () => {
    it('queries the base Cognite3DRevision view filtered by type: CAD, status: Done', async () => {
      const client = makeClient([makeRevisionNode()]);
      const service = new CogniteThreeDService(client);

      const revision = await service.getCadRevision();

      expect(client.instances.list).toHaveBeenCalledWith(
        expect.objectContaining({
          sources: [expect.objectContaining({ source: expect.objectContaining({ externalId: 'Cognite3DRevision' }) })],
          filter: {
            and: [
              { equals: { property: ['cdf_cdm', 'Cognite3DRevision/v1', 'type'], value: 'CAD' } },
              { equals: { property: ['cdf_cdm', 'Cognite3DRevision/v1', 'status'], value: 'Done' } },
            ],
          },
        })
      );
      expect(revision).toEqual({ space: 'valhall-three_d', externalId: 'cog_3d_revision_2314200102646614' });
    });

    it('returns null when no processed CAD revision exists', async () => {
      const client = makeClient([]);
      const service = new CogniteThreeDService(client);

      expect(await service.getCadRevision()).toBeNull();
    });
  });
});
