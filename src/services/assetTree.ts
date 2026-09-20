import type { AssetHierarchyNode } from './AssetHierarchyService';

export interface AssetTreeNode {
  space: string;
  externalId: string;
  name: string;
  children: AssetTreeNode[];
  descendantCount: number;
}

/**
 * Builds a parent/child tree from a flat list of asset nodes. A node whose
 * `parentExternalId` wasn't itself fetched (possible at the edge of
 * AssetHierarchyService's 1000-item cap) is treated as a root rather than
 * silently dropped, so every fetched asset is reachable somewhere in the tree.
 */
export function buildAssetTree(nodes: AssetHierarchyNode[]): AssetTreeNode[] {
  const childrenByParent = new Map<string, AssetHierarchyNode[]>();
  for (const node of nodes) {
    if (node.parentExternalId === null) continue;
    const siblings = childrenByParent.get(node.parentExternalId) ?? [];
    siblings.push(node);
    childrenByParent.set(node.parentExternalId, siblings);
  }

  const knownIds = new Set(nodes.map((node) => node.externalId));

  function build(node: AssetHierarchyNode): AssetTreeNode {
    const children = (childrenByParent.get(node.externalId) ?? []).map(build);
    const descendantCount = children.reduce((sum, child) => sum + 1 + child.descendantCount, 0);
    return { space: node.space, externalId: node.externalId, name: node.name, children, descendantCount };
  }

  const roots = nodes.filter((node) => node.parentExternalId === null || !knownIds.has(node.parentExternalId));
  return roots.map(build);
}
