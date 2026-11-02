import { SheetGroup } from "@schemas/scriptProject";

import { findNewestSuccessfulSheetImage } from "./findNewestSuccessfulSheetImage";

export const isNewerSheetVersionAvailableThanPinned = (
  group: SheetGroup
): boolean => {
  if (!group.selected_asset_id) return false;

  const newestSuccessfulImage = findNewestSuccessfulSheetImage(group);
  if (!newestSuccessfulImage) return false;

  return newestSuccessfulImage.asset_id !== group.selected_asset_id;
};
