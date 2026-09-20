import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@cognite/aura/chart';
import { Button } from '@cognite/aura/components/button';
import { CheckboxGroup, CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlIndicator,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import { instanceKey } from '../services/instanceKey';
import type { Datapoint, InstanceRef, TimeSeriesSummary } from '../services/types';
import { useTimeSeriesPanelViewModel, WINDOW_OPTIONS } from '../viewmodels/useTimeSeriesPanelViewModel';

import { PanelEmptyState } from './PanelEmptyState';

// Aura's real chart tokens are `--chart-{palette}-color-{1-6}`, not a flat
// `--chart-1..5` (which don't exist and previously left every line uncolored).
// Categorical order validated colorblind-safe via the dataviz skill's
// validator (CVD ΔE >= 8.8, normal-vision floor 19.4, all pass): orange leads
// as the brand color, then three more Aura hue families for series 2-5.
const SERIES_COLORS = [
  'var(--chart-orange-color-1)',
  'var(--chart-fjord-color-1)',
  'var(--chart-nordic-color-1)',
  'var(--chart-dusk-color-1)',
  'var(--chart-aurora-color-1)',
];

type ChartRow = { timestamp: number } & Record<string, number>;

function buildChartRows(datapointsBySeries: Record<string, Datapoint[]>): ChartRow[] {
  const byTimestamp = new Map<number, ChartRow>();
  for (const [key, points] of Object.entries(datapointsBySeries)) {
    for (const point of points) {
      const row = byTimestamp.get(point.timestamp) ?? { timestamp: point.timestamp };
      row[key] = point.value;
      byTimestamp.set(point.timestamp, row);
    }
  }
  return Array.from(byTimestamp.values()).sort((a, b) => a.timestamp - b.timestamp);
}

export function TimeSeriesPanel({ assetId }: { assetId: InstanceRef }) {
  const { seriesListState, selectedSeriesIds, toggleSeries, windowId, setWindowId, chartState, refresh } =
    useTimeSeriesPanelViewModel(assetId);

  if (seriesListState.status !== 'success') {
    return (
      <PanelEmptyState
        kind={seriesListState.status}
        emptyMessage="No time series linked to this asset."
        errorMessage={seriesListState.status === 'error' ? seriesListState.message : undefined}
      />
    );
  }

  const seriesList: TimeSeriesSummary[] = seriesListState.data;
  const isSelected = (series: TimeSeriesSummary) => selectedSeriesIds.some((id) => instanceKey(id) === instanceKey(series.instanceId));

  const config: ChartConfig = Object.fromEntries(
    seriesList.map((series, index) => [
      instanceKey(series.instanceId),
      { label: series.name, color: SERIES_COLORS[index % SERIES_COLORS.length] },
    ])
  );

  const chartData = chartState.status === 'success' ? chartState.data : null;
  const emptySeries =
    chartData !== null
      ? Object.entries(chartData.datapointsBySeries)
          .filter(([, points]) => points.length === 0)
          .map(([key]) => seriesList.find((series) => instanceKey(series.instanceId) === key)?.name ?? key)
      : [];

  return (
    <div className="flex flex-col gap-2">
      {seriesList.length === 0 ? (
        <PanelEmptyState kind="empty" emptyMessage="No time series linked to this asset." />
      ) : (
        <fieldset className="flex flex-col gap-1 border-b p-3">
          <legend className="text-xs font-medium text-muted-foreground">Select series to plot</legend>
          {/* Fixed-height box: some assets link 10+ series (e.g. a compressor
              package), so the picker scrolls internally rather than growing
              the page (same fix as AuditLogPanel). */}
          <div className="max-h-40 overflow-y-auto">
            <CheckboxGroup>
              {seriesList.map((series) => (
                <CheckboxItem key={instanceKey(series.instanceId)}>
                  <CheckboxItemControl
                    checked={isSelected(series)}
                    onCheckedChange={() => toggleSeries(series.instanceId)}
                  />
                  <CheckboxItemLabel>
                    {series.name}
                    {series.unit ? <span className="text-xs text-muted-foreground"> ({series.unit})</span> : null}
                  </CheckboxItemLabel>
                </CheckboxItem>
              ))}
            </CheckboxGroup>
          </div>
        </fieldset>
      )}

      {selectedSeriesIds.length === 0 ? (
        <PanelEmptyState kind="empty" emptyMessage="Select one or more series above to plot them." />
      ) : chartState.status !== 'success' ? (
        <PanelEmptyState
          kind={chartState.status}
          emptyMessage="No data for the selected series."
          errorMessage={chartState.status === 'error' ? chartState.message : undefined}
          onRetry={refresh}
        />
      ) : (
        <div className="flex flex-col gap-2 p-3">
          {/* Stacked, not side-by-side: this panel sits in a narrow 3-column
              grid where the 4-segment control plus a button never both fit
              on one row — they used to overflow the panel's border. */}
          <div className="flex flex-col gap-2">
            <SegmentedControl value={windowId} onValueChange={(value) => setWindowId(value as typeof windowId)}>
              <SegmentedControlList aria-label="Time window" size="small" className="w-full">
                {WINDOW_OPTIONS.map((option) => (
                  <SegmentedControlButton key={option.id} value={option.id} size="small" tabContent="label-only">
                    {option.label}
                  </SegmentedControlButton>
                ))}
                <SegmentedControlIndicator size="small" />
              </SegmentedControlList>
            </SegmentedControl>
            <Button variant="outline" size="sm" onClick={refresh} className="self-end">
              Refresh
            </Button>
          </div>
          <span className="text-xs text-muted-foreground">
            {chartData?.range ? `Ending ${new Date(chartData.range.end).toLocaleString()}` : 'No datapoints in range'}
          </span>
          {chartData && chartData.range && buildChartRows(chartData.datapointsBySeries).length > 0 ? (
            <ChartContainer config={config} aria-label="Time series chart" className="h-64 w-full">
              <LineChart data={buildChartRows(chartData.datapointsBySeries)}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value: number) => new Date(value).toLocaleTimeString()}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis tickLine={false} axisLine={false} width={48} />
                <ChartTooltip content={<ChartTooltipContent />} />
                {selectedSeriesIds.map((id) => (
                  <Line
                    key={instanceKey(id)}
                    type="monotone"
                    dataKey={instanceKey(id)}
                    stroke={config[instanceKey(id)]?.color}
                    dot={false}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ChartContainer>
          ) : (
            <PanelEmptyState kind="empty" emptyMessage="No datapoints for the selected series in this window." />
          )}
          {emptySeries.length > 0 ? (
            <p className="text-xs text-muted-foreground">No datapoints at all for: {emptySeries.join(', ')}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
