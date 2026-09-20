import { Badge } from '@cognite/aura/components/badge';
import { Skeleton } from '@cognite/aura/components/skeleton';

import type { InstanceRef } from '../services/types';
import { useAssetGovernanceViewModel } from '../viewmodels/useAssetGovernanceViewModel';

interface ScorecardItem {
  label: string;
  populated: boolean;
  detail: string;
}

/**
 * Data-completeness governance scorecard (FR-020): a person responsible for
 * CDF data quality can see at a glance which data types this asset actually
 * has linked, instead of discovering gaps by opening each panel one at a
 * time. A populated dimension gets the app's `fjord` brand accent; a zero or
 * missing one gets the `warning` semantic variant — a real status signal,
 * not decoration (SC-007).
 */
export function AssetGovernanceScorecard({ assetId, has3DMapping }: { assetId: InstanceRef; has3DMapping: boolean }) {
  const { state } = useAssetGovernanceViewModel(assetId, has3DMapping);

  if (state.status === 'loading') {
    return (
      <section className="flex flex-wrap gap-2 rounded border p-4" aria-label="Data governance scorecard">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-24" />
      </section>
    );
  }

  if (state.status !== 'success') {
    return null;
  }

  const { timeSeriesCount, workOrdersCount, documentsCount } = state.data;
  const items: ScorecardItem[] = [
    { label: 'Time series', populated: timeSeriesCount > 0, detail: `${timeSeriesCount} linked` },
    { label: 'Work orders', populated: workOrdersCount > 0, detail: `${workOrdersCount} linked` },
    { label: 'Documents', populated: documentsCount > 0, detail: `${documentsCount} linked` },
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
