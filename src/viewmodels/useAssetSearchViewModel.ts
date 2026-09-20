import { useEffect, useState } from 'react';

import { useServices } from '../context/services';
import type { AssetSummary } from '../services/types';

import type { PanelState } from './panelState';
import { useAsyncPanelData } from './useAsyncPanelData';

const DEBOUNCE_MS = 250;

const EMPTY_QUERY_STATE: PanelState<AssetSummary[]> = { status: 'success', data: [] };

export interface AssetSearchViewModel {
  query: string;
  setQuery: (query: string) => void;
  state: PanelState<AssetSummary[]>;
}

/**
 * Search entry point (FR-001, FR-002): debounced type-ahead against
 * AssetService. `query`/`setQuery` are host-synced state owned by the caller
 * (App.tsx's root state, per CLAUDE.md §2) and passed in rather than held
 * here as local `useState`, so the search term survives reload and is part
 * of the shareable URL.
 *
 * The "loading" state while a keystroke is still debouncing is derived at
 * render time (`trimmed !== debouncedQuery`), not set from inside an effect
 * — `setDebouncedQuery` is only ever called from the debounce timer's
 * callback, and `useAsyncPanelData` owns its own loading transition
 * internally, so no effect here calls a setter synchronously in its body.
 */
export function useAssetSearchViewModel(query: string, setQuery: (query: string) => void): AssetSearchViewModel {
  const { assetService } = useServices();
  const trimmed = query.trim();
  const [debouncedQuery, setDebouncedQuery] = useState(trimmed);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(trimmed), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [trimmed]);

  const { state: fetchState } = useAsyncPanelData(
    () => (debouncedQuery ? assetService.search(debouncedQuery) : Promise.resolve([])),
    [assetService, debouncedQuery]
  );

  const state: PanelState<AssetSummary[]> = !trimmed
    ? EMPTY_QUERY_STATE
    : trimmed !== debouncedQuery
      ? { status: 'loading' }
      : fetchState;

  return { query, setQuery, state };
}
