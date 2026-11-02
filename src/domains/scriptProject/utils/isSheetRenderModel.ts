import { SHEET_RENDER_MODELS, SheetRenderModel } from "../constants";

export const isSheetRenderModel = (value: unknown): value is SheetRenderModel =>
  typeof value === "string" &&
  SHEET_RENDER_MODELS.includes(value as SheetRenderModel);
