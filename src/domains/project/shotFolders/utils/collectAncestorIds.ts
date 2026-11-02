import type { ShotFolderOrShot } from "@domains/project/shotFolders/interface";

export function collectAncestorIds(
  startParentId: string,
  itemById: Map<string, ShotFolderOrShot>
): Set<string> {
  const ancestorIds = new Set<string>();
  let current = startParentId;
  while (current) {
    if (ancestorIds.has(current)) break;
    ancestorIds.add(current);
    current = itemById.get(current)?.parentFolderId ?? "";
  }
  return ancestorIds;
}
