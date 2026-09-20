import { Button } from '@cognite/aura/components/button';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

import type { RecentlyViewedEntry } from '../services/RecentlyViewedService';
import type { InstanceRef } from '../services/types';

import { AssetHierarchyTree } from './AssetHierarchyTree';

function sameAsset(a: InstanceRef, b: InstanceRef | null): boolean {
  return b !== null && a.space === b.space && a.externalId === b.externalId;
}

interface AssetNavigatorPanelProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  entries: RecentlyViewedEntry[];
  selectedAssetId: InstanceRef | null;
  onSelectAsset: (assetId: InstanceRef) => void;
}

/**
 * Persistent navigator (FR-012, FR-018): recently-viewed assets for a
 * one-click jump back, and the asset hierarchy tree for browsing without
 * knowing an exact tag or name. Replaces asset-360's Dashboard/Security
 * `Sidebar` — there's no second page to navigate to here, just a way to pick
 * which asset the single content area shows. Foldable via the same
 * `sticky top-0 h-screen` pattern proven there, so the fold control stays
 * reachable even once the page scrolls past viewport height.
 */
export function AssetNavigatorPanel({
  collapsed,
  onToggleCollapsed,
  entries,
  selectedAssetId,
  onSelectAsset,
}: AssetNavigatorPanelProps) {
  return (
    <nav
      aria-label="Asset navigator"
      className={`sticky top-0 flex h-screen shrink-0 flex-col gap-3 overflow-y-auto border-r p-2 ${collapsed ? 'w-14' : 'w-72'}`}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleCollapsed}
        aria-label={collapsed ? 'Expand navigator' : 'Collapse navigator'}
        className="w-fit"
      >
        {collapsed ? <IconChevronRight size={16} aria-hidden="true" /> : <IconChevronLeft size={16} aria-hidden="true" />}
      </Button>

      {collapsed ? null : (
        <>
          <section aria-label="Recently viewed assets" className="rounded border">
            <h2 className="border-b p-2 text-sm font-medium">Recently viewed</h2>
            {entries.length === 0 ? (
              <p className="p-2 text-xs text-muted-foreground">Assets you open will show up here.</p>
            ) : (
              <ul className="flex flex-col p-1">
                {entries.map((entry) => {
                  const isSelected = sameAsset(entry.instanceId, selectedAssetId);
                  return (
                    <li key={entry.instanceId.externalId}>
                      <button
                        type="button"
                        onClick={() => onSelectAsset(entry.instanceId)}
                        aria-current={isSelected ? 'true' : undefined}
                        className={`w-full truncate rounded px-2 py-1 text-left text-sm hover:bg-muted/50 ${
                          isSelected ? 'bg-decorative-background-fjord text-decorative-foreground-fjord font-medium' : ''
                        }`}
                      >
                        {entry.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <AssetHierarchyTree selectedAssetId={selectedAssetId} onSelectAsset={onSelectAsset} />
        </>
      )}
    </nav>
  );
}
