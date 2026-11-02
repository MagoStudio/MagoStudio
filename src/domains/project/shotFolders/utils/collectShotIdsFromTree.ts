import type { ShotFolderTreeNode } from "@domains/project/shotFolders/utils/buildShotFolderTree";

export function collectShotIdsFromTree(tree: ShotFolderTreeNode[]): string[] {
  const shotIds = new Set<string>();
  const nodesToVisit: ShotFolderTreeNode[] = [...tree];

  while (nodesToVisit.length > 0) {
    const node = nodesToVisit.pop();
    if (!node) continue;

    if (node.type === "shot") {
      shotIds.add(node.id);
    }

    if (node.children.length > 0) {
      nodesToVisit.push(...node.children);
    }
  }

  return [...shotIds];
}
