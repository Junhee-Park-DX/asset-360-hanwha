import type { InstanceRef } from './types';

export function instanceKey(id: InstanceRef): string {
  return `${id.space}:${id.externalId}`;
}
