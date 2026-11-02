import { SheetGroup } from "@schemas/scriptProject";

import { isSheetImageRendering } from "./isSheetImageRendering";

export const isSheetGroupRendering = (
  group: SheetGroup,
  renderingSheetTokens: Set<string>
): boolean =>
  renderingSheetTokens.has(group.token) ||
  group.images.some(isSheetImageRendering);
