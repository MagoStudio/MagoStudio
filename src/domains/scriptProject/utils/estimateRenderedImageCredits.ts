import { ProjectState } from "@schemas/scriptProject";

import {
  DEFAULT_SHEET_RENDER_MODEL,
  SHEET_RENDER_MODELS,
  SheetRenderModel
} from "../constants";

import { estimateSheetImageCredits } from "./estimateSheetImageCredits";
import { readOutputSize } from "./readOutputSize";

const readSheetRenderModel = (value: unknown): SheetRenderModel =>
  SHEET_RENDER_MODELS.find((renderModel) => renderModel === value) ??
  DEFAULT_SHEET_RENDER_MODEL;

export const estimateRenderedImageCredits = (
  projectState: ProjectState | undefined
): number => {
  const pricedAssetIds = new Set<string>();
  let credits = 0;
  for (const sheetGroup of projectState?.keys ?? []) {
    for (const image of sheetGroup.images) {
      if (image.source !== "render" || pricedAssetIds.has(image.asset_id)) {
        continue;
      }
      const outputSize = readOutputSize(image.render_spec);
      if (!outputSize) continue;
      pricedAssetIds.add(image.asset_id);
      credits += estimateSheetImageCredits(
        readSheetRenderModel(image.render_spec?.render_model),
        outputSize
      );
    }
  }
  return credits;
};
