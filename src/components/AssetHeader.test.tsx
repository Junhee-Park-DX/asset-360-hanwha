import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AssetSummary } from '../services/types';
import type { PanelState } from '../viewmodels/panelState';

import { AssetHeader } from './AssetHeader';

const asset: AssetSummary = {
  instanceId: { space: 'sp', externalId: 'PUMP-101' },
  tag: 'PUMP-101',
  name: 'Pump 101',
  description: 'Main feed pump',
  type: 'Pump',
  parentPath: 'PLANT-A',
  object3DRef: null,
};

function renderWithState(state: PanelState<AssetSummary>) {
  const onRetry = vi.fn();
  return { ...render(<AssetHeader state={state} onRetry={onRetry} />), onRetry };
}

describe('AssetHeader', () => {
  it('shows the asset tag, name, description, and type once loaded (FR-004)', () => {
    renderWithState({ status: 'success', data: asset });

    expect(screen.getByText('Pump 101')).toBeInTheDocument();
    expect(screen.getByText('PUMP-101')).toBeInTheDocument();
    expect(screen.getByText('Main feed pump')).toBeInTheDocument();
    expect(screen.getByText('Pump')).toBeInTheDocument();
  });

  it('shows a loading state', () => {
    renderWithState({ status: 'loading' });
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  it('shows an error state with a retry action', () => {
    const { onRetry } = renderWithState({ status: 'error', message: 'Asset sp:PUMP-101 was not found' });

    expect(screen.getByRole('alert')).toHaveTextContent(/was not found/i);
    screen.getByRole('button', { name: /retry/i }).click();
    expect(onRetry).toHaveBeenCalled();
  });
});
