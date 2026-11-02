import { ShotFolderOrShot } from "@domains/project/shotFolders/interface";
import { collectLeafShotIds } from "@domains/project/utils/collectLeafShotIds";

export const computeLeafShotCount = (
  ids: Iterable<string>,
  allItems: ShotFolderOrShot[]
): number => collectLeafShotIds(ids, allItems).size;
