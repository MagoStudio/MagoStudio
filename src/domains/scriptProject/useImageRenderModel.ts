import { isCloudRenderAvailable } from "@/platform/renderTarget";

import { AnySheetRenderModel } from "./constants";
import { useLocalImageModelAvailability } from "./data/useLocalImageModelAvailability";
import { useSaveProjectSettingsPatch } from "./useSaveProjectSettingsPatch";
import { resolveImageRenderModel } from "./utils/resolveImageRenderModel";

export const useImageRenderModel = (
  projectId: string | undefined,
  setting: "sheet_render_model" | "storyboard_render_model"
) => {
  const { project, saveProjectSettingsPatch, isSavingProjectSettings } =
    useSaveProjectSettingsPatch(projectId);
  const isLocalProject = project?.origin === "local";
  const installedLocalModels = useLocalImageModelAvailability(isLocalProject);
  const canUseCloudModels = isCloudRenderAvailable();
  return {
    renderModel: resolveImageRenderModel({
      savedModel: project?.settings?.[setting],
      isLocalProject,
      isCloudAvailable: canUseCloudModels,
      installedLocalModels
    }),
    isLocalProject,
    installedLocalModels,
    canUseCloudModels,
    isSavingRenderModel: isSavingProjectSettings,
    setRenderModel: (model: AnySheetRenderModel) =>
      saveProjectSettingsPatch({ [setting]: model })
  };
};
