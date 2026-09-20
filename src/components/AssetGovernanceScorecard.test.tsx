import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { PanelState } from '../viewmodels/panelState';

import { AssetGovernanceScorecard } from './AssetGovernanceScorecard';

function successState(length: number): PanelState<unknown[]> {
  return { status: 'success', data: Array.from({ length }) };
}

describe('AssetGovernanceScorecard', () => {
  it('shows live counts for each connected data type and the 3D-mapping status (FR-020)', () => {
    render(
      <AssetGovernanceScorecard
        timeSeriesState={successState(3)}
        workOrdersState={successState(8)}
        documentsState={successState(0)}
        has3DMapping
      />
    );

    expect(screen.getByText(/time series: 3 linked/i)).toBeInTheDocument();
    expect(screen.getByText(/work orders: 8 linked/i)).toBeInTheDocument();
    expect(screen.getByText(/documents: 0 linked/i)).toBeInTheDocument();
    expect(screen.getByText(/3d mapping: mapped/i)).toBeInTheDocument();
  });

  it('flags a missing 3D mapping distinctly from a populated dimension (SC-007)', () => {
    render(
      <AssetGovernanceScorecard
        timeSeriesState={successState(3)}
        workOrdersState={successState(0)}
        documentsState={successState(0)}
        has3DMapping={false}
      />
    );

    expect(screen.getByText(/3d mapping: not mapped/i)).toBeInTheDocument();
  });

  it('shows a skeleton while any of the three lists is still loading', () => {
    render(
      <AssetGovernanceScorecard
        timeSeriesState={{ status: 'loading' }}
        workOrdersState={successState(0)}
        documentsState={successState(0)}
        has3DMapping={false}
      />
    );

    expect(screen.queryByText(/linked/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Data governance scorecard')).toBeInTheDocument();
  });

  it('shows a neutral placeholder instead of a misleading "0 linked" when a list errors', () => {
    render(
      <AssetGovernanceScorecard
        timeSeriesState={{ status: 'error', message: 'boom' }}
        workOrdersState={successState(0)}
        documentsState={successState(0)}
        has3DMapping={false}
      />
    );

    expect(screen.getByText('Time series: —')).toBeInTheDocument();
  });
});
