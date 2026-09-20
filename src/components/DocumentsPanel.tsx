import { Button } from '@cognite/aura/components/button';
import { DataGrid } from '@cognite/aura/data-grid';
import type { ColumnDef } from '@tanstack/react-table';
import { lazy, Suspense, useMemo, useState } from 'react';

import type { DocumentSummary } from '../services/types';
import type { DocumentsPanelViewModel } from '../viewmodels/useDocumentsPanelViewModel';

import { PanelEmptyState } from './PanelEmptyState';

// Lazy-loaded so react-pdf/pdf.js only enter the bundle once a user actually
// clicks "Preview" on a document, instead of shipping in the app's eager
// main chunk on every load (same pattern as ThreeDViewer's reveal-widget load).
const DocumentPreview = lazy(() => import('./DocumentPreview'));

function formatDate(timestamp: number | null): string {
  return timestamp ? new Date(timestamp).toLocaleDateString() : '—';
}

function DownloadLink({ document, download }: { document: DocumentSummary; download: (document: DocumentSummary) => Promise<string | null> }) {
  async function handleDownload(): Promise<void> {
    const url = await download(document);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={() => void handleDownload()}>
      Download
    </Button>
  );
}

/**
 * `vm` is owned by `AssetDetailContent` (called once there, per CLAUDE.md
 * §5) and passed down rather than called again here — the governance
 * scorecard needs this exact same list just to count it, and a second
 * independent fetch here would double the network calls for every asset
 * selection.
 */
export function DocumentsPanel({ vm }: { vm: DocumentsPanelViewModel }) {
  const { state, refetch, download } = vm;
  const [openId, setOpenId] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<DocumentSummary>[]>(
    () => [
      { accessorKey: 'name', header: 'Document' },
      {
        id: 'lastModified',
        header: 'Last modified',
        accessorFn: (document) => document.lastModifiedTime ?? 0,
        cell: ({ row }) => formatDate(row.original.lastModifiedTime),
      },
      {
        id: 'action',
        header: '',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.previewKind !== 'unsupported' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                setOpenId((current) => (current === row.original.instanceId.externalId ? null : row.original.instanceId.externalId));
              }}
            >
              {openId === row.original.instanceId.externalId ? 'Hide preview' : 'Preview'}
            </Button>
          ) : (
            <DownloadLink document={row.original} download={download} />
          ),
      },
    ],
    [openId, download]
  );

  if (state.status !== 'success') {
    return (
      <PanelEmptyState
        kind={state.status}
        emptyMessage="No documents for this asset."
        errorMessage={state.status === 'error' ? state.message : undefined}
        onRetry={refetch}
      />
    );
  }

  if (state.data.length === 0) {
    return <PanelEmptyState kind="empty" emptyMessage="No documents for this asset." />;
  }

  const openDocument = state.data.find((document) => document.instanceId.externalId === openId) ?? null;

  return (
    <div className="flex flex-col">
      {/* Fixed-height box: this list can hold up to 100 documents, so it
          scrolls internally via DataGrid's own virtualized body rather than
          stretching the page as items pile up (same fix as AuditLogPanel). */}
      <div className="h-72">
        <DataGrid aria-label="Documents" data={state.data} columns={columns} getRowId={(document) => document.instanceId.externalId} size="compact" />
      </div>
      {openDocument ? (
        <Suspense fallback={<PanelEmptyState kind="loading" emptyMessage="" />}>
          <DocumentPreview document={openDocument} onClose={() => setOpenId(null)} />
        </Suspense>
      ) : null}
    </div>
  );
}
