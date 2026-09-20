import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ServicesReactContext, type Services } from '../context/services';
import type { TimeSeriesSummary } from '../services/types';

import { TimeSeriesPanel } from './TimeSeriesPanel';

const assetId = { space: 'sp', externalId: 'PUMP-101' };
const seriesA = { space: 'sp', externalId: 'FLOW' };

const seriesList: TimeSeriesSummary[] = [{ instanceId: seriesA, name: 'Flow rate', description: '', unit: 'm3/h' }];

function renderWithServices(overrides: {
  retrieveLatestTimestamp?: () => Promise<number | null>;
  retrieveDatapoints?: () => Promise<Record<string, { timestamp: number; value: number }[]>>;
}) {
  const services = {
    timeSeriesService: {
      listForAsset: vi.fn(() => Promise.resolve(seriesList)),
      retrieveLatestTimestamp: overrides.retrieveLatestTimestamp ?? vi.fn(() => Promise.resolve(9000)),
      retrieveDatapoints: overrides.retrieveDatapoints ?? vi.fn(() => Promise.resolve({ 'sp:FLOW': [{ timestamp: 8000, value: 1.2 }] })),
    },
    auditLogService: { record: vi.fn(), list: vi.fn(), exportCsv: vi.fn() },
  } as unknown as Services;
  return render(
    <ServicesReactContext.Provider value={services}>
      <TimeSeriesPanel assetId={assetId} />
    </ServicesReactContext.Provider>
  );
}

function seriesCheckbox() {
  return screen.getByRole('checkbox', { name: /flow rate/i });
}

describe('TimeSeriesPanel', () => {
  it('lists every linked series as an unchecked checkbox and plots nothing by default (FR-005)', async () => {
    renderWithServices({});
    await waitFor(() => expect(seriesCheckbox()).toBeInTheDocument());

    expect(seriesCheckbox()).not.toBeChecked();
    expect(screen.getByText(/select one or more series/i)).toBeInTheDocument();
  });

  it('selecting a series fetches and renders the chart with a manual refresh control (FR-006, FR-006b)', async () => {
    renderWithServices({});
    await waitFor(() => expect(seriesCheckbox()).toBeInTheDocument());

    await userEvent.click(seriesCheckbox());

    expect(seriesCheckbox()).toBeChecked();
    await waitFor(() => expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument());
    expect(screen.getByText(/ending/i)).toBeInTheDocument();
  });

  it('lets the analyst change the time window without leaving the view (FR-006)', async () => {
    const retrieveDatapoints = vi.fn(() => Promise.resolve({ 'sp:FLOW': [{ timestamp: 8000, value: 1.2 }] }));
    renderWithServices({ retrieveDatapoints });
    await waitFor(() => expect(seriesCheckbox()).toBeInTheDocument());
    await userEvent.click(seriesCheckbox());
    await waitFor(() => expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument());

    await userEvent.click(screen.getByRole('tab', { name: '24 hours' }));

    await waitFor(() =>
      expect(retrieveDatapoints).toHaveBeenLastCalledWith([seriesA], { start: 9000 - 24 * 60 * 60 * 1000, end: 9000 })
    );
  });

  it('shows a clear per-series empty state when a selected series has no datapoints at all (FR-006a)', async () => {
    renderWithServices({
      retrieveLatestTimestamp: vi.fn(() => Promise.resolve(null)),
    });
    await waitFor(() => expect(seriesCheckbox()).toBeInTheDocument());

    await userEvent.click(seriesCheckbox());

    await waitFor(() => expect(screen.getByText(/no datapoints at all for: flow rate/i)).toBeInTheDocument());
  });
});
