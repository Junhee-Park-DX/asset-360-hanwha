import type { AssetSummary } from './types';

export interface RecentlyViewedEntry {
  instanceId: AssetSummary['instanceId'];
  tag: string;
  name: string;
}

export interface RecentlyViewedService {
  list(): RecentlyViewedEntry[];
  record(asset: AssetSummary): void;
}

const STORAGE_KEY = 'asset-360:recently-viewed';
const MAX_ENTRIES = 10;

function sameAsset(a: RecentlyViewedEntry['instanceId'], b: RecentlyViewedEntry['instanceId']): boolean {
  return a.space === b.space && a.externalId === b.externalId;
}

export class LocalRecentlyViewedService implements RecentlyViewedService {
  constructor(private readonly storage: Storage) {}

  list(): RecentlyViewedEntry[] {
    const raw = this.storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as RecentlyViewedEntry[]) : [];
    } catch {
      return [];
    }
  }

  record(asset: AssetSummary): void {
    const entry: RecentlyViewedEntry = { instanceId: asset.instanceId, tag: asset.tag, name: asset.name };
    const withoutDuplicate = this.list().filter((existing) => !sameAsset(existing.instanceId, entry.instanceId));
    const next = [entry, ...withoutDuplicate].slice(0, MAX_ENTRIES);
    this.storage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
}
