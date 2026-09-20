import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ServicesReactContext, type Services } from '../context/services';
import type { AssetHierarchyFetchResult, AssetHierarchyNode } from '../services/AssetHierarchyService';

import { AssetHierarchyTree } from './AssetHierarchyTree';

const nodes: AssetHierarchyNode[] = [
  { space: 'sp_assets', externalId: 'VAL', name: 'Valhall', parentExternalId: null },
  { space: 'sp_assets', externalId: '23', name: '1st stage compression', parentExternalId: 'VAL' },
  { space: 'sp_assets', externalId: '23-KA-9101', name: 'Compressor', parentExternalId: '23' },
];

function renderWithServices(
  overrides: { fetchAll?: () => Promise<AssetHierarchyFetchResult> },
  selectedAssetId: { space: string; externalId: string } | null = null
) {
  const services = {
    assetHierarchyService: { fetchAll: overrides.fetchAll ?? vi.fn(() => Promise.resolve({ nodes, truncated: false })) },
  } as unknown as Services;
  const onSelectAsset = vi.fn();
  const view = render(
    <ServicesReactContext.Provider value={services}>
      <AssetHierarchyTree selectedAssetId={selectedAssetId} onSelectAsset={onSelectAsset} />
    </ServicesReactContext.Provider>
  );
  return { ...view, onSelectAsset };
}

describe('AssetHierarchyTree', () => {
  it('shows the root expanded by default with its child count, but not deeper descendants', async () => {
    renderWithServices({});

    await waitFor(() => expect(screen.getByText('Valhall')).toBeInTheDocument());
    expect(screen.getByText('1st stage compression')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Valhall's descendant count
    expect(screen.queryByText('Compressor')).not.toBeInTheDocument();
  });

  it('expands a collapsed node on click to reveal its children', async () => {
    renderWithServices({});
    await waitFor(() => expect(screen.getByText('1st stage compression')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /expand 1st stage compression/i }));

    expect(screen.getByText('Compressor')).toBeInTheDocument();
  });

  it('collapses an expanded node back on a second click', async () => {
    renderWithServices({});
    await waitFor(() => expect(screen.getByText('Valhall')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /collapse valhall/i }));

    expect(screen.queryByText('1st stage compression')).not.toBeInTheDocument();
  });

  it('calls onSelectAsset with the full instance ref when a node label is clicked (FR-018)', async () => {
    const { onSelectAsset } = renderWithServices({});
    await waitFor(() => expect(screen.getByText('Valhall')).toBeInTheDocument());

    await userEvent.click(screen.getByText('Valhall'));

    expect(onSelectAsset).toHaveBeenCalledWith({ space: 'sp_assets', externalId: 'VAL' });
  });

  it('highlights the node matching selectedAssetId', async () => {
    renderWithServices({}, { space: 'sp_assets', externalId: 'VAL' });
    await waitFor(() => expect(screen.getByText('Valhall')).toBeInTheDocument());

    expect(screen.getByText('Valhall').closest('button')).toHaveAttribute('aria-current', 'true');
  });

  it('shows an empty state when there are no assets', async () => {
    renderWithServices({ fetchAll: () => Promise.resolve({ nodes: [], truncated: false }) });

    await waitFor(() => expect(screen.getByText(/no assets found/i)).toBeInTheDocument());
  });

  it('shows a truncation notice when the fetch hit its page cap', async () => {
    renderWithServices({ fetchAll: () => Promise.resolve({ nodes, truncated: true }) });

    await waitFor(() => expect(screen.getByText(/showing the first 1,000 assets/i)).toBeInTheDocument());
  });

  it('shows no truncation notice when the fetch was complete', async () => {
    renderWithServices({});

    await waitFor(() => expect(screen.getByText('Valhall')).toBeInTheDocument());
    expect(screen.queryByText(/showing the first 1,000 assets/i)).not.toBeInTheDocument();
  });
});
