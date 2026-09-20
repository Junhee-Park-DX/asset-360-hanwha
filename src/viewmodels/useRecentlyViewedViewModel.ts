import { useCallback, useState } from 'react';

import { useServices } from '../context/services';
import type { RecentlyViewedEntry } from '../services/RecentlyViewedService';
import type { AssetSummary } from '../services/types';

export interface RecentlyViewedViewModel {
  entries: RecentlyViewedEntry[];
  recordVisit: (asset: AssetSummary) => void;
}

/** Recently-viewed list (FR-012): browser-local, capped at 10, most-recent-first. */
export function useRecentlyViewedViewModel(): RecentlyViewedViewModel {
  const { recentlyViewedService } = useServices();
  const [entries, setEntries] = useState<RecentlyViewedEntry[]>(() => recentlyViewedService.list());

  const recordVisit = useCallback(
    (asset: AssetSummary) => {
      recentlyViewedService.record(asset);
      setEntries(recentlyViewedService.list());
    },
    [recentlyViewedService]
  );

  return { entries, recordVisit };
}
