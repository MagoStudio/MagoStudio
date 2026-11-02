import {
  AnySheetRenderModel,
  DEFAULT_SHEET_RENDER_MODEL,
  LOCAL_SHEET_RENDER_MODEL,
  isLocalSheetRenderModel
} from "../constants";

import { isSheetRenderModel } from "./isSheetRenderModel";

export const resolveImageRenderModel = ({
  savedModel,
  isLocalProject,
  isCloudAvailable,
  installedLocalModels
}: {
  savedModel: unknown;
  isLocalProject: boolean;
  isCloudAvailable: boolean;
  installedLocalModels: readonly AnySheetRenderModel[];
}): AnySheetRenderModel => {
  if (isSheetRenderModel(savedModel) && (!isLocalProject || isCloudAvailable))
    return savedModel;
  if (isLocalProject && isLocalSheetRenderModel(savedModel)) return savedModel;
  if (!isLocalProject || isCloudAvailable) return DEFAULT_SHEET_RENDER_MODEL;
  return (
    installedLocalModels.find((model) => model === LOCAL_SHEET_RENDER_MODEL) ??
    installedLocalModels[0] ??
    LOCAL_SHEET_RENDER_MODEL
  );
};
