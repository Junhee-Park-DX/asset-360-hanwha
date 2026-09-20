import { HttpError } from '@cognite/sdk';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ServicesReactContext, type Services } from '../context/services';
import type { WorkOrderSummary } from '../services/types';

import { useWorkOrdersPanelViewModel } from './useWorkOrdersPanelViewModel';

const assetId = { space: 'sp', externalId: 'PUMP-101' };

const workOrder: WorkOrderSummary = {
  instanceId: { space: 'sp', externalId: 'WO-1' },
  title: 'Replace bearing',
  description: '',
  status: 'open',
  endTime: null,
  scheduledEndTime: null,
};

function makeServices(listForAsset: () => Promise<WorkOrderSummary[]>): Services {
  return {
    workOrdersService: { listForAsset, retrieve: vi.fn() },
  } as unknown as Services;
}

function wrapperFor(services: Services) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <ServicesReactContext.Provider value={services}>{children}</ServicesReactContext.Provider>;
  };
}

describe('useWorkOrdersPanelViewModel', () => {
  it('starts loading, then resolves to success (FR-007)', async () => {
    const services = makeServices(() => Promise.resolve([workOrder]));
    const { result } = renderHook(() => useWorkOrdersPanelViewModel(assetId), { wrapper: wrapperFor(services) });

    expect(result.current.state).toEqual({ status: 'loading' });
    await waitFor(() => expect(result.current.state).toEqual({ status: 'success', data: [workOrder] }));
  });

  it('surfaces a no-access state on a 403', async () => {
    const services = makeServices(() => Promise.reject(new HttpError(403, { error: { code: 403, message: 'Forbidden' } }, {})));
    const { result } = renderHook(() => useWorkOrdersPanelViewModel(assetId), { wrapper: wrapperFor(services) });

    await waitFor(() => expect(result.current.state).toEqual({ status: 'no-access' }));
  });
});
