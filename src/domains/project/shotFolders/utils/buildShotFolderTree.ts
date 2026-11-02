import type { ShotFolderOrShot } from "@domains/project/shotFolders/interface";

export type ShotFolderTreeNode = ShotFolderOrShot & {
  children: ShotFolderTreeNode[];
};

const MAX_TREE_DEPTH = 32;

function resolveEffectiveParentId(
  item: ShotFolderOrShot,
  nodeById: Map<string, ShotFolderTreeNode>
): string {
  if (!item.parentFolderId || item.parentFolderId === item.id) return "";

  const parentNode = nodeById.get(item.parentFolderId);
  if (!parentNode || parentNode.type === "shot") return "";

  const visitedAncestorIds = new Set<string>([item.id]);
  let currentId: string | undefined = parentNode.id;
  let ancestorDepth = 0;

  while (currentId) {
    if (visitedAncestorIds.has(currentId)) return "";
    ancestorDepth += 1;
    if (ancestorDepth >= MAX_TREE_DEPTH) return "";
    visitedAncestorIds.add(currentId);

    const currentNode = nodeById.get(currentId);
    if (!currentNode) break;
    currentId = currentNode.parentFolderId || undefined;
  }

  return item.parentFolderId;
}

export function buildShotFolderTree(
  items: ShotFolderOrShot[]
): ShotFolderTreeNode[] {
  const nodeById = new Map<string, ShotFolderTreeNode>(
    items.map((item) => [item.id, { ...item, children: [] }])
  );

  const rootShotNodes: ShotFolderTreeNode[] = [];
  const rootFolderNodes: ShotFolderTreeNode[] = [];

  for (const node of nodeById.values()) {
    const effectiveParentId = resolveEffectiveParentId(node, nodeById);
    const parentNode = effectiveParentId
      ? nodeById.get(effectiveParentId)
      : undefined;

    if (parentNode) {
      parentNode.children.push(node);
      continue;
    }

    if (node.type === "shot") {
      rootShotNodes.push(node);
    } else {
      rootFolderNodes.push(node);
    }
  }

  for (const node of nodeById.values()) {
    node.children.sort((a, b) => {
      if (a.type === b.type) return 0;
      return a.type === "shot" ? -1 : 1;
    });
  }

  return [...rootShotNodes, ...rootFolderNodes];
}
