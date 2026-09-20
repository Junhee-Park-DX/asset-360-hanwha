import type { CogniteClient } from '@cognite/sdk';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ServicesReactContext, type Services } from '../context/services';
import type { AssetSummary } from '../services/types';

import { AssetDetailContent } from './AssetDetailContent';

// useCogniteSdk is @cognite/app-sdk's own escape hatch for the raw SDK client
// (needed by the vendored CogniteFileViewer and ThreeDViewer, not injectable
// via this app's own ServicesContext) — mocking the library hook itself is
// the only option.
vi.mock('@cognite/app-sdk/react', () => ({
  useCogniteSdk: () => ({ files: { getDownloadUrls: vi.fn(() => Promise.resolve([])) } }) as unknown as CogniteClient,
}));

// The real ThreeDViewer mounts RevealWidget, which needs a WebGL context
// unavailable in happy-dom (see ThreeDViewer.test.tsx for that coverage).
vi.mock('./ThreeDViewer', () => ({
  default: () => <div data-testid="three-d-viewer-stub" />,
}));

const assetId = { space: 'sp', externalId: 'PUMP-101' };

const asset: AssetSummary = {
  instanceId: assetId,
  tag: 'PUMP-101',
  name: 'Pump 101',
  description: '',
  type: '',
  parentPath: '',
  object3DRef: { space: 'valhall-three_d', externalId: 'obj-1' },
};

function renderView() {
  const recordVisit = vi.fn();
  const services = {
    assetService: { retrieve: vi.fn(() => Promise.resolve(asset)), search: vi.fn() },
    timeSeriesService: { listForAsset: vi.fn(() => Promise.resolve([])), retrieveDatapoints: vi.fn(), retrieveLatestTimestamp: vi.fn() },
    workOrdersService: { listForAsset: vi.fn(() => Promise.resolve([])), retrieve: vi.fn() },
    documentsService: { listForAsset: vi.fn(() => Promise.resolve([])) },
    threeDService: { getCadRevision: vi.fn(() => Promise.resolve({ space: 'valhall-three_d', externalId: 'rev-1' })) },
  } as unknown as Services;
  const view = render(
    <ServicesReactContext.Provider value={services}>
      <AssetDetailContent assetId={assetId} recordVisit={recordVisit} />
    </ServicesReactContext.Provider>
  );
  return { ...view, recordVisit };
}

describe('AssetDetailContent', () => {
  it('renders the header, governance scorecard, 3D preview, and all three panels for the asset', async () => {
    renderView();
    await waitFor(() => expect(screen.getByText('Pump 101')).toBeInTheDocument());

    expect(screen.getByRole('region', { name: 'Time series' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Work orders' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Documents' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Data governance scorecard' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '3D preview' })).toBeInTheDocument();
  });

  it('records the visit in recently-viewed once the header loads successfully', async () => {
    const { recordVisit } = renderView();
    await waitFor(() => expect(recordVisit).toHaveBeenCalledWith(asset));
  });
});
