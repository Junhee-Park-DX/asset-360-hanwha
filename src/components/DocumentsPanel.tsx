import { useCogniteSdk } from '@cognite/app-sdk/react';
import { Button } from '@cognite/aura/components/button';
import { DataGrid } from '@cognite/aura/data-grid';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';

import { CogniteFileViewer } from '../cognite-file-viewer';
import type { DocumentSummary, InstanceRef } from '../services/types';
import { useDocumentsPanelViewModel } from '../viewmodels/useDocumentsPanelViewModel';

import { PanelEmptyState } from './PanelEmptyState';

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

function DocumentPreview({ document, onClose }: { document: DocumentSummary; onClose: () => void }) {
  // CogniteFileViewer is a vendored third-party component that requires the
  // raw SDK client as a prop — it isn't one of this app's own CDF calls, so
  // it stays outside the service/ViewModel layer.
  const client = useCogniteSdk();
  return (
    <div className="flex flex-col gap-2 border-t p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{document.name}</span>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
      {/* CogniteFileViewer renders PDFs via pdf.js (no embedded-script execution)
          and images via a plain <img>, inside this app's own sandboxed/CSP'd
          origin — no raw <iframe>/<embed> of untrusted file content (FR-010a). */}
      <CogniteFileViewer
        source={{ type: 'instanceId', space: document.instanceId.space, externalId: document.instanceId.externalId }}
        client={client}
        style={{ width: '100%', height: '480px' }}
      />
    </div>
  );
}

export function DocumentsPanel({ assetId }: { assetId: InstanceRef }) {
  const { state, refetch, download } = useDocumentsPanelViewModel(assetId);
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
      {openDocument ? <DocumentPreview document={openDocument} onClose={() => setOpenId(null)} /> : null}
    </div>
  );
}
