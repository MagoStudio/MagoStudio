import { getAllDescendantIds } from "@domains/project/utils/getAllDescendantIds";

interface TreeNode {
  id: string;
  parentFolderId: string | null;
  type: string;
}

export const isDropAllowed = (
  movedIds: string[],
  targetFolderId: string,
  allItems: TreeNode[]
): boolean => {
  if (movedIds.length === 0) return false;

  if (targetFolderId !== "" && movedIds.includes(targetFolderId)) return false;

  for (const id of movedIds) {
    const item = allItems.find((i) => i.id === id);
    if (!item) return false;
    if (item.type === "folder") {
      const descendantIds = getAllDescendantIds(id, allItems);
      if (descendantIds.includes(targetFolderId)) return false;
    }
  }

  const everyAlreadyChild = movedIds.every((id) => {
    const item = allItems.find((i) => i.id === id);
    if (!item) return false;
    return (item.parentFolderId ?? "") === targetFolderId;
  });
  if (everyAlreadyChild) return false;

  return true;
};
