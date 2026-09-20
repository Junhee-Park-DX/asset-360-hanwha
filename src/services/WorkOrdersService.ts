import type { CogniteClient, NodeOrEdge } from '@cognite/sdk';

import { COGNITE_ACTIVITY_VIEW, propertyPath } from './cdmViews';
import { readString, readTimestamp, readViewProperties } from './propertyReader';
import type { InstanceRef, WorkOrderSummary } from './types';

export interface WorkOrdersService {
  listForAsset(assetId: InstanceRef): Promise<WorkOrderSummary[]>;
  retrieve(instanceId: InstanceRef): Promise<WorkOrderSummary | null>;
}

const LIST_LIMIT = 100;

function toWorkOrderSummary(node: NodeOrEdge): WorkOrderSummary {
  const properties = readViewProperties(node, COGNITE_ACTIVITY_VIEW);
  return {
    instanceId: { space: node.space, externalId: node.externalId },
    title: readString(properties, 'name', node.externalId),
    description: readString(properties, 'description'),
    status: readString(properties, 'status', 'unknown'),
    endTime: readTimestamp(properties, 'endTime'),
    scheduledEndTime: readTimestamp(properties, 'scheduledEndTime'),
  };
}

function recencyRank(workOrder: WorkOrderSummary): number {
  return workOrder.endTime ?? workOrder.scheduledEndTime ?? 0;
}

export class CogniteWorkOrdersService implements WorkOrdersService {
  constructor(private readonly client: CogniteClient) {}

  async listForAsset(assetId: InstanceRef): Promise<WorkOrderSummary[]> {
    const response = await this.client.instances.search({
      view: COGNITE_ACTIVITY_VIEW,
      instanceType: 'node',
      limit: LIST_LIMIT,
      filter: {
        containsAny: {
          property: propertyPath(COGNITE_ACTIVITY_VIEW, 'assets'),
          values: [{ space: assetId.space, externalId: assetId.externalId }],
        },
      },
    });
    return response.items.map(toWorkOrderSummary).sort((a, b) => recencyRank(b) - recencyRank(a));
  }

  async retrieve(instanceId: InstanceRef): Promise<WorkOrderSummary | null> {
    const response = await this.client.instances.retrieve({
      sources: [{ source: COGNITE_ACTIVITY_VIEW }],
      items: [{ instanceType: 'node', externalId: instanceId.externalId, space: instanceId.space }],
    });
    const [node] = response.items;
    return node ? toWorkOrderSummary(node) : null;
  }
}
