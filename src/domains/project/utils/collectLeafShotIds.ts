import { ShotFolderOrShot } from "@domains/project/shotFolders/interface";

import { getAllDescendantIds } from "./getAllDescendantIds";

export const collectLeafShotIds = (
  ids: Iterable<string>,
  allItems: ShotFolderOrShot[]
): Set<string> => {
  const itemById = new Map(allItems.map((item) => [item.id, item]));
  const result = new Set<string>();
  for (const id of ids) {
    const item = itemById.get(id);
    if (!item) continue;
    if (item.type === "shot") {
      result.add(id);
      continue;
    }
    for (const descendantId of getAllDescendantIds(id, allItems)) {
      const descendant = itemById.get(descendantId);
      if (descendant?.type === "shot") result.add(descendantId);
    }
  }
  return result;
};
