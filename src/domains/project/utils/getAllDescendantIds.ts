export const getAllDescendantIds = (
  parentId: string,
  allItems: { id: string; parentFolderId: string | null; type: string }[]
): string[] => {
  const directChildren = allItems.filter(
    (item) => item.parentFolderId === parentId
  );
  const ids: string[] = [];
  for (const child of directChildren) {
    ids.push(child.id);
    if (child.type === "folder") {
      ids.push(...getAllDescendantIds(child.id, allItems));
    }
  }
  return ids;
};
