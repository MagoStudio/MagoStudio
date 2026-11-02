import { ShotFolderOrShot } from "@domains/project/shotFolders/interface";

import { collectLeafShotIds } from "./collectLeafShotIds";

export const shouldDeleteProjectAfter = (
  idsBeingDeleted: Iterable<string>,
  allItems: ShotFolderOrShot[]
): boolean => {
  const totalShotCount = allItems.filter((i) => i.type === "shot").length;
  if (totalShotCount === 0) return false;
  return collectLeafShotIds(idsBeingDeleted, allItems).size === totalShotCount;
};
