import { ShotFolderOrShot } from "@domains/project/shotFolders/interface";
import { collectLeafShotIds } from "@domains/project/utils/collectLeafShotIds";

export const collectShotIdsToDelete = (
  ids: Iterable<string>,
  allItems: ShotFolderOrShot[]
): Set<string> => collectLeafShotIds(ids, allItems);
