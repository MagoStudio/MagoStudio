import { useIsOnboardingActive } from "@domains/onboarding/useIsOnboardingActive";
import { Project } from "@schemas/project";
import { useTranslation } from "react-i18next";

import { useUpdateProject } from "./useUpdateProject";
import { resolveAutoProjectName } from "./utils/resolveAutoProjectName";

export const useAutoNameProjectFromVideo = () => {
  const { t } = useTranslation();
  const { mutateAsync: updateProject } = useUpdateProject();
  const isOnboardingActive = useIsOnboardingActive();

  const autoNameProjectFromVideo = async (
    project: Project,
    filename: string
  ) => {
    const newName = resolveAutoProjectName({
      currentName: project.name,
      defaultName: t("titles.untitled_project.label"),
      hasExistingVideo:
        project.timelines?.some((timeline) => timeline.layers.length > 0) ??
        false,
      isOnboardingActive,
      filename
    });
    if (!newName) return;

    try {
      await updateProject({
        projectId: project.id,
        projectName: newName,
        projectDescription: project.description,
        settings: project.settings,
        settingsPatch: {}
      });
    } catch (error) {
      console.error("Failed to auto-name project from video:", error);
    }
  };

  return { autoNameProjectFromVideo };
};
