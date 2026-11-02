interface TreeNode {
  id: string;
  parentFolderId: string | null;
}

export const pruneDescendantsFromSelection = (
  selectedIds: Iterable<string>,
  allItems: TreeNode[]
): string[] => {
  const selectedSet = new Set(selectedIds);
  const itemById = new Map(allItems.map((item) => [item.id, item]));

  return Array.from(selectedSet).filter((id) => {
    const item = itemById.get(id);
    if (!item) return false;
    if (selectedSet.size === 1) return true;
    const visited = new Set<string>();
    let current = item.parentFolderId ?? "";
    while (current && !visited.has(current)) {
      visited.add(current);
      if (selectedSet.has(current)) return false;
      current = itemById.get(current)?.parentFolderId ?? "";
    }
    return true;
  });
};
