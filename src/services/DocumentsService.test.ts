import type { CogniteClient, NodeOrEdge } from '@cognite/sdk';
import { describe, expect, it, vi } from 'vitest';

import { classifyPreviewKind, CogniteDocumentsService } from './DocumentsService';

function makeNode(mimeType: string): NodeOrEdge {
  return {
    instanceType: 'node',
    space: 'sp_files',
    externalId: 'PID-101',
    createdTime: 0,
    lastUpdatedTime: 0,
    version: 1,
    properties: {
      cdf_cdm: {
        'CogniteFile/v1': { name: 'P&ID 101.pdf', mimeType, sourceUpdatedTime: '2024-05-01T00:00:00.000Z' },
      },
    },
  } as NodeOrEdge;
}

function makeClient(items: NodeOrEdge[], getDownloadUrls?: () => Promise<{ downloadUrl?: string }[]>) {
  return {
    instances: { search: vi.fn(() => Promise.resolve({ items })) },
    files: { getDownloadUrls: getDownloadUrls ?? vi.fn(() => Promise.resolve([{ downloadUrl: 'https://example.test/file' }])) },
  } as unknown as CogniteClient;
}

describe('classifyPreviewKind', () => {
  it('classifies application/pdf as pdf', () => {
    expect(classifyPreviewKind('application/pdf')).toBe('pdf');
  });

  it('classifies supported image types as image', () => {
    expect(classifyPreviewKind('image/png')).toBe('image');
    expect(classifyPreviewKind('image/jpeg')).toBe('image');
    expect(classifyPreviewKind('image/gif')).toBe('image');
    expect(classifyPreviewKind('image/webp')).toBe('image');
  });

  it('classifies everything else as unsupported', () => {
    expect(classifyPreviewKind('application/vnd.ms-excel')).toBe('unsupported');
    expect(classifyPreviewKind('video/mp4')).toBe('unsupported');
  });
});

describe('CogniteDocumentsService', () => {
  it('filters CogniteFile by the asset via containsAny on the `assets` property', async () => {
    const client = makeClient([]);
    const service = new CogniteDocumentsService(client);

    await service.listForAsset({ space: 'sp_assets', externalId: 'PUMP-101' });

    expect(client.instances.search).toHaveBeenCalledWith(
      expect.objectContaining({
        view: expect.objectContaining({ externalId: 'CogniteFile' }),
        filter: {
          containsAny: {
            property: ['cdf_cdm', 'CogniteFile/v1', 'assets'],
            values: [{ space: 'sp_assets', externalId: 'PUMP-101' }],
          },
        },
      })
    );
  });

  it('parses a document summary with its preview kind', async () => {
    const client = makeClient([makeNode('application/pdf')]);
    const service = new CogniteDocumentsService(client);

    const [doc] = await service.listForAsset({ space: 'sp_assets', externalId: 'PUMP-101' });

    expect(doc).toEqual({
      instanceId: { space: 'sp_files', externalId: 'PID-101' },
      name: 'P&ID 101.pdf',
      mimeType: 'application/pdf',
      lastModifiedTime: Date.parse('2024-05-01T00:00:00.000Z'),
      previewKind: 'pdf',
    });
  });

  describe('getDownloadUrl', () => {
    it('returns the download URL for the given instance', async () => {
      const client = makeClient([]);
      const service = new CogniteDocumentsService(client);

      const url = await service.getDownloadUrl({ space: 'sp_files', externalId: 'PID-101' });

      expect(client.files.getDownloadUrls).toHaveBeenCalledWith([{ instanceId: { space: 'sp_files', externalId: 'PID-101' } }]);
      expect(url).toBe('https://example.test/file');
    });

    it('returns null when no link is returned', async () => {
      const client = makeClient([], () => Promise.resolve([]));
      const service = new CogniteDocumentsService(client);

      const url = await service.getDownloadUrl({ space: 'sp_files', externalId: 'PID-101' });

      expect(url).toBeNull();
    });
  });
});
