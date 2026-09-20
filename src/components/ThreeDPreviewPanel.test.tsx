import { HttpError } from '@cognite/sdk';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ServicesReactContext, type Services } from '../context/services';

import { ThreeDPreviewPanel } from './ThreeDPreviewPanel';

// The real ThreeDViewer mounts RevealWidget, which needs a WebGL context
// unavailable in happy-dom — stubbed here so this test only covers the
// panel's own state handling (loading/empty/error/no-access), not the
// viewer itself (see ThreeDViewer.test.tsx for that).
vi.mock('./ThreeDViewer', () => ({
  default: ({ revision, assetId }: { revision: { externalId: string }; assetId: { externalId: string } }) => (
    <div data-testid="three-d-viewer-stub">
      {revision.externalId} / {assetId.externalId}
    </div>
  ),
}));

const assetId = { space: 'sp', externalId: 'PUMP-101' };
const revision = { space: 'valhall-three_d', externalId: 'cog_3d_revision_1' };

function renderPanel(overrides: { getCadRevision?: () => Promise<typeof revision | null> }, has3DMapping = true) {
  const services = {
    threeDService: { getCadRevision: overrides.getCadRevision ?? vi.fn(() => Promise.resolve(revision)) },
  } as unknown as Services;
  return render(
    <ServicesReactContext.Provider value={services}>
      <ThreeDPreviewPanel assetId={assetId} has3DMapping={has3DMapping} />
    </ServicesReactContext.Provider>
  );
}

describe('ThreeDPreviewPanel', () => {
  it('shows the empty state when the asset has no 3D mapping (FR-019)', async () => {
    renderPanel({}, false);

    await waitFor(() => expect(screen.getByText(/no 3d model mapped/i)).toBeInTheDocument());
  });

  it('renders the 3D viewer once a mapped asset resolves a CAD revision', async () => {
    renderPanel({});

    await waitFor(() => expect(screen.getByTestId('three-d-viewer-stub')).toBeInTheDocument());
    expect(screen.getByText(/cog_3d_revision_1 \/ pump-101/i)).toBeInTheDocument();
  });

  it('shows a no-access state on a 403', async () => {
    renderPanel({ getCadRevision: () => Promise.reject(new HttpError(403, { error: { code: 403, message: 'Forbidden' } }, {})) });

    await waitFor(() => expect(screen.getByText(/no access/i)).toBeInTheDocument());
  });

  it('shows an error state with retry on other failures', async () => {
    renderPanel({ getCadRevision: () => Promise.reject(new Error('boom')) });

    await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});
