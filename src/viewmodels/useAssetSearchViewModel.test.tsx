import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ServicesReactContext, type Services } from '../context/services';
import type { AssetSummary } from '../services/types';

import { useAssetSearchViewModel } from './useAssetSearchViewModel';

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

function makeServices(overrides: Partial<Services['assetService']> = {}): Services {
  return {
    assetService: { search: vi.fn(() => Promise.resolve([makeAsset('PUMP-101')])), retrieve: vi.fn(), ...overrides },
  } as unknown as Services;
}

function wrapperFor(services: Services) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <ServicesReactContext.Provider value={services}>{children}</ServicesReactContext.Provider>;
  };
}

/** Simulates the host-synced `query`/`setQuery` state App.tsx would own. */
function useHarness() {
  const [query, setQuery] = useState('');
  return useAssetSearchViewModel(query, setQuery);
}

describe('useAssetSearchViewModel', () => {
  it('starts with an empty success state and no query', () => {
    const { result } = renderHook(() => useHarness(), { wrapper: wrapperFor(makeServices()) });
    expect(result.current.query).toBe('');
    expect(result.current.state).toEqual({ status: 'success', data: [] });
  });

  it('goes to loading then success once a query resolves', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const services = makeServices();
    const { result } = renderHook(() => useHarness(), { wrapper: wrapperFor(services) });

    act(() => result.current.setQuery('pump'));
    expect(result.current.state).toEqual({ status: 'loading' });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    await waitFor(() => expect(result.current.state.status).toBe('success'));

    expect(services.assetService.search).toHaveBeenCalledWith('pump');
    vi.useRealTimers();
  });

  it('surfaces an error state when the search fails', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const services = makeServices({ search: vi.fn(() => Promise.reject(new Error('down'))) });
    const { result } = renderHook(() => useHarness(), { wrapper: wrapperFor(services) });

    act(() => result.current.setQuery('pump'));
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    await waitFor(() => expect(result.current.state).toEqual({ status: 'error', message: 'down' }));
    vi.useRealTimers();
  });
});
