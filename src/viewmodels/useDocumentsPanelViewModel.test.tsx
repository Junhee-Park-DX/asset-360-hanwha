import { HttpError } from '@cognite/sdk';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { ServicesReactContext, type Services } from '../context/services';
import type { DocumentSummary } from '../services/types';

import { useDocumentsPanelViewModel } from './useDocumentsPanelViewModel';

const assetId = { space: 'sp', externalId: 'PUMP-101' };

const document: DocumentSummary = {
  instanceId: { space: 'sp', externalId: 'PID-1' },
  name: 'P&ID.pdf',
  mimeType: 'application/pdf',
  lastModifiedTime: null,
  previewKind: 'pdf',
};

function makeServices(
  listForAsset: () => Promise<DocumentSummary[]>,
  getDownloadUrl: () => Promise<string | null> = () => Promise.resolve('https://example.test/file')
): Services {
  return {
    documentsService: { listForAsset, getDownloadUrl },
  } as unknown as Services;
}

function wrapperFor(services: Services) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <ServicesReactContext.Provider value={services}>{children}</ServicesReactContext.Provider>;
  };
}

describe('useDocumentsPanelViewModel', () => {
  it('resolves to success with the fetched documents (FR-009)', async () => {
    const services = makeServices(() => Promise.resolve([document]));
    const { result } = renderHook(() => useDocumentsPanelViewModel(assetId), { wrapper: wrapperFor(services) });

    await waitFor(() => expect(result.current.state).toEqual({ status: 'success', data: [document] }));
  });

  it('surfaces a no-access state on a 401', async () => {
    const services = makeServices(() => Promise.reject(new HttpError(401, { error: { code: 401, message: 'Unauthorized' } }, {})));
    const { result } = renderHook(() => useDocumentsPanelViewModel(assetId), { wrapper: wrapperFor(services) });

    await waitFor(() => expect(result.current.state).toEqual({ status: 'no-access' }));
  });

  describe('download', () => {
    it('resolves the download URL', async () => {
      const services = makeServices(() => Promise.resolve([document]));
      const { result } = renderHook(() => useDocumentsPanelViewModel(assetId), { wrapper: wrapperFor(services) });

      const url = await result.current.download(document);

      expect(url).toBe('https://example.test/file');
    });

    it('returns null when no URL is returned', async () => {
      const services = makeServices(() => Promise.resolve([document]), () => Promise.resolve(null));
      const { result } = renderHook(() => useDocumentsPanelViewModel(assetId), { wrapper: wrapperFor(services) });

      const url = await result.current.download(document);

      expect(url).toBeNull();
    });
  });
});
