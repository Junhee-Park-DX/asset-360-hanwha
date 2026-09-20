import { useState } from 'react';

import { useServices } from '../context/services';
import { instanceKey } from '../services/instanceKey';
import type { TimeRange } from '../services/TimeSeriesService';
import type { Datapoint, InstanceRef, TimeSeriesSummary } from '../services/types';

import type { PanelState } from './panelState';
import { useAsyncPanelData } from './useAsyncPanelData';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const WINDOW_OPTIONS = [
  { id: '24h', label: '24 hours', ms: 24 * HOUR_MS },
  { id: '7d', label: '7 days', ms: 7 * DAY_MS },
  { id: '30d', label: '30 days', ms: 30 * DAY_MS },
  { id: '90d', label: '90 days', ms: 90 * DAY_MS },
] as const;

export type WindowOptionId = (typeof WINDOW_OPTIONS)[number]['id'];

const DEFAULT_WINDOW_ID: WindowOptionId = '7d';

function windowMsFor(id: WindowOptionId): number {
  return WINDOW_OPTIONS.find((option) => option.id === id)?.ms ?? WINDOW_OPTIONS[1].ms;
}

export interface ChartData {
  range: TimeRange | null;
  datapointsBySeries: Record<string, Datapoint[]>;
}

export interface TimeSeriesPanelViewModel {
  seriesListState: PanelState<TimeSeriesSummary[]>;
  selectedSeriesIds: InstanceRef[];
  toggleSeries: (series: InstanceRef) => void;
  windowId: WindowOptionId;
  setWindowId: (id: WindowOptionId) => void;
  chartState: PanelState<ChartData>;
  refresh: () => void;
}

function selectionKey(ids: InstanceRef[]): string {
  return ids
    .map(instanceKey)
    .sort()
    .join(',');
}

/**
 * Time series panel (FR-005, FR-006, FR-006a, FR-006b): no series plotted by
 * default; the analyst explicitly selects which to chart, and can change the
 * time range shown (FR-006) via `windowId` without leaving the 360 view. The
 * window anchors to the most recent datapoint among the selected series,
 * recomputed when the selection or window size changes and on manual
 * refresh — there is no auto-poll/streaming, only the explicit refresh
 * action re-triggers a fetch.
 */
export function useTimeSeriesPanelViewModel(assetId: InstanceRef): TimeSeriesPanelViewModel {
  const { timeSeriesService } = useServices();

  const { state: seriesListState } = useAsyncPanelData(
    () => timeSeriesService.listForAsset(assetId),
    [timeSeriesService, assetId.space, assetId.externalId]
  );

  const [selectedSeriesIds, setSelectedSeriesIds] = useState<InstanceRef[]>([]);
  const [windowId, setWindowId] = useState<WindowOptionId>(DEFAULT_WINDOW_ID);

  const fetchChartData = async (): Promise<ChartData> => {
    if (selectedSeriesIds.length === 0) return { range: null, datapointsBySeries: {} };
    const latest = await timeSeriesService.retrieveLatestTimestamp(selectedSeriesIds);
    if (latest === null) {
      // None of the selected series has any datapoints at all — FR-006a empty
      // state for each, with no wall-clock time window to anchor to.
      return {
        range: null,
        datapointsBySeries: Object.fromEntries(selectedSeriesIds.map((id) => [instanceKey(id), []])),
      };
    }
    const range: TimeRange = { start: latest - windowMsFor(windowId), end: latest };
    const datapointsBySeries = await timeSeriesService.retrieveDatapoints(selectedSeriesIds, range);
    return { range, datapointsBySeries };
  };

  const { state: chartState, refetch } = useAsyncPanelData(fetchChartData, [
    timeSeriesService,
    assetId.space,
    assetId.externalId,
    selectionKey(selectedSeriesIds),
    windowId,
  ]);

  function toggleSeries(series: InstanceRef): void {
    setSelectedSeriesIds((current) =>
      current.some((id) => instanceKey(id) === instanceKey(series))
        ? current.filter((id) => instanceKey(id) !== instanceKey(series))
        : [...current, series]
    );
  }

  return { seriesListState, selectedSeriesIds, toggleSeries, windowId, setWindowId, chartState, refresh: refetch };
}
