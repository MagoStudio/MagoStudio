import type { ShotFolderOrShot } from "@domains/project/shotFolders/interface";

export const buildShotBreadcrumb = (
  shotFolders: ShotFolderOrShot[],
  shotId: string | undefined
): string => {
  if (!shotId || shotFolders.length === 0) return "";

  const itemMap = new Map(shotFolders.map((item) => [item.id, item]));
  const shot = itemMap.get(shotId);
  if (!shot) return "";

  const parts: string[] = [shot.name];
  const visited = new Set<string>();
  let currentParentId = shot.parentFolderId;

  while (currentParentId) {
    if (visited.has(currentParentId)) break;
    visited.add(currentParentId);
    const parent = itemMap.get(currentParentId);
    if (!parent) break;
    parts.unshift(parent.name);
    currentParentId = parent.parentFolderId;
  }

  return parts.join(" / ");
};
