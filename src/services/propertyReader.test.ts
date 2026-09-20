import { describe, expect, it } from 'vitest';

import { readDirectRelationList, readDirectRelationRef } from './propertyReader';

describe(readDirectRelationList.name, () => {
  it('returns the externalId of each item in a direct-relation list, in order', () => {
    const properties = { path: [{ externalId: 'VAL' }, { externalId: '23' }, { externalId: '23-KA-9101' }] };

    expect(readDirectRelationList(properties, 'path')).toEqual(['VAL', '23', '23-KA-9101']);
  });

  it('returns an empty array when the property is a single relation, not a list', () => {
    expect(readDirectRelationList({ parent: { externalId: 'VAL' } }, 'parent')).toEqual([]);
  });

  it('returns an empty array when the property is missing', () => {
    expect(readDirectRelationList({}, 'path')).toEqual([]);
  });

  it('skips list entries with no externalId', () => {
    const properties = { path: [{ externalId: 'VAL' }, {}, { externalId: '23' }] };

    expect(readDirectRelationList(properties, 'path')).toEqual(['VAL', '23']);
  });
});

describe(readDirectRelationRef.name, () => {
  it('returns the full space/externalId reference for a populated direct relation', () => {
    const properties = { object3D: { space: 'valhall-three_d', externalId: 'obj-1' } };

    expect(readDirectRelationRef(properties, 'object3D')).toEqual({ space: 'valhall-three_d', externalId: 'obj-1' });
  });

  it('returns null when the property is missing', () => {
    expect(readDirectRelationRef({}, 'object3D')).toBeNull();
  });

  it('returns null when the relation is malformed (missing space or externalId)', () => {
    expect(readDirectRelationRef({ object3D: { externalId: 'obj-1' } }, 'object3D')).toBeNull();
  });
});
