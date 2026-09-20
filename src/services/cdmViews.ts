import type { ViewReference } from '@cognite/sdk';

const CDF_CDM_SPACE = 'cdf_cdm';
const CDM_VERSION = 'v1';

function view(externalId: string): ViewReference {
  return { type: 'view', space: CDF_CDM_SPACE, externalId, version: CDM_VERSION };
}

export const COGNITE_ASSET_VIEW = view('CogniteAsset');
export const COGNITE_TIME_SERIES_VIEW = view('CogniteTimeSeries');
export const COGNITE_ACTIVITY_VIEW = view('CogniteActivity');
export const COGNITE_FILE_VIEW = view('CogniteFile');
// `cdf migrate 3d` (the Cognite Toolkit's classic-to-CDM 3D migration) creates
// `Cognite3DModel`/`Cognite3DRevision` instances — the base views — not the
// more specific `CogniteCADModel`/`CogniteCADRevision` views, which merely
// *filter* Cognite3DModel/Cognite3DRevision by `type = CAD` rather than being
// separately populated. Querying the specific views directly returns nothing
// for migrated data; querying the base view with a `type` filter finds it.
export const COGNITE_3D_REVISION_VIEW = view('Cognite3DRevision');

export function propertyPath(viewRef: ViewReference, property: string): [string, string, string] {
  return [viewRef.space, `${viewRef.externalId}/${viewRef.version}`, property];
}
