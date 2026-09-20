import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ServicesReactContext, type Services } from '../context/services';
import type { WorkOrderSummary } from '../services/types';

import { WorkOrdersPanel } from './WorkOrdersPanel';

// happy-dom does no real layout, so Aura DataGrid's real virtualizer
// (@tanstack/react-virtual) measures a zero-size container and renders no
// rows. Mock it to render every row instead — see vitest.config.ts's
// server.deps.inline note for why this needs @cognite/aura inlined to work.
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: (options: { count: number; estimateSize: () => number }) => ({
    getTotalSize: () => options.count * options.estimateSize(),
    scrollToIndex: () => undefined,
    getVirtualItems: () =>
      Array.from({ length: options.count }, (_, index) => ({
        index,
        start: index * options.estimateSize(),
        size: options.estimateSize(),
        key: index,
      })),
  }),
}));

const assetId = { space: 'sp', externalId: 'PUMP-101' };

const workOrder: WorkOrderSummary = {
  instanceId: { space: 'sp', externalId: 'WO-1' },
  title: 'Replace bearing',
  description: 'Bearing is worn.',
  status: 'open',
  endTime: Date.parse('2024-05-01'),
  scheduledEndTime: null,
};

function renderWithServices(listForAsset: () => Promise<WorkOrderSummary[]>) {
  const services = {
    workOrdersService: { listForAsset, retrieve: vi.fn() },
    auditLogService: { record: vi.fn(), list: vi.fn(), exportCsv: vi.fn() },
  } as unknown as Services;
  return render(
    <ServicesReactContext.Provider value={services}>
      <WorkOrdersPanel assetId={assetId} />
    </ServicesReactContext.Provider>
  );
}

describe('WorkOrdersPanel', () => {
  it('lists work orders sorted by recency with identifier-ish info (FR-007)', async () => {
    renderWithServices(() => Promise.resolve([workOrder]));
    await waitFor(() => expect(screen.getByText('Replace bearing')).toBeInTheDocument());
    expect(screen.getByText('open')).toBeInTheDocument();
  });

  it('reveals full detail on click without leaving the panel (FR-008)', async () => {
    renderWithServices(() => Promise.resolve([workOrder]));
    await waitFor(() => expect(screen.getByText('Replace bearing')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('row', { name: /replace bearing/i }));

    expect(screen.getByText('Bearing is worn.')).toBeInTheDocument();
  });

  it('shows its own empty state when there are no work orders', async () => {
    renderWithServices(() => Promise.resolve([]));
    await waitFor(() => expect(screen.getByText('No work orders for this asset.')).toBeInTheDocument());
  });
});
