import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { DataGrid } from '@cognite/aura/data-grid';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';

import type { InstanceRef, WorkOrderSummary } from '../services/types';
import { useWorkOrdersPanelViewModel } from '../viewmodels/useWorkOrdersPanelViewModel';

import { PanelEmptyState } from './PanelEmptyState';

function formatDate(timestamp: number | null): string {
  return timestamp ? new Date(timestamp).toLocaleDateString() : '—';
}

function WorkOrderDetail({ workOrder, onClose }: { workOrder: WorkOrderSummary; onClose: () => void }) {
  return (
    <div className="flex flex-col gap-2 border-t p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium">{workOrder.title}</span>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
      <p>{workOrder.description || 'No description.'}</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <dt>Status</dt>
        <dd>{workOrder.status}</dd>
        <dt>End time</dt>
        <dd>{formatDate(workOrder.endTime ?? workOrder.scheduledEndTime)}</dd>
      </dl>
    </div>
  );
}

export function WorkOrdersPanel({ assetId }: { assetId: InstanceRef }) {
  const { state, refetch } = useWorkOrdersPanelViewModel(assetId);
  const [openId, setOpenId] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<WorkOrderSummary>[]>(
    () => [
      { accessorKey: 'title', header: 'Work order' },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (workOrder) => workOrder.status,
        cell: ({ row }) => <Badge variant={row.original.status === 'open' ? 'warning' : 'secondary'}>{row.original.status}</Badge>,
      },
      {
        id: 'date',
        header: 'End date',
        accessorFn: (workOrder) => workOrder.endTime ?? workOrder.scheduledEndTime ?? 0,
        cell: ({ row }) => formatDate(row.original.endTime ?? row.original.scheduledEndTime),
      },
    ],
    []
  );

  if (state.status !== 'success') {
    return (
      <PanelEmptyState
        kind={state.status}
        emptyMessage="No work orders for this asset."
        errorMessage={state.status === 'error' ? state.message : undefined}
        onRetry={refetch}
      />
    );
  }

  if (state.data.length === 0) {
    return <PanelEmptyState kind="empty" emptyMessage="No work orders for this asset." />;
  }

  const openWorkOrder = state.data.find((workOrder) => workOrder.instanceId.externalId === openId) ?? null;

  return (
    <div className="flex flex-col">
      {/* Fixed-height box: this list can hold up to 100 work orders, so it
          scrolls internally via DataGrid's own virtualized body rather than
          stretching the page as items pile up (same fix as AuditLogPanel). */}
      <div className="h-72">
        <DataGrid
          aria-label="Work orders"
          data={state.data}
          columns={columns}
          getRowId={(workOrder) => workOrder.instanceId.externalId}
          size="compact"
          enableSorting
          defaultSorting={[{ id: 'date', desc: true }]}
          onRowClick={(row) => setOpenId((current) => (current === row.original.instanceId.externalId ? null : row.original.instanceId.externalId))}
        />
      </div>
      {openWorkOrder ? <WorkOrderDetail workOrder={openWorkOrder} onClose={() => setOpenId(null)} /> : null}
    </div>
  );
}
