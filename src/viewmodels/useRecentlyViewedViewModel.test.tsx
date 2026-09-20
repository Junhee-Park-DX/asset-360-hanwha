import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ServicesReactContext, type Services } from '../context/services';
import type { AssetSummary } from '../services/types';

import { useRecentlyViewedViewModel } from './useRecentlyViewedViewModel';

function makeAsset(externalId: string): AssetSummary {
  return {
    instanceId: { space: 'sp', externalId },
    tag: externalId,
    name: externalId,
    description: '',
    type: '',
    parentPath: '',
    object3DRef: null,
  };
}

function wrapperFor(services: Services) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <ServicesReactContext.Provider value={services}>{children}</ServicesReactContext.Provider>;
  };
}

describe('useRecentlyViewedViewModel', () => {
  it('reads the initial list from the service', () => {
    const services = {
      recentlyViewedService: { list: vi.fn(() => [{ instanceId: { space: 'sp', externalId: 'A' }, tag: 'A', name: 'A' }]), record: vi.fn() },
    } as unknown as Services;

    const { result } = renderHook(() => useRecentlyViewedViewModel(), { wrapper: wrapperFor(services) });

    expect(result.current.entries).toHaveLength(1);
  });

  it('recordVisit calls the service and refreshes the entries', () => {
    let stored: ReturnType<Services['recentlyViewedService']['list']> = [];
    const services = {
      recentlyViewedService: {
        list: vi.fn(() => stored),
        record: vi.fn((asset: AssetSummary) => {
          stored = [{ instanceId: asset.instanceId, tag: asset.tag, name: asset.name }];
        }),
      },
    } as unknown as Services;

    const { result } = renderHook(() => useRecentlyViewedViewModel(), { wrapper: wrapperFor(services) });
    act(() => result.current.recordVisit(makeAsset('PUMP-101')));

    expect(services.recentlyViewedService.record).toHaveBeenCalled();
    expect(result.current.entries).toEqual([{ instanceId: { space: 'sp', externalId: 'PUMP-101' }, tag: 'PUMP-101', name: 'PUMP-101' }]);
  });
});
