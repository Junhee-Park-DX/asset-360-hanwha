export interface InstanceRef {
  space: string;
  externalId: string;
}

export interface AssetSummary {
  instanceId: InstanceRef;
  tag: string;
  name: string;
  description: string;
  type: string;
  parentPath: string;
  /** The asset's `object3D` direct relation (CogniteVisualizable core feature), or null if unmapped. */
  object3DRef: InstanceRef | null;
}

export interface TimeSeriesSummary {
  instanceId: InstanceRef;
  name: string;
  description: string;
  unit: string;
}

export interface Datapoint {
  timestamp: number;
  value: number;
}

export interface WorkOrderSummary {
  instanceId: InstanceRef;
  title: string;
  description: string;
  status: string;
  endTime: number | null;
  scheduledEndTime: number | null;
}

export type DocumentPreviewKind = 'pdf' | 'image' | 'unsupported';

export interface DocumentSummary {
  instanceId: InstanceRef;
  name: string;
  mimeType: string;
  lastModifiedTime: number | null;
  previewKind: DocumentPreviewKind;
}

export type PanelAccessError = 'no-access' | 'error';

export interface AssetConnections {
  timeSeriesCount: number;
  workOrdersCount: number;
  documentsCount: number;
  has3DMapping: boolean;
}
