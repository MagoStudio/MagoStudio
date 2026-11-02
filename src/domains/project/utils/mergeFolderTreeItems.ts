export type FolderTreeItem = {
  id: string;
  parentFolderId: string | null;
  type: string;
};

const ROOT_FOLDER_ID = "";

const applyLocalFieldChanges = <T extends FolderTreeItem>({
  baseItem,
  mineItem,
  theirsItem
}: {
  baseItem: T;
  mineItem: T;
  theirsItem: T;
}): T => ({
  ...theirsItem,
  ...Object.fromEntries(
    Object.entries(mineItem).filter(
      ([field, value]) => !Object.is(value, baseItem[field as keyof T])
    )
  )
});

const isItemInsideOwnSubtree = (
  itemId: string,
  parentFolderIdById: Map<string, string | null>
): boolean => {
  const visitedFolderIds = new Set<string>();
  let ancestorId = parentFolderIdById.get(itemId);
  while (ancestorId) {
    if (ancestorId === itemId) return true;
    if (visitedFolderIds.has(ancestorId)) return false;
    visitedFolderIds.add(ancestorId);
    ancestorId = parentFolderIdById.get(ancestorId);
  }
  return false;
};

const collectFolderIds = (items: FolderTreeItem[]): Set<string> =>
  new Set(
    items.filter((item) => item.type === "folder").map((item) => item.id)
  );

export const mergeFolderTreeItems = <T extends FolderTreeItem>({
  base,
  mine,
  theirs
}: {
  base: T[];
  mine: T[];
  theirs: T[];
}): T[] => {
  const baseItemById = new Map(base.map((item) => [item.id, item]));
  const mineItemById = new Map(mine.map((item) => [item.id, item]));
  const mergedItemIds = new Set<string>();

  const keptTheirsItems = theirs.flatMap((theirsItem): T[] => {
    if (mergedItemIds.has(theirsItem.id)) return [];
    mergedItemIds.add(theirsItem.id);
    const baseItem = baseItemById.get(theirsItem.id);
    const mineItem = mineItemById.get(theirsItem.id);
    if (!baseItem) return [theirsItem];
    if (!mineItem) return [];
    return [applyLocalFieldChanges({ baseItem, mineItem, theirsItem })];
  });
  const itemsAddedInMine = mine.filter((item) => {
    if (baseItemById.has(item.id) || mergedItemIds.has(item.id)) return false;
    mergedItemIds.add(item.id);
    return true;
  });
  const mergedItems = [...keptTheirsItems, ...itemsAddedInMine];

  const everKnownFolderIds = collectFolderIds([...base, ...mine, ...theirs]);
  const mergedFolderIds = collectFolderIds(mergedItems);
  const parentFolderIdById = new Map(
    mergedItems.map((item) => [item.id, item.parentFolderId])
  );

  return mergedItems.map((item) => {
    const parentFolderId = item.parentFolderId;
    const isParentFolderRemovedByMerge =
      !!parentFolderId &&
      everKnownFolderIds.has(parentFolderId) &&
      !mergedFolderIds.has(parentFolderId);
    const isParentChosenByMine =
      mineItemById.get(item.id)?.parentFolderId === parentFolderId &&
      baseItemById.get(item.id)?.parentFolderId !== parentFolderId;
    const isInCycleCreatedByMine =
      isParentChosenByMine &&
      isItemInsideOwnSubtree(item.id, parentFolderIdById);
    if (!isParentFolderRemovedByMerge && !isInCycleCreatedByMine) return item;
    parentFolderIdById.set(item.id, ROOT_FOLDER_ID);
    return { ...item, parentFolderId: ROOT_FOLDER_ID };
  });
};
