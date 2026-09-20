import type { CogniteClient } from '@cognite/sdk';
import { render, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ThreeDViewer from './ThreeDViewer';

// RevealWidget needs a real WebGL context, unavailable in happy-dom — stub
// it with a component that drives `setControllerRef` the same way the real
// widget would (call with a controller on mount, `undefined` on unmount),
// so ThreeDViewerController's own load/dispose logic can be tested for real.
const mockController = {
  addResource: vi.fn(() => Promise.resolve({ remove: vi.fn() })),
  styleByInstance: vi.fn(() => Promise.resolve()),
  focusInstances: vi.fn(() => Promise.resolve()),
};

vi.mock('@cognite/reveal-widget', () => ({
  Default3DStyles: { Highlighted: { cad: {} } },
  RevealWidget: ({ setControllerRef }: { setControllerRef?: (controller: typeof mockController | undefined) => void }) => {
    useEffect(() => {
      setControllerRef?.(mockController);
      return () => setControllerRef?.(undefined);
    }, [setControllerRef]);
    return <div data-testid="reveal-widget-stub" />;
  },
}));

vi.mock('@cognite/app-sdk/react', () => ({
  useCogniteSdk: () => ({}) as unknown as CogniteClient,
}));

const revision = { space: 'valhall-three_d', externalId: 'cog_3d_revision_1' };
const assetId = { space: 'sp', externalId: 'PUMP-101' };

describe('ThreeDViewer', () => {
  beforeEach(() => {
    mockController.addResource.mockReset().mockResolvedValue({ remove: vi.fn() });
    mockController.styleByInstance.mockReset().mockResolvedValue(undefined);
    mockController.focusInstances.mockReset().mockResolvedValue(undefined);
  });

  it('loads the CAD revision and highlights/focuses the selected asset (FR-019)', async () => {
    render(<ThreeDViewer revision={revision} assetId={assetId} />);

    await waitFor(() =>
      expect(mockController.addResource).toHaveBeenCalledWith({
        type: 'cad',
        sourceType: 'cdm',
        externalId: revision.externalId,
        space: revision.space,
      })
    );
    await waitFor(() => expect(mockController.focusInstances).toHaveBeenCalledWith([assetId]));
    expect(mockController.styleByInstance).toHaveBeenCalledWith(
      [{ instanceIds: [assetId], style: { cad: {} } }],
      [{ remove: expect.any(Function) }]
    );
  });

  it('disposes the loaded model on unmount', async () => {
    const handle = { remove: vi.fn() };
    mockController.addResource.mockResolvedValueOnce(handle);
    const { unmount } = render(<ThreeDViewer revision={revision} assetId={assetId} />);

    // Wait for the full load chain (not just the addResource call) to
    // resolve before unmounting, so `this.model` is actually assigned when
    // dispose() runs — otherwise unmount could race ahead of the async load.
    await waitFor(() => expect(mockController.focusInstances).toHaveBeenCalled());
    unmount();

    expect(handle.remove).toHaveBeenCalled();
  });
});
