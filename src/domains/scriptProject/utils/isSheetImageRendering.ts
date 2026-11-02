import { SheetImage } from "@schemas/scriptProject";

const TERMINAL_SHEET_IMAGE_STATUSES = new Set([
  "success",
  "available",
  "failed",
  "cancelled",
  "timeout",
  "error",
  "not_found"
]);

export const isSheetImageRendering = (
  image: Pick<SheetImage, "status">
): boolean => !TERMINAL_SHEET_IMAGE_STATUSES.has(image.status.toLowerCase());
