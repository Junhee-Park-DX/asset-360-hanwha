import type { CogniteClient } from '@cognite/sdk';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ServicesReactContext, type Services } from '../context/services';
import type { AssetSummary, InstanceRef } from '../services/types';

import { WorkspaceView } from './WorkspaceView';

// happy-dom does no real layout, so Aura DataGrid's real virtualizer
// (@tanstack/react-virtual) measures a zero-size container and renders no
// rows. Mock it to render every row instead — see vitest.config.ts's
// server.deps.inline note for why this needs @cognite/aura inlined to work.
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: (options: { count: number; estimateSize: () => number }) => ({
    getTotalSize: () => options.count * options.estimateSize(),
    scrollToIndex: () => undefined,
    getVirtualItems: () =>
      Array.from({ length: options.count }, (_, index) => ({
        index,
        start: index * options.estimateSize(),
        size: options.estimateSize(),
        key: index,
      })),
  }),
}));

vi.mock('@cognite/app-sdk/react', () => ({
  useCogniteSdk: () => ({ files: { getDownloadUrls: vi.fn(() => Promise.resolve([])) } }) as unknown as CogniteClient,
}));

vi.mock('./ThreeDViewer', () => ({
  default: () => <div data-testid="three-d-viewer-stub" />,
}));

const asset: AssetSummary = {
  instanceId: { space: 'sp', externalId: 'PUMP-101' },
  tag: 'PUMP-101',
  name: 'Pump 101',
  description: 'Main feed pump',
  type: 'Pump',
  parentPath: 'PLANT-A',
  object3DRef: null,
};

// Simulates the host-synced state App.tsx would own — searchQuery must
// actually round-trip for typing to feed useAssetSearchViewModel's debounce.
function Harness({
  selectedAssetId,
  onSelectAsset,
  onSearchQueryChange,
}: {
  selectedAssetId: InstanceRef | null;
  onSelectAsset: (assetId: InstanceRef) => void;
  onSearchQueryChange: (query: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  return (
    <WorkspaceView
      selectedAssetId={selectedAssetId}
      onSelectAsset={onSelectAsset}
      searchQuery={searchQuery}
      onSearchQueryChange={(query) => {
        setSearchQuery(query);
        onSearchQueryChange(query);
      }}
      navigatorCollapsed={false}
      onToggleNavigatorCollapsed={vi.fn()}
    />
  );
}

function renderWithServices(overrides: {
  search?: () => Promise<AssetSummary[]>;
  selectedAssetId?: { space: string; externalId: string } | null;
}) {
  const services = {
    assetService: {
      search: overrides.search ?? vi.fn(() => Promise.resolve([asset])),
      retrieve: vi.fn(() => Promise.resolve(asset)),
    },
    assetHierarchyService: { fetchAll: vi.fn(() => Promise.resolve({ nodes: [], truncated: false })) },
    recentlyViewedService: { list: vi.fn(() => []), record: vi.fn() },
    timeSeriesService: { listForAsset: vi.fn(() => Promise.resolve([])), retrieveDatapoints: vi.fn(), retrieveLatestTimestamp: vi.fn() },
    workOrdersService: { listForAsset: vi.fn(() => Promise.resolve([])), retrieve: vi.fn() },
    documentsService: { listForAsset: vi.fn(() => Promise.resolve([])) },
    threeDService: { getCadRevision: vi.fn(() => Promise.resolve(null)) },
  } as unknown as Services;
  const onSelectAsset = vi.fn();
  const onSearchQueryChange = vi.fn();
  const view = render(
    <ServicesReactContext.Provider value={services}>
      <Harness selectedAssetId={overrides.selectedAssetId ?? null} onSelectAsset={onSelectAsset} onSearchQueryChange={onSearchQueryChange} />
    </ServicesReactContext.Provider>
  );
  return { ...view, onSelectAsset, onSearchQueryChange };
}

describe('WorkspaceView', () => {
  it('shows the header, search box, and navigator — not a bare search form (FR-017)', () => {
    renderWithServices({});

    expect(screen.getByRole('heading', { name: /asset 360 investigation workspace/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/search for equipment/i)).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Asset navigator' })).toBeInTheDocument();
  });

  it('shows an inviting waiting state when no asset is selected', () => {
    renderWithServices({});

    expect(screen.getByText(/search for equipment above or pick an asset/i)).toBeInTheDocument();
  });

  it('fills in the content area with the asset detail once an asset is selected (FR-003)', async () => {
    renderWithServices({ selectedAssetId: { space: 'sp', externalId: 'PUMP-101' } });

    await waitFor(() => expect(screen.getByText('Pump 101')).toBeInTheDocument());
    expect(screen.getByRole('region', { name: 'Time series' })).toBeInTheDocument();
  });

  it('typing a query shows ranked results, and selecting one calls onSelectAsset and clears the query', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { onSelectAsset, onSearchQueryChange } = renderWithServices({});
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    await user.type(screen.getByLabelText(/search for equipment/i), 'pump');
    await vi.advanceTimersByTimeAsync(300);
    await waitFor(() => expect(screen.getByText('Pump 101')).toBeInTheDocument());

    await user.click(screen.getByRole('row', { name: /pump 101/i }));

    expect(onSelectAsset).toHaveBeenCalledWith({ space: 'sp', externalId: 'PUMP-101' });
    expect(onSearchQueryChange).toHaveBeenCalledWith('');
    vi.useRealTimers();
  });
});
