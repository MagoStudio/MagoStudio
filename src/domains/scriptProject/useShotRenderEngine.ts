import { ShotRenderEngine } from "./constants";
import { useSaveProjectSettingsPatch } from "./useSaveProjectSettingsPatch";
import { resolveShotRenderEngine } from "./utils/resolveShotRenderEngine";

export const useShotRenderEngine = (projectId: string | undefined) => {
  const { project, saveProjectSettingsPatch, isSavingProjectSettings } =
    useSaveProjectSettingsPatch(projectId);

  const storedShotRenderEngine = project?.settings.shot_engine;
  const shotEngine = resolveShotRenderEngine(
    storedShotRenderEngine,
    project?.origin
  );

  return {
    shotEngine,
    isSavingShotRenderEngine: isSavingProjectSettings,
    setShotRenderEngine: (nextShotEngine: ShotRenderEngine): void =>
      saveProjectSettingsPatch({ shot_engine: nextShotEngine })
  };
};
