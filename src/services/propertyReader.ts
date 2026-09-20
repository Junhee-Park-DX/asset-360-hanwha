import type { NodeOrEdge, ViewReference } from '@cognite/sdk';

export function readViewProperties(node: NodeOrEdge, viewRef: ViewReference): Record<string, unknown> {
  const bySpace = node.properties?.[viewRef.space];
  if (!bySpace || typeof bySpace !== 'object') return {};
  const byView = (bySpace as Record<string, unknown>)[`${viewRef.externalId}/${viewRef.version}`];
  return (byView as Record<string, unknown> | undefined) ?? {};
}

export function readString(properties: Record<string, unknown>, key: string, fallback = ''): string {
  const value = properties[key];
  return typeof value === 'string' ? value : fallback;
}

export function readTimestamp(properties: Record<string, unknown>, key: string): number | null {
  const value = properties[key];
  if (typeof value !== 'string') return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

interface DirectRelationRef {
  externalId?: string;
  space?: string;
}

export function readDirectRelationPath(properties: Record<string, unknown>, key: string): string {
  const value = properties[key];
  if (Array.isArray(value)) {
    return value
      .map((item) => (item as DirectRelationRef)?.externalId)
      .filter((externalId): externalId is string => typeof externalId === 'string')
      .join(' / ');
  }
  const ref = value as DirectRelationRef | undefined;
  return typeof ref?.externalId === 'string' ? ref.externalId : '';
}

/** Like `readDirectRelationPath`, but returns the raw list of externalIds instead of a joined string. */
export function readDirectRelationList(properties: Record<string, unknown>, key: string): string[] {
  const value = properties[key];
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (item as DirectRelationRef)?.externalId)
    .filter((externalId): externalId is string => typeof externalId === 'string');
}

/** Reads a single direct relation as a full `{ space, externalId }` reference, or `null` if empty/malformed. */
export function readDirectRelationRef(
  properties: Record<string, unknown>,
  key: string
): { space: string; externalId: string } | null {
  const ref = properties[key] as DirectRelationRef | undefined;
  if (typeof ref?.space === 'string' && typeof ref?.externalId === 'string') {
    return { space: ref.space, externalId: ref.externalId };
  }
  return null;
}
