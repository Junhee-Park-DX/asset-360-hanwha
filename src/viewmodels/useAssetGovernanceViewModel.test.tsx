import { renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ServicesReactContext, type Services } from '../context/services';

import { useAssetGovernanceViewModel } from './useAssetGovernanceViewModel';

const assetId = { space: 'sp', externalId: 'PUMP-101' };

function renderWithServices(overrides: {
  timeSeriesCount?: number;
  workOrdersCount?: number;
  documentsCount?: number;
  has3DMapping?: boolean;
  fail?: boolean;
}) {
  const services = {
    timeSeriesService: {
      listForAsset: overrides.fail
        ? vi.fn(() => Promise.reject(new Error('boom')))
        : vi.fn(() => Promise.resolve(Array.from({ length: overrides.timeSeriesCount ?? 0 }))),
    },
    workOrdersService: { listForAsset: vi.fn(() => Promise.resolve(Array.from({ length: overrides.workOrdersCount ?? 0 }))) },
    documentsService: { listForAsset: vi.fn(() => Promise.resolve(Array.from({ length: overrides.documentsCount ?? 0 }))) },
  } as unknown as Services;
  const wrapper: ComponentType<{ children: ReactNode }> = ({ children }) => (
    <ServicesReactContext.Provider value={services}>{children}</ServicesReactContext.Provider>
  );
  return renderHook(() => useAssetGovernanceViewModel(assetId, overrides.has3DMapping ?? false), { wrapper });
}

describe(useAssetGovernanceViewModel.name, () => {
  it('starts in a loading state', () => {
    const { result } = renderWithServices({});
    expect(result.current.state.status).toBe('loading');
  });

  it('resolves counts for each linked data type plus the 3D-mapping flag (FR-020)', async () => {
    const { result } = renderWithServices({ timeSeriesCount: 3, workOrdersCount: 8, documentsCount: 0, has3DMapping: true });

    await waitFor(() => expect(result.current.state.status).toBe('success'));
    expect(result.current.state.status === 'success' && result.current.state.data).toEqual({
      timeSeriesCount: 3,
      workOrdersCount: 8,
      documentsCount: 0,
      has3DMapping: true,
    });
  });

  it('surfaces an error state when a count fetch fails', async () => {
    const { result } = renderWithServices({ fail: true });

    await waitFor(() => expect(result.current.state.status).toBe('error'));
  });
});
