import { Search } from '@cognite/aura/components/search';
import { DataGrid } from '@cognite/aura/data-grid';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

import type { AssetSummary, InstanceRef } from '../services/types';
import { useAssetSearchViewModel } from '../viewmodels/useAssetSearchViewModel';
import { useRecentlyViewedViewModel } from '../viewmodels/useRecentlyViewedViewModel';

import { AssetDetailContent } from './AssetDetailContent';
import { AssetNavigatorPanel } from './AssetNavigatorPanel';
import { PanelEmptyState } from './PanelEmptyState';

interface WorkspaceViewProps {
  selectedAssetId: InstanceRef | null;
  onSelectAsset: (assetId: InstanceRef) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  navigatorCollapsed: boolean;
  onToggleNavigatorCollapsed: () => void;
}

/**
 * The single merged page (FR-017): search + navigator on the left, and a
 * content area that fills in with the selected asset's full detail — no
 * route change, no separate pages. `useRecentlyViewedViewModel` and
 * `useAssetSearchViewModel` are called once here (their host-synced/shared
 * pieces are owned by App.tsx) and passed down, per CLAUDE.md §5.
 */
export function WorkspaceView({
  selectedAssetId,
  onSelectAsset,
  searchQuery,
  onSearchQueryChange,
  navigatorCollapsed,
  onToggleNavigatorCollapsed,
}: WorkspaceViewProps) {
  const { state: searchState } = useAssetSearchViewModel(searchQuery, onSearchQueryChange);
  const { entries, recordVisit } = useRecentlyViewedViewModel();
  const trimmedQuery = searchQuery.trim();

  const resultColumns = useMemo<ColumnDef<AssetSummary>[]>(
    () => [
      { accessorKey: 'tag', header: 'Tag' },
      { accessorKey: 'name', header: 'Name' },
      {
        id: 'context',
        header: 'Description / location',
        accessorFn: (asset) => [asset.description, asset.parentPath].filter(Boolean).join(' · ') || '—',
      },
    ],
    []
  );

  function handleSelectAsset(assetId: InstanceRef): void {
    onSelectAsset(assetId);
    onSearchQueryChange('');
  }

  return (
    <div className="flex min-h-screen">
      <AssetNavigatorPanel
        collapsed={navigatorCollapsed}
        onToggleCollapsed={onToggleNavigatorCollapsed}
        entries={entries}
        selectedAssetId={selectedAssetId}
        onSelectAsset={handleSelectAsset}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <header className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="h-3 w-3 rounded-full bg-decorative-background-fjord" />
            <h1 className="text-xl font-bold text-foreground">Asset 360 Investigation Workspace</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Search by tag, name, or description, or browse the hierarchy on the left — the asset's full detail fills
            in below.
          </p>
        </header>

        <div className="flex flex-col gap-2 rounded border p-4">
          <label htmlFor="asset-search" className="text-sm font-medium">
            Search for equipment by tag, name, or description
          </label>
          <Search
            id="asset-search"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            onClear={() => onSearchQueryChange('')}
            placeholder="e.g. PUMP-101"
            autoComplete="off"
          />
        </div>

        {trimmedQuery ? (
          <section aria-label="Search results" className="rounded border">
            <h2 className="border-b p-3 text-sm font-medium">
              {searchState.status === 'success' ? `Search results (${searchState.data.length})` : 'Search results'}
            </h2>
            {searchState.status !== 'success' ? (
              <PanelEmptyState
                kind={searchState.status}
                emptyMessage="No assets matched your search — try a different tag, name, or description."
                errorMessage={searchState.status === 'error' ? searchState.message : undefined}
              />
            ) : searchState.data.length === 0 ? (
              <PanelEmptyState
                kind="empty"
                emptyMessage="No assets matched your search — try a different tag, name, or description."
              />
            ) : (
              <div className="h-96">
                <DataGrid
                  aria-label="Search results"
                  data={searchState.data}
                  columns={resultColumns}
                  getRowId={(asset) => asset.instanceId.externalId}
                  size="compact"
                  onRowClick={(row) => handleSelectAsset(row.original.instanceId)}
                />
              </div>
            )}
          </section>
        ) : null}

        {selectedAssetId ? (
          <AssetDetailContent assetId={selectedAssetId} recordVisit={recordVisit} />
        ) : (
          <section className="flex-1 rounded border">
            <PanelEmptyState
              kind="empty"
              emptyMessage="Search for equipment above or pick an asset from the tree on the left to see its full 360° detail."
            />
          </section>
        )}
      </div>
    </div>
  );
}
