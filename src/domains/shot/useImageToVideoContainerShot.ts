import { fetchProject } from "@domains/project/fetchProject";
import { useUpdateProject } from "@domains/project/useUpdateProject";
import { Project } from "@schemas/project";
import { useToast } from "@store/useToast";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { queryKeys } from "@/queryKeys";

import { deleteTimeline } from "./deleteTimeline";
import { postTimeline } from "./postTimeline";
import { useImageToVideoContainerShotId } from "./useImageToVideoContainerShotId";

export const IMAGE_TO_VIDEO_CONTAINER_SHOT_NAME = "Image to Video";

const hasPersistableProjectShape = (
  project: Project | undefined
): project is Project =>
  project !== undefined &&
  project.name !== undefined &&
  project.settings !== undefined;

export const useImageToVideoContainerShot = (projectId: string | undefined) => {
  const { t } = useTranslation();
  const { containerShotId } = useImageToVideoContainerShotId(projectId);
  const { mutateAsync: updateProject } = useUpdateProject();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const ensureContainerShotId = async (): Promise<string | undefined> => {
    if (!projectId) return undefined;

    const freshProject = await fetchProject(projectId);
    const existingShotId = freshProject?.settings?.betaI2vShotId;
    if (existingShotId) return existingShotId;

    if (!hasPersistableProjectShape(freshProject)) {
      showToast({
        message: t("notifications.image_to_video_setup_failed.description")
      });
      return undefined;
    }

    const newShot = await postTimeline(
      projectId,
      IMAGE_TO_VIDEO_CONTAINER_SHOT_NAME
    );

    const discardUnreferencedShot = async () => {
      try {
        await deleteTimeline(newShot.id, projectId);
      } catch (error) {
        console.error("Failed to discard unreferenced shot:", error);
      }
    };

    const refreshProject = () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.project.byId(projectId)
      });

    const settledProject = await fetchProject(projectId);
    const raceWinnerShotId = settledProject?.settings?.betaI2vShotId;

    if (raceWinnerShotId) {
      await discardUnreferencedShot();
      await refreshProject();
      return raceWinnerShotId;
    }

    if (!hasPersistableProjectShape(settledProject)) {
      await discardUnreferencedShot();
      showToast({
        message: t("notifications.image_to_video_setup_failed.description")
      });
      return undefined;
    }

    try {
      await updateProject({
        projectId,
        projectName: settledProject.name,
        projectDescription: settledProject.description ?? "",
        settings: { ...settledProject.settings, betaI2vShotId: newShot.id },
        settingsPatch: { betaI2vShotId: newShot.id }
      });
    } catch (error) {
      console.error("Failed to persist container shot reference:", error);
      await discardUnreferencedShot();
      showToast({
        message: t("notifications.image_to_video_setup_failed.description")
      });
      return undefined;
    }

    const confirmedProject = await fetchProject(projectId);
    const confirmedShotId = confirmedProject?.settings?.betaI2vShotId;
    if (confirmedShotId && confirmedShotId !== newShot.id) {
      await discardUnreferencedShot();
      await refreshProject();
      return confirmedShotId;
    }

    await refreshProject();
    return newShot.id;
  };

  return { containerShotId, ensureContainerShotId };
};
