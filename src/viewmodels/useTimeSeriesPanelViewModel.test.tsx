import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ServicesReactContext, type Services } from '../context/services';
import type { TimeSeriesSummary } from '../services/types';

import { useTimeSeriesPanelViewModel } from './useTimeSeriesPanelViewModel';

const assetId = { space: 'sp', externalId: 'PUMP-101' };
const seriesA = { space: 'sp', externalId: 'FLOW' };

const seriesList: TimeSeriesSummary[] = [{ instanceId: seriesA, name: 'Flow', description: '', unit: 'm3/h' }];

function makeServices(): Services {
  return {
    timeSeriesService: {
      listForAsset: vi.fn(() => Promise.resolve(seriesList)),
      retrieveLatestTimestamp: vi.fn(() => Promise.resolve(9000)),
      retrieveDatapoints: vi.fn(() => Promise.resolve({ 'sp:FLOW': [{ timestamp: 8000, value: 1.2 }] })),
    },
  } as unknown as Services;
}

function wrapperFor(services: Services) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <ServicesReactContext.Provider value={services}>{children}</ServicesReactContext.Provider>;
  };
}

describe('useTimeSeriesPanelViewModel', () => {
  it('lists series and plots none by default (FR-005)', async () => {
    const services = makeServices();
    const { result } = renderHook(() => useTimeSeriesPanelViewModel(assetId), { wrapper: wrapperFor(services) });

    await waitFor(() => expect(result.current.seriesListState).toEqual({ status: 'success', data: seriesList }));
    expect(result.current.selectedSeriesIds).toEqual([]);
    await waitFor(() =>
      expect(result.current.chartState).toEqual({ status: 'success', data: { range: null, datapointsBySeries: {} } })
    );
  });

  it('selecting a series anchors the window to its latest datapoint and fetches data', async () => {
    const services = makeServices();
    const { result } = renderHook(() => useTimeSeriesPanelViewModel(assetId), { wrapper: wrapperFor(services) });
    await waitFor(() => expect(result.current.seriesListState.status).toBe('success'));

    act(() => result.current.toggleSeries(seriesA));

    await waitFor(() => expect(result.current.chartState.status).toBe('success'));
    expect(services.timeSeriesService.retrieveLatestTimestamp).toHaveBeenCalledWith([seriesA]);
    expect(services.timeSeriesService.retrieveDatapoints).toHaveBeenCalledWith([seriesA], { start: 9000 - 7 * 24 * 60 * 60 * 1000, end: 9000 });
  });

  it('toggling a selected series off removes it from the selection', async () => {
    const services = makeServices();
    const { result } = renderHook(() => useTimeSeriesPanelViewModel(assetId), { wrapper: wrapperFor(services) });
    await waitFor(() => expect(result.current.seriesListState.status).toBe('success'));

    act(() => result.current.toggleSeries(seriesA));
    await waitFor(() => expect(result.current.selectedSeriesIds).toEqual([seriesA]));

    act(() => result.current.toggleSeries(seriesA));
    expect(result.current.selectedSeriesIds).toEqual([]);
  });

  it('refresh re-triggers the fetch without auto-polling on its own (FR-006b)', async () => {
    const services = makeServices();
    const { result } = renderHook(() => useTimeSeriesPanelViewModel(assetId), { wrapper: wrapperFor(services) });
    await waitFor(() => expect(result.current.seriesListState.status).toBe('success'));
    act(() => result.current.toggleSeries(seriesA));
    await waitFor(() => expect(result.current.chartState.status).toBe('success'));

    const callsBefore = (services.timeSeriesService.retrieveDatapoints as ReturnType<typeof vi.fn>).mock.calls.length;
    act(() => result.current.refresh());
    await waitFor(() =>
      expect((services.timeSeriesService.retrieveDatapoints as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsBefore + 1)
    );
  });

  it('changing the window re-fetches with the new range without leaving the view (FR-006)', async () => {
    const services = makeServices();
    const { result } = renderHook(() => useTimeSeriesPanelViewModel(assetId), { wrapper: wrapperFor(services) });
    await waitFor(() => expect(result.current.seriesListState.status).toBe('success'));
    act(() => result.current.toggleSeries(seriesA));
    await waitFor(() => expect(result.current.chartState.status).toBe('success'));
    expect(result.current.windowId).toBe('7d');

    act(() => result.current.setWindowId('24h'));

    await waitFor(() =>
      expect(services.timeSeriesService.retrieveDatapoints).toHaveBeenLastCalledWith([seriesA], {
        start: 9000 - 24 * 60 * 60 * 1000,
        end: 9000,
      })
    );
  });
});
