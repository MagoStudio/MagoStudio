import { useImageRenderModel } from "./useImageRenderModel";

export const useSheetRenderModel = (projectId: string | undefined) => {
  const model = useImageRenderModel(projectId, "sheet_render_model");
  return {
    sheetRenderModel: model.renderModel,
    isLocalProject: model.isLocalProject,
    canUseCloudSheetModels: model.canUseCloudModels && model.isLocalProject,
    isSavingSheetRenderModel: model.isSavingRenderModel,
    setSheetRenderModel: model.setRenderModel
  };
};
