import type { CogniteClient } from '@cognite/sdk';

import { COGNITE_3D_REVISION_VIEW, propertyPath } from './cdmViews';
import type { InstanceRef } from './types';

export interface ThreeDService {
  /** The workspace's processed CAD model revision, or null if none exists. */
  getCadRevision(): Promise<InstanceRef | null>;
}

const REVISION_LIST_LIMIT = 1;

/**
 * Backs the 3D preview panel (FR-019). `publicdatacdm` was verified live
 * (Fusion's own 3D-model browser) to have exactly one CAD revision
 * ("Valhall"), sourced from the Core Data Model — so `RevealWidget` must be
 * configured with `useCoreDm: true` for this project (see SPEC.md's Data
 * Models section). Once the revision is loaded, the selected asset's own
 * instance id is passed directly to `RevealWidgetController.focusInstances`
 * — Reveal resolves the CAD-node contextualization internally, so no
 * separate `Cognite3DObject` fetch is needed here.
 */
export class CogniteThreeDService implements ThreeDService {
  constructor(private readonly client: CogniteClient) {}

  async getCadRevision(): Promise<InstanceRef | null> {
    // Query the base `Cognite3DRevision` view filtered by `type: CAD` and
    // `status: Done` — not the more specific `CogniteCADRevision` view
    // (`cdf migrate 3d` only ever populates the base Cognite3DModel/
    // Cognite3DRevision instances; CogniteCADRevision is just a filtered
    // read-view over that same data and returns nothing for migrated
    // content), and not `published: true` (this dataset's revision is fully
    // processed — status "Done" — but genuinely has `published: false`;
    // Fusion's own 3D preview loads it anyway, so `published` isn't the
    // right readiness signal — `status: Done` is).
    const response = await this.client.instances.list({
      sources: [{ source: COGNITE_3D_REVISION_VIEW }],
      instanceType: 'node',
      filter: {
        and: [
          { equals: { property: propertyPath(COGNITE_3D_REVISION_VIEW, 'type'), value: 'CAD' } },
          { equals: { property: propertyPath(COGNITE_3D_REVISION_VIEW, 'status'), value: 'Done' } },
        ],
      },
      limit: REVISION_LIST_LIMIT,
    });
    const [node] = response.items;
    return node ? { space: node.space, externalId: node.externalId } : null;
  }
}
