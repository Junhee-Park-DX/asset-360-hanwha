import { renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ServicesReactContext, type Services } from '../context/services';
import type { AssetHierarchyFetchResult } from '../services/AssetHierarchyService';

import { useAssetHierarchyViewModel } from './useAssetHierarchyViewModel';

function renderWithServices(overrides: { fetchAll?: () => Promise<AssetHierarchyFetchResult> }) {
  const services = {
    assetHierarchyService: {
      fetchAll:
        overrides.fetchAll ??
        vi.fn(() =>
          Promise.resolve({
            nodes: [{ space: 'sp_assets', externalId: 'VAL', name: 'Valhall', parentExternalId: null }],
            truncated: false,
          })
        ),
    },
  } as unknown as Services;
  const wrapper: ComponentType<{ children: ReactNode }> = ({ children }) => (
    <ServicesReactContext.Provider value={services}>{children}</ServicesReactContext.Provider>
  );
  return renderHook(() => useAssetHierarchyViewModel(), { wrapper });
}

describe(useAssetHierarchyViewModel.name, () => {
  it('starts in a loading state', () => {
    const { result } = renderWithServices({});
    expect(result.current.state.status).toBe('loading');
  });

  it('resolves with a built tree and the truncated flag', async () => {
    const { result } = renderWithServices({});

    await waitFor(() => expect(result.current.state.status).toBe('success'));
    expect(result.current.state.status === 'success' && result.current.state.data).toEqual({
      tree: [{ space: 'sp_assets', externalId: 'VAL', name: 'Valhall', children: [], descendantCount: 0 }],
      truncated: false,
    });
  });

  it('surfaces truncated: true when the service reports the fetch was capped', async () => {
    const { result } = renderWithServices({
      fetchAll: () =>
        Promise.resolve({
          nodes: [{ space: 'sp_assets', externalId: 'VAL', name: 'Valhall', parentExternalId: null }],
          truncated: true,
        }),
    });

    await waitFor(() => expect(result.current.state.status).toBe('success'));
    expect(result.current.state.status === 'success' && result.current.state.data.truncated).toBe(true);
  });

  it('surfaces an error state when the fetch fails', async () => {
    const { result } = renderWithServices({ fetchAll: () => Promise.reject(new Error('boom')) });

    await waitFor(() => expect(result.current.state.status).toBe('error'));
  });
});
