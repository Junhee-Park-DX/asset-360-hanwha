import { Skeleton } from '@cognite/aura/components/skeleton';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { useState } from 'react';

import type { AssetTreeNode } from '../services/assetTree';
import type { InstanceRef } from '../services/types';
import { useAssetHierarchyViewModel } from '../viewmodels/useAssetHierarchyViewModel';

import { PanelEmptyState } from './PanelEmptyState';

function sameAsset(a: InstanceRef, b: InstanceRef | null): boolean {
  return b !== null && a.space === b.space && a.externalId === b.externalId;
}

function TreeRow({
  node,
  depth,
  selectedAssetId,
  onSelectAsset,
}: {
  node: AssetTreeNode;
  depth: number;
  selectedAssetId: InstanceRef | null;
  onSelectAsset: (assetId: InstanceRef) => void;
}) {
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = node.children.length > 0;
  const isSelected = sameAsset({ space: node.space, externalId: node.externalId }, selectedAssetId);

  return (
    <li>
      <div className="flex items-center gap-1 py-1 text-sm" style={{ paddingLeft: depth * 16 }}>
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${node.name}`}
            className="flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            {expanded ? <IconChevronDown size={14} aria-hidden="true" /> : <IconChevronRight size={14} aria-hidden="true" />}
          </button>
        ) : (
          <span className="h-5 w-5 shrink-0" aria-hidden="true" />
        )}
        <button
          type="button"
          onClick={() => onSelectAsset({ space: node.space, externalId: node.externalId })}
          aria-current={isSelected ? 'true' : undefined}
          className={`truncate rounded px-1 text-left hover:bg-muted/50 ${
            isSelected ? 'bg-decorative-background-fjord text-decorative-foreground-fjord font-medium' : ''
          }`}
        >
          {node.name}
        </button>
        {hasChildren ? <span className="ml-auto shrink-0 pl-2 text-xs text-muted-foreground">{node.descendantCount}</span> : null}
      </div>
      {expanded && hasChildren ? (
        <ul>
          {node.children.map((child) => (
            <TreeRow key={child.externalId} node={child} depth={depth + 1} selectedAssetId={selectedAssetId} onSelectAsset={onSelectAsset} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/**
 * The workspace's asset parent/child structure as an expandable, selectable
 * tree — lets an analyst navigate to an asset by its place in the plant
 * hierarchy without knowing its exact tag or name (FR-018). Only the root is
 * expanded by default — this dataset's hierarchy is several levels deep, so
 * expanding everything would dump hundreds of rows at once. A node matching
 * `selectedAssetId` gets the app's `fjord` brand highlight.
 */
export function AssetHierarchyTree({
  selectedAssetId,
  onSelectAsset,
}: {
  selectedAssetId: InstanceRef | null;
  onSelectAsset: (assetId: InstanceRef) => void;
}) {
  const { state } = useAssetHierarchyViewModel();

  if (state.status === 'loading') {
    return (
      <section aria-label="Asset hierarchy" className="flex flex-col gap-2 rounded border p-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </section>
    );
  }

  if (state.status !== 'success') {
    return (
      <section aria-label="Asset hierarchy" className="rounded border">
        <PanelEmptyState
          kind={state.status}
          emptyMessage="Asset hierarchy is unavailable."
          errorMessage={state.status === 'error' ? state.message : undefined}
        />
      </section>
    );
  }

  if (state.data.tree.length === 0) {
    return (
      <section aria-label="Asset hierarchy" className="rounded border">
        <PanelEmptyState kind="empty" emptyMessage="No assets found to build a hierarchy from." />
      </section>
    );
  }

  return (
    <section aria-label="Asset hierarchy" className="rounded border">
      <h2 className="border-b p-3 text-sm font-medium">Asset hierarchy</h2>
      {state.data.truncated ? (
        <p className="border-b bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Showing the first 1,000 assets fetched — the workspace may have more than what's shown here.
        </p>
      ) : null}
      <div className="max-h-96 overflow-y-auto p-2">
        <ul role="tree">
          {state.data.tree.map((root) => (
            <TreeRow key={root.externalId} node={root} depth={0} selectedAssetId={selectedAssetId} onSelectAsset={onSelectAsset} />
          ))}
        </ul>
      </div>
    </section>
  );
}
