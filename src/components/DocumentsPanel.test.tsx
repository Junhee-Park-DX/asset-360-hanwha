import type { CogniteClient } from '@cognite/sdk';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ServicesReactContext, type Services } from '../context/services';
import type { DocumentSummary } from '../services/types';
import { useDocumentsPanelViewModel } from '../viewmodels/useDocumentsPanelViewModel';

import { DocumentsPanel } from './DocumentsPanel';

// CogniteFileViewer needs the raw SDK client (a vendored library requirement,
// not one of this app's own CDF calls — see DocumentsPanel.tsx's comment).
vi.mock('@cognite/app-sdk/react', () => ({
  useCogniteSdk: () => ({}) as unknown as CogniteClient,
}));

vi.mock('../cognite-file-viewer', () => ({
  CogniteFileViewer: ({ source }: { source: { space: string; externalId: string } }) => (
    <div data-testid="file-viewer">{`${source.space}:${source.externalId}`}</div>
  ),
}));

// happy-dom does no real layout, so Aura DataGrid's real virtualizer
// (@tanstack/react-virtual) measures a zero-size container and renders no
// rows. Mock it to render every row instead — see vitest.config.ts's
// server.deps.inline note for why this needs @cognite/aura inlined to work.
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: (options: { count: number; estimateSize: () => number }) => ({
    getTotalSize: () => options.count * options.estimateSize(),
    scrollToIndex: () => undefined,
    getVirtualItems: () =>
      Array.from({ length: options.count }, (_, index) => ({
        index,
        start: index * options.estimateSize(),
        size: options.estimateSize(),
        key: index,
      })),
  }),
}));

const assetId = { space: 'sp', externalId: 'PUMP-101' };

const pdfDocument: DocumentSummary = {
  instanceId: { space: 'sp_files', externalId: 'PID-1' },
  name: 'P&ID.pdf',
  mimeType: 'application/pdf',
  lastModifiedTime: null,
  previewKind: 'pdf',
};

const excelDocument: DocumentSummary = {
  instanceId: { space: 'sp_files', externalId: 'REPORT-1' },
  name: 'report.xlsx',
  mimeType: 'application/vnd.ms-excel',
  lastModifiedTime: null,
  previewKind: 'unsupported',
};

// AssetDetailContent owns the ViewModel call (per CLAUDE.md §5); this
// harness mirrors that so the panel is tested through its real prop shape.
function Harness() {
  const vm = useDocumentsPanelViewModel(assetId);
  return <DocumentsPanel vm={vm} />;
}

function renderWithServices(
  listForAsset: () => Promise<DocumentSummary[]>,
  getDownloadUrl: () => Promise<string | null> = () => Promise.resolve('https://example.test/file')
) {
  const services = {
    documentsService: { listForAsset, getDownloadUrl },
    auditLogService: { record: vi.fn(), list: vi.fn(), exportCsv: vi.fn() },
  } as unknown as Services;
  return render(
    <ServicesReactContext.Provider value={services}>
      <Harness />
    </ServicesReactContext.Provider>
  );
}

describe('DocumentsPanel', () => {
  it('lists documents with name, type-derived preview action, and last-modified date (FR-009)', async () => {
    renderWithServices(() => Promise.resolve([pdfDocument]));
    await waitFor(() => expect(screen.getByText('P&ID.pdf')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument();
  });

  it('opens an inline preview for a PDF (FR-010)', async () => {
    renderWithServices(() => Promise.resolve([pdfDocument]));
    await waitFor(() => expect(screen.getByText('P&ID.pdf')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /preview/i }));

    await waitFor(() => expect(screen.getByTestId('file-viewer')).toHaveTextContent('sp_files:PID-1'));
  });

  it('offers a working download action instead of inline preview for unsupported types (FR-010)', async () => {
    const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null);
    const getDownloadUrl = vi.fn(() => Promise.resolve('https://example.test/file'));
    renderWithServices(() => Promise.resolve([excelDocument]), getDownloadUrl);
    await waitFor(() => expect(screen.getByText('report.xlsx')).toBeInTheDocument());

    expect(screen.queryByRole('button', { name: /preview/i })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /download/i }));

    await waitFor(() => expect(getDownloadUrl).toHaveBeenCalledWith(excelDocument.instanceId));
    expect(windowOpen).toHaveBeenCalledWith('https://example.test/file', '_blank', 'noopener,noreferrer');
    windowOpen.mockRestore();
  });

  it('shows its own empty state when there are no documents', async () => {
    renderWithServices(() => Promise.resolve([]));
    await waitFor(() => expect(screen.getByText('No documents for this asset.')).toBeInTheDocument());
  });
});
