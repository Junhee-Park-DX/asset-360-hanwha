import type { CogniteClient, NodeOrEdge } from '@cognite/sdk';

import { COGNITE_FILE_VIEW, propertyPath } from './cdmViews';
import { readString, readTimestamp, readViewProperties } from './propertyReader';
import type { DocumentPreviewKind, DocumentSummary, InstanceRef } from './types';

export interface DocumentsService {
  listForAsset(assetId: InstanceRef): Promise<DocumentSummary[]>;
  getDownloadUrl(instanceId: InstanceRef): Promise<string | null>;
}

const LIST_LIMIT = 100;

const INLINE_IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);

export function classifyPreviewKind(mimeType: string): DocumentPreviewKind {
  if (mimeType === 'application/pdf') return 'pdf';
  if (INLINE_IMAGE_MIME_TYPES.has(mimeType.toLowerCase())) return 'image';
  return 'unsupported';
}

function toDocumentSummary(node: NodeOrEdge): DocumentSummary {
  const properties = readViewProperties(node, COGNITE_FILE_VIEW);
  const mimeType = readString(properties, 'mimeType');
  return {
    instanceId: { space: node.space, externalId: node.externalId },
    name: readString(properties, 'name', node.externalId),
    mimeType,
    lastModifiedTime: readTimestamp(properties, 'sourceUpdatedTime') ?? readTimestamp(properties, 'uploadedTime'),
    previewKind: classifyPreviewKind(mimeType),
  };
}

export class CogniteDocumentsService implements DocumentsService {
  constructor(private readonly client: CogniteClient) {}

  async listForAsset(assetId: InstanceRef): Promise<DocumentSummary[]> {
    const response = await this.client.instances.search({
      view: COGNITE_FILE_VIEW,
      instanceType: 'node',
      limit: LIST_LIMIT,
      filter: {
        containsAny: {
          // The docs page for CogniteFile literally lists this property as
          // `asset` (singular) — but the live `publicdatacdm` deployment
          // rejects that with a 400 ("property does not exist"), confirmed
          // against the real running app. `assets` (plural) is what the
          // actual deployed CogniteFile/v1 view accepts; treat the docs page
          // as wrong/stale for this field rather than the live API.
          property: propertyPath(COGNITE_FILE_VIEW, 'assets'),
          values: [{ space: assetId.space, externalId: assetId.externalId }],
        },
      },
    });
    return response.items.map(toDocumentSummary);
  }

  async getDownloadUrl(instanceId: InstanceRef): Promise<string | null> {
    const [link] = await this.client.files.getDownloadUrls([{ instanceId }]);
    return link?.downloadUrl ?? null;
  }
}
