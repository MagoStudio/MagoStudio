import { SheetGroup } from "@schemas/scriptProject";

import { STORYBOARD_SHEET_TOKEN_PREFIX } from "./buildStoryboardSheetToken";

export const isStoryboardSheetGroup = (
  sheetGroup: Pick<SheetGroup, "token">
): boolean => sheetGroup.token.startsWith(STORYBOARD_SHEET_TOKEN_PREFIX);
