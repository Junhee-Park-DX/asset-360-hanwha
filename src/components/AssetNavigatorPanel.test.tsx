import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ServicesReactContext, type Services } from '../context/services';
import type { RecentlyViewedEntry } from '../services/RecentlyViewedService';

import { AssetNavigatorPanel } from './AssetNavigatorPanel';

const entries: RecentlyViewedEntry[] = [
  { instanceId: { space: 'sp', externalId: 'PUMP-101' }, tag: 'PUMP-101', name: 'Pump 101' },
];

function renderPanel(overrides: { collapsed?: boolean; selectedAssetId?: { space: string; externalId: string } | null } = {}) {
  const services = {
    assetHierarchyService: { fetchAll: vi.fn(() => Promise.resolve({ nodes: [], truncated: false })) },
  } as unknown as Services;
  const onToggleCollapsed = vi.fn();
  const onSelectAsset = vi.fn();
  const view = render(
    <ServicesReactContext.Provider value={services}>
      <AssetNavigatorPanel
        collapsed={overrides.collapsed ?? false}
        onToggleCollapsed={onToggleCollapsed}
        entries={entries}
        selectedAssetId={overrides.selectedAssetId ?? null}
        onSelectAsset={onSelectAsset}
      />
    </ServicesReactContext.Provider>
  );
  return { ...view, onToggleCollapsed, onSelectAsset };
}

describe('AssetNavigatorPanel', () => {
  it('shows the recently-viewed list and the asset hierarchy tree when expanded (FR-012, FR-018)', () => {
    renderPanel();

    expect(screen.getByText('Recently viewed')).toBeInTheDocument();
    expect(screen.getByText('Pump 101')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Asset hierarchy' })).toBeInTheDocument();
  });

  it('hides its content when collapsed, keeping only the toggle reachable', () => {
    renderPanel({ collapsed: true });

    expect(screen.queryByText('Recently viewed')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /expand navigator/i })).toBeInTheDocument();
  });

  it('calls onToggleCollapsed when the fold button is clicked', async () => {
    const { onToggleCollapsed } = renderPanel();

    await userEvent.click(screen.getByRole('button', { name: /collapse navigator/i }));
    expect(onToggleCollapsed).toHaveBeenCalled();
  });

  it('calls onSelectAsset when a recently-viewed entry is clicked', async () => {
    const { onSelectAsset } = renderPanel();

    await userEvent.click(screen.getByText('Pump 101'));
    expect(onSelectAsset).toHaveBeenCalledWith({ space: 'sp', externalId: 'PUMP-101' });
  });

  it('shows an inviting empty state when nothing has been recently viewed', () => {
    const services = {
      assetHierarchyService: { fetchAll: vi.fn(() => Promise.resolve({ nodes: [], truncated: false })) },
    } as unknown as Services;
    render(
      <ServicesReactContext.Provider value={services}>
        <AssetNavigatorPanel collapsed={false} onToggleCollapsed={vi.fn()} entries={[]} selectedAssetId={null} onSelectAsset={vi.fn()} />
      </ServicesReactContext.Provider>
    );

    expect(screen.getByText(/assets you open will show up here/i)).toBeInTheDocument();
  });

  it('highlights the recently-viewed entry matching selectedAssetId', async () => {
    renderPanel({ selectedAssetId: { space: 'sp', externalId: 'PUMP-101' } });

    await waitFor(() => expect(screen.getByText('Pump 101').closest('button')).toHaveAttribute('aria-current', 'true'));
  });
});
