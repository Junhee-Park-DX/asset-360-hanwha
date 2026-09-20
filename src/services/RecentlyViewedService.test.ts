import { beforeEach, describe, expect, it } from 'vitest';

import { LocalRecentlyViewedService } from './RecentlyViewedService';
import type { AssetSummary } from './types';

function makeMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => void store.set(key, value),
    removeItem: (key) => void store.delete(key),
    clear: () => store.clear(),
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

function makeAsset(externalId: string): AssetSummary {
  return {
    instanceId: { space: 'sp', externalId },
    tag: externalId,
    name: `Asset ${externalId}`,
    description: '',
    type: '',
    parentPath: '',
    object3DRef: null,
  };
}

describe('LocalRecentlyViewedService', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = makeMemoryStorage();
  });

  it('starts empty', () => {
    const service = new LocalRecentlyViewedService(storage);
    expect(service.list()).toEqual([]);
  });

  it('records assets most-recently-viewed first', () => {
    const service = new LocalRecentlyViewedService(storage);
    service.record(makeAsset('A'));
    service.record(makeAsset('B'));

    expect(service.list().map((e) => e.instanceId.externalId)).toEqual(['B', 'A']);
  });

  it('moves a re-viewed asset back to the front instead of duplicating it', () => {
    const service = new LocalRecentlyViewedService(storage);
    service.record(makeAsset('A'));
    service.record(makeAsset('B'));
    service.record(makeAsset('A'));

    expect(service.list().map((e) => e.instanceId.externalId)).toEqual(['A', 'B']);
  });

  it('caps the list at 10 entries, dropping the oldest', () => {
    const service = new LocalRecentlyViewedService(storage);
    for (let i = 0; i < 12; i++) {
      service.record(makeAsset(`A${i}`));
    }

    const list = service.list();
    expect(list).toHaveLength(10);
    expect(list[0].instanceId.externalId).toBe('A11');
    expect(list.map((e) => e.instanceId.externalId)).not.toContain('A0');
    expect(list.map((e) => e.instanceId.externalId)).not.toContain('A1');
  });
});
