import { useCogniteSdk } from '@cognite/app-sdk/react';
import {
  Default3DStyles,
  RevealWidget,
  type Reveal3DResourceHandle,
  type RevealWidgetController,
} from '@cognite/reveal-widget';
import { useCallback, useRef } from 'react';

import type { InstanceRef } from '../services/types';

/**
 * Drives `RevealWidgetController` imperatively per the reveal-3d skill's
 * pattern: load the CAD revision, then highlight and focus the selected
 * asset's own instance id. Reveal resolves the CAD-node contextualization
 * for that instance internally — no separate `Cognite3DObject` fetch needed.
 */
class ThreeDViewerController {
  private model: Reveal3DResourceHandle | undefined;

  constructor(private readonly widgetController: RevealWidgetController) {}

  async loadAndFocusAsset(revision: InstanceRef, assetId: InstanceRef): Promise<void> {
    this.model = await this.widgetController.addResource({
      type: 'cad',
      sourceType: 'cdm',
      externalId: revision.externalId,
      space: revision.space,
    });
    await this.widgetController.styleByInstance([{ instanceIds: [assetId], style: Default3DStyles.Highlighted }], [this.model]);
    await this.widgetController.focusInstances([assetId]);
  }

  dispose(): void {
    this.model?.remove();
    this.model = undefined;
  }
}

interface ThreeDViewerProps {
  revision: InstanceRef;
  assetId: InstanceRef;
}

/**
 * The actual `RevealWidget` mount — kept in its own module so
 * `ThreeDPreviewPanel` can `React.lazy()`-load it and keep
 * `@cognite/reveal-widget`/three.js out of the initial bundle until an
 * asset with a real 3D mapping is selected.
 */
export default function ThreeDViewer({ revision, assetId }: ThreeDViewerProps) {
  const sdk = useCogniteSdk();
  const viewerRef = useRef<ThreeDViewerController>();
  // Destructured to primitives so the callback below depends only on the
  // actual identifier values, not object identity — `revision`/`assetId`
  // get fresh object references on every parent re-render even when their
  // contents are unchanged, which would otherwise reload the viewer needlessly.
  const { space: revisionSpace, externalId: revisionExternalId } = revision;
  const { space: assetSpace, externalId: assetExternalId } = assetId;

  const handleControllerRef = useCallback(
    (widgetController: RevealWidgetController | undefined) => {
      viewerRef.current?.dispose();
      if (!widgetController) {
        viewerRef.current = undefined;
        return;
      }
      const controller = new ThreeDViewerController(widgetController);
      void controller.loadAndFocusAsset(
        { space: revisionSpace, externalId: revisionExternalId },
        { space: assetSpace, externalId: assetExternalId }
      );
      viewerRef.current = controller;
    },
    [revisionSpace, revisionExternalId, assetSpace, assetExternalId]
  );

  return (
    <div className="relative h-80 w-full">
      <RevealWidget viewerOptions={{ sdk, useCoreDm: true }} setControllerRef={handleControllerRef} />
    </div>
  );
}
