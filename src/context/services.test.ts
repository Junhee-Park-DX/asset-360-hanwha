import type { CogniteClient } from '@cognite/sdk';
import { describe, expect, it, vi } from 'vitest';

import { buildServices } from './services';

describe('buildServices', () => {
  it('constructs every service the app depends on', () => {
    const client = {} as unknown as CogniteClient;
    const storage = { getItem: vi.fn(), setItem: vi.fn() } as unknown as Storage;

    const services = buildServices(client, storage);

    expect(services.assetService).toBeDefined();
    expect(services.timeSeriesService).toBeDefined();
    expect(services.workOrdersService).toBeDefined();
    expect(services.documentsService).toBeDefined();
    expect(services.recentlyViewedService).toBeDefined();
    expect(services.assetHierarchyService).toBeDefined();
    expect(services.threeDService).toBeDefined();
  });
});
