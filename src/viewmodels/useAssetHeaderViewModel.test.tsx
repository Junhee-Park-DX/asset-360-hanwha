import { renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ServicesReactContext, type Services } from '../context/services';
import type { AssetSummary } from '../services/types';

import { useAssetHeaderViewModel } from './useAssetHeaderViewModel';

const assetId = { space: 'sp', externalId: 'PUMP-101' };

const asset: AssetSummary = {
  instanceId: assetId,
  tag: 'PUMP-101',
  name: 'Pump 101',
  description: '',
  type: '',
  parentPath: '',
  object3DRef: null,
};

function renderWithServices(overrides: { retrieve?: () => Promise<AssetSummary | null> }) {
  const services = {
    assetService: { retrieve: overrides.retrieve ?? vi.fn(() => Promise.resolve(asset)), search: vi.fn() },
  } as unknown as Services;
  const wrapper: ComponentType<{ children: ReactNode }> = ({ children }) => (
    <ServicesReactContext.Provider value={services}>{children}</ServicesReactContext.Provider>
  );
  return renderHook(() => useAssetHeaderViewModel(assetId), { wrapper });
}

describe(useAssetHeaderViewModel.name, () => {
  it('starts in a loading state', () => {
    const { result } = renderWithServices({});
    expect(result.current.state.status).toBe('loading');
  });

  it('resolves with the asset (FR-004)', async () => {
    const { result } = renderWithServices({});

    await waitFor(() => expect(result.current.state.status).toBe('success'));
    expect(result.current.state.status === 'success' && result.current.state.data).toEqual(asset);
  });

  it('surfaces an error state when the asset is not found', async () => {
    const { result } = renderWithServices({ retrieve: () => Promise.resolve(null) });

    await waitFor(() => expect(result.current.state.status).toBe('error'));
  });
});
