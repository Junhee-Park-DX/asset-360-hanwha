import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ServicesReactContext, type Services } from '../context/services';

import { AssetGovernanceScorecard } from './AssetGovernanceScorecard';

const assetId = { space: 'sp', externalId: 'PUMP-101' };

function renderWithServices(overrides: {
  timeSeriesCount?: number;
  workOrdersCount?: number;
  documentsCount?: number;
  has3DMapping?: boolean;
  fail?: boolean;
}) {
  const services = {
    timeSeriesService: {
      listForAsset: overrides.fail
        ? vi.fn(() => Promise.reject(new Error('boom')))
        : vi.fn(() => Promise.resolve(Array.from({ length: overrides.timeSeriesCount ?? 0 }))),
    },
    workOrdersService: { listForAsset: vi.fn(() => Promise.resolve(Array.from({ length: overrides.workOrdersCount ?? 0 }))) },
    documentsService: { listForAsset: vi.fn(() => Promise.resolve(Array.from({ length: overrides.documentsCount ?? 0 }))) },
  } as unknown as Services;
  return render(
    <ServicesReactContext.Provider value={services}>
      <AssetGovernanceScorecard assetId={assetId} has3DMapping={overrides.has3DMapping ?? false} />
    </ServicesReactContext.Provider>
  );
}

describe('AssetGovernanceScorecard', () => {
  it('shows live counts for each connected data type and the 3D-mapping status (FR-020)', async () => {
    renderWithServices({ timeSeriesCount: 3, workOrdersCount: 8, documentsCount: 0, has3DMapping: true });

    await waitFor(() => expect(screen.getByText(/time series: 3 linked/i)).toBeInTheDocument());
    expect(screen.getByText(/work orders: 8 linked/i)).toBeInTheDocument();
    expect(screen.getByText(/documents: 0 linked/i)).toBeInTheDocument();
    expect(screen.getByText(/3d mapping: mapped/i)).toBeInTheDocument();
  });

  it('flags a missing 3D mapping distinctly from a populated dimension (SC-007)', async () => {
    renderWithServices({ timeSeriesCount: 3, has3DMapping: false });

    await waitFor(() => expect(screen.getByText(/3d mapping: not mapped/i)).toBeInTheDocument());
  });

  it('renders nothing on a fetch error rather than a broken scorecard', async () => {
    const { container } = renderWithServices({ fail: true });

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
