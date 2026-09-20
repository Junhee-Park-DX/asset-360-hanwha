import { Badge } from '@cognite/aura/components/badge';
import { Skeleton } from '@cognite/aura/components/skeleton';

import type { PanelState } from '../viewmodels/panelState';

interface ScorecardItem {
  label: string;
  populated: boolean;
  detail: string;
}

function countOf(state: PanelState<unknown[]>): number | null {
  return state.status === 'success' ? state.data.length : null;
}

interface AssetGovernanceScorecardProps {
  timeSeriesState: PanelState<unknown[]>;
  workOrdersState: PanelState<unknown[]>;
  documentsState: PanelState<unknown[]>;
  has3DMapping: boolean;
}

/**
 * Data-completeness governance scorecard (FR-020): a person responsible for
 * CDF data quality can see at a glance which data types this asset actually
 * has linked, instead of discovering gaps by opening each panel one at a
 * time. A populated dimension gets the app's `fjord` brand accent; a zero or
 * missing one gets the `warning` semantic variant — a real status signal,
 * not decoration (SC-007).
 *
 * The three list states are owned by `AssetDetailContent` (each panel's own
 * ViewModel, called once there) and passed in here rather than re-fetched —
 * this scorecard needs the exact same lists the Time series/Work
 * orders/Documents panels already fetch just to count them, and an
 * independent fetch here would double the network calls for every asset
 * selection.
 */
export function AssetGovernanceScorecard({
  timeSeriesState,
  workOrdersState,
  documentsState,
  has3DMapping,
}: AssetGovernanceScorecardProps) {
  if (timeSeriesState.status === 'loading' || workOrdersState.status === 'loading' || documentsState.status === 'loading') {
    return (
      <section className="flex flex-wrap gap-2 rounded border p-4" aria-label="Data governance scorecard">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-24" />
      </section>
    );
  }

  const timeSeriesCount = countOf(timeSeriesState);
  const workOrdersCount = countOf(workOrdersState);
  const documentsCount = countOf(documentsState);

  const items: ScorecardItem[] = [
    { label: 'Time series', populated: (timeSeriesCount ?? 0) > 0, detail: timeSeriesCount === null ? '—' : `${timeSeriesCount} linked` },
    { label: 'Work orders', populated: (workOrdersCount ?? 0) > 0, detail: workOrdersCount === null ? '—' : `${workOrdersCount} linked` },
    { label: 'Documents', populated: (documentsCount ?? 0) > 0, detail: documentsCount === null ? '—' : `${documentsCount} linked` },
    { label: '3D mapping', populated: has3DMapping, detail: has3DMapping ? 'Mapped' : 'Not mapped' },
  ];

  return (
    <section aria-label="Data governance scorecard" className="flex flex-col gap-2 rounded border p-4">
      <h2 className="text-sm font-medium">Data completeness</h2>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item.label} variant={item.populated ? 'fjord' : 'warning'} background>
            {item.label}: {item.detail}
          </Badge>
        ))}
      </div>
    </section>
  );
}
