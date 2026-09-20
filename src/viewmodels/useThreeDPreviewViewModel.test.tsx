import { HttpError } from '@cognite/sdk';
import { renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ServicesReactContext, type Services } from '../context/services';

import { useThreeDPreviewViewModel } from './useThreeDPreviewViewModel';

const assetId = { space: 'sp', externalId: 'PUMP-101' };
const revision = { space: 'valhall-three_d', externalId: 'cog_3d_revision_1' };

function renderWithServices(overrides: { getCadRevision?: () => Promise<typeof revision | null> }, has3DMapping: boolean) {
  const services = {
    threeDService: { getCadRevision: overrides.getCadRevision ?? vi.fn(() => Promise.resolve(revision)) },
  } as unknown as Services;
  const wrapper: ComponentType<{ children: ReactNode }> = ({ children }) => (
    <ServicesReactContext.Provider value={services}>{children}</ServicesReactContext.Provider>
  );
  return { ...renderHook(() => useThreeDPreviewViewModel(assetId, has3DMapping), { wrapper }), services };
}

describe(useThreeDPreviewViewModel.name, () => {
  it('settles immediately with no data when the asset has no 3D mapping, without calling the service', () => {
    const { result, services } = renderWithServices({}, false);

    expect(result.current.state).toEqual({ status: 'success', data: null });
    expect(services.threeDService.getCadRevision).not.toHaveBeenCalled();
  });

  it('loads the CAD revision when the asset has a 3D mapping (FR-019)', async () => {
    const { result } = renderWithServices({}, true);

    expect(result.current.state).toEqual({ status: 'loading' });
    await waitFor(() => expect(result.current.state).toEqual({ status: 'success', data: revision }));
  });

  it('resolves to null data when the workspace has no CAD model at all', async () => {
    const { result } = renderWithServices({ getCadRevision: () => Promise.resolve(null) }, true);

    await waitFor(() => expect(result.current.state).toEqual({ status: 'success', data: null }));
  });

  it('surfaces a no-access state on a 403', async () => {
    const { result } = renderWithServices(
      { getCadRevision: () => Promise.reject(new HttpError(403, { error: { code: 403, message: 'Forbidden' } }, {})) },
      true
    );

    await waitFor(() => expect(result.current.state).toEqual({ status: 'no-access' }));
  });

  it('surfaces an error state on other failures', async () => {
    const { result } = renderWithServices({ getCadRevision: () => Promise.reject(new Error('boom')) }, true);

    await waitFor(() => expect(result.current.state).toEqual({ status: 'error', message: 'boom' }));
  });

  it('retries the fetch when refetch is called after an error (FR-011)', async () => {
    let callCount = 0;
    const { result } = renderWithServices(
      {
        getCadRevision: () => {
          callCount += 1;
          return callCount === 1 ? Promise.reject(new Error('boom')) : Promise.resolve(revision);
        },
      },
      true
    );

    await waitFor(() => expect(result.current.state).toEqual({ status: 'error', message: 'boom' }));
    result.current.refetch();
    await waitFor(() => expect(result.current.state).toEqual({ status: 'success', data: revision }));
  });
});
