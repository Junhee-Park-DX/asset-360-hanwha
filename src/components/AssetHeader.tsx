import type { AssetSummary } from '../services/types';
import type { PanelState } from '../viewmodels/panelState';

import { PanelEmptyState } from './PanelEmptyState';

interface AssetHeaderProps {
  state: PanelState<AssetSummary>;
  onRetry: () => void;
}

/**
 * Presentational only — state comes from the parent (AssetDetailContent),
 * which fetches it once via useAssetHeaderViewModel and passes it down.
 * Fetching here too would duplicate the request (see §5 "how many times to
 * call a ViewModel hook" in CLAUDE.md).
 */
export function AssetHeader({ state, onRetry }: AssetHeaderProps) {
  if (state.status !== 'success') {
    return (
      <PanelEmptyState
        kind={state.status}
        emptyMessage="Asset not found."
        errorMessage={state.status === 'error' ? state.message : undefined}
        onRetry={onRetry}
      />
    );
  }

  const asset = state.data;
  return (
    <header className="flex flex-col gap-1 border-b p-4">
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-decorative-background-fjord" />
        <h1 className="text-xl font-semibold">{asset.name}</h1>
        <span className="text-sm text-muted-foreground">{asset.tag}</span>
      </div>
      {asset.type ? <span className="text-sm text-muted-foreground">{asset.type}</span> : null}
      {asset.description ? <p className="text-sm">{asset.description}</p> : null}
      {asset.parentPath ? <p className="text-xs text-muted-foreground">{asset.parentPath}</p> : null}
    </header>
  );
}
