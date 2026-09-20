import { describe, expect, it } from 'vitest';

import type { AssetHierarchyNode } from './AssetHierarchyService';
import { buildAssetTree } from './assetTree';

function node(externalId: string, name: string, parentExternalId: string | null): AssetHierarchyNode {
  return { space: 'sp_assets', externalId, name, parentExternalId };
}

describe(buildAssetTree.name, () => {
  it('nests children under their parent and counts descendants', () => {
    const nodes = [
      node('VAL', 'Valhall', null),
      node('23', 'Compression', 'VAL'),
      node('23-KA-9101', 'Compressor', '23'),
      node('23-KA-9101-M01', 'Motor', '23-KA-9101'),
    ];

    const tree = buildAssetTree(nodes);

    expect(tree).toHaveLength(1);
    expect(tree[0]).toMatchObject({ externalId: 'VAL', descendantCount: 3 });
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0]).toMatchObject({ externalId: '23', descendantCount: 2 });
    expect(tree[0].children[0].children[0]).toMatchObject({ externalId: '23-KA-9101', descendantCount: 1 });
  });

  it('supports multiple top-level roots', () => {
    const nodes = [node('VAL', 'Valhall', null), node('OTHER', 'Other plant', null)];

    const tree = buildAssetTree(nodes);

    expect(tree.map((root) => root.externalId).sort()).toEqual(['OTHER', 'VAL']);
  });

  it('treats a node whose parent is outside the fetched set as a root, rather than dropping it', () => {
    const nodes = [node('ORPHAN', 'Orphan', 'MISSING-PARENT')];

    const tree = buildAssetTree(nodes);

    expect(tree).toHaveLength(1);
    expect(tree[0].externalId).toBe('ORPHAN');
  });

  it('returns an empty tree for no nodes', () => {
    expect(buildAssetTree([])).toEqual([]);
  });

  it('gives a leaf node zero descendants and no children', () => {
    const tree = buildAssetTree([node('LEAF', 'Leaf', null)]);

    expect(tree[0]).toMatchObject({ descendantCount: 0, children: [] });
  });
});
