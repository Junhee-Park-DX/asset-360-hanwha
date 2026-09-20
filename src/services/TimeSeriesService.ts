import type { CogniteClient, NodeOrEdge } from '@cognite/sdk';

import { COGNITE_TIME_SERIES_VIEW, propertyPath } from './cdmViews';
import { instanceKey } from './instanceKey';
import { readString, readViewProperties } from './propertyReader';
import type { Datapoint, InstanceRef, TimeSeriesSummary } from './types';

export interface TimeRange {
  start: number;
  end: number;
}

export interface TimeSeriesService {
  listForAsset(assetId: InstanceRef): Promise<TimeSeriesSummary[]>;
  retrieveDatapoints(seriesIds: InstanceRef[], range: TimeRange): Promise<Record<string, Datapoint[]>>;
  /** Latest datapoint timestamp across the given series, or null if none has any data (FR-005/FR-006a). */
  retrieveLatestTimestamp(seriesIds: InstanceRef[]): Promise<number | null>;
}

const LIST_LIMIT = 100;
const DATAPOINTS_LIMIT_PER_SERIES = 10000;

function toTimeSeriesSummary(node: NodeOrEdge): TimeSeriesSummary {
  const properties = readViewProperties(node, COGNITE_TIME_SERIES_VIEW);
  return {
    instanceId: { space: node.space, externalId: node.externalId },
    name: readString(properties, 'name', node.externalId),
    description: readString(properties, 'description'),
    unit: readString(properties, 'sourceUnit'),
  };
}

export class CogniteTimeSeriesService implements TimeSeriesService {
  constructor(private readonly client: CogniteClient) {}

  async listForAsset(assetId: InstanceRef): Promise<TimeSeriesSummary[]> {
    const response = await this.client.instances.search({
      view: COGNITE_TIME_SERIES_VIEW,
      instanceType: 'node',
      limit: LIST_LIMIT,
      filter: {
        containsAny: {
          property: propertyPath(COGNITE_TIME_SERIES_VIEW, 'assets'),
          values: [{ space: assetId.space, externalId: assetId.externalId }],
        },
      },
    });
    return response.items.map(toTimeSeriesSummary);
  }

  async retrieveDatapoints(seriesIds: InstanceRef[], range: TimeRange): Promise<Record<string, Datapoint[]>> {
    if (seriesIds.length === 0) return {};
    const response = await this.client.datapoints.retrieve({
      items: seriesIds.map((instanceId) => ({
        instanceId: { space: instanceId.space, externalId: instanceId.externalId },
        limit: DATAPOINTS_LIMIT_PER_SERIES,
      })),
      start: range.start,
      end: range.end,
    });

    const result: Record<string, Datapoint[]> = {};
    for (const series of response) {
      if (!series.instanceId) continue;
      const points: Datapoint[] = [];
      for (const point of series.datapoints) {
        if ('value' in point && typeof point.value === 'number') {
          points.push({ timestamp: point.timestamp.getTime(), value: point.value });
        }
      }
      result[instanceKey(series.instanceId)] = points;
    }
    return result;
  }

  async retrieveLatestTimestamp(seriesIds: InstanceRef[]): Promise<number | null> {
    if (seriesIds.length === 0) return null;
    const response = await this.client.datapoints.retrieveLatest(
      seriesIds.map((instanceId) => ({ instanceId: { space: instanceId.space, externalId: instanceId.externalId } }))
    );
    let latest: number | null = null;
    for (const series of response) {
      const [point] = series.datapoints;
      if (point && (latest === null || point.timestamp.getTime() > latest)) {
        latest = point.timestamp.getTime();
      }
    }
    return latest;
  }
}
