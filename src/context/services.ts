import type { CogniteClient } from '@cognite/sdk';
import { createContext, useContext } from 'react';

import { CogniteAssetHierarchyService, type AssetHierarchyService } from '../services/AssetHierarchyService';
import { CogniteAssetService, type AssetService } from '../services/AssetService';
import { CogniteDocumentsService, type DocumentsService } from '../services/DocumentsService';
import { LocalRecentlyViewedService, type RecentlyViewedService } from '../services/RecentlyViewedService';
import { CogniteThreeDService, type ThreeDService } from '../services/ThreeDService';
import { CogniteTimeSeriesService, type TimeSeriesService } from '../services/TimeSeriesService';
import { CogniteWorkOrdersService, type WorkOrdersService } from '../services/WorkOrdersService';

export interface Services {
  assetService: AssetService;
  timeSeriesService: TimeSeriesService;
  workOrdersService: WorkOrdersService;
  documentsService: DocumentsService;
  recentlyViewedService: RecentlyViewedService;
  assetHierarchyService: AssetHierarchyService;
  threeDService: ThreeDService;
}

export function buildServices(client: CogniteClient, storage: Storage): Services {
  return {
    assetService: new CogniteAssetService(client),
    timeSeriesService: new CogniteTimeSeriesService(client),
    workOrdersService: new CogniteWorkOrdersService(client),
    documentsService: new CogniteDocumentsService(client),
    recentlyViewedService: new LocalRecentlyViewedService(storage),
    assetHierarchyService: new CogniteAssetHierarchyService(client),
    threeDService: new CogniteThreeDService(client),
  };
}

export const ServicesReactContext = createContext<Services | null>(null);

export function useServices(): Services {
  const services = useContext(ServicesReactContext);
  if (!services) throw new Error('useServices must be used within a ServicesProvider');
  return services;
}
