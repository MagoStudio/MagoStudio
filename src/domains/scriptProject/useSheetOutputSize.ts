import { SheetResolution } from "./constants";
import { useProjectOutputSize } from "./useProjectOutputSize";
import { useSaveProjectSettingsPatch } from "./useSaveProjectSettingsPatch";
import {
  buildSheetOutputSize,
  resolveSheetResolution
} from "./utils/buildSheetOutputSize";

/** Image area is independent of video resolution, while the project aspect stays shared. */
export const useSheetOutputSize = (projectId: string | undefined) => {
  const { outputSize } = useProjectOutputSize(projectId);

  const { project, saveProjectSettingsPatch, isSavingProjectSettings } =
    useSaveProjectSettingsPatch(projectId);
  const sheetResolution = resolveSheetResolution(
    project?.settings.sheet_resolution
  );
  return {
    sheetOutputSize: buildSheetOutputSize(outputSize, sheetResolution),
    sheetResolution,
    setSheetResolution: (resolution: SheetResolution) =>
      saveProjectSettingsPatch({ sheet_resolution: resolution }),
    isSavingSheetResolution: isSavingProjectSettings
  };
};
