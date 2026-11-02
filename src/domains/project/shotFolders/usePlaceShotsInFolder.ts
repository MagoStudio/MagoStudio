import { Project } from "@schemas/project";
import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { ShotFolderOrShot } from "./interface";
import { useProjectShotFolders } from "./useProjectShotFolders";
import { useUpdateProjectShotFolders } from "./useUpdateProjectShotFolders";
import { assignShotsToFolder } from "./utils/assignShotsToFolder";

export const usePlaceShotsInFolder = (projectId: string | undefined) => {
  const queryClient = useQueryClient();
  const { data } = useProjectShotFolders(projectId);
  const { mutateAsync: updateShotFolders } =
    useUpdateProjectShotFolders(projectId);

  const placeShotsInFolder = async ({
    shotIds,
    targetFolderId
  }: {
    shotIds: string[];
    targetFolderId: string;
  }) => {
    if (!shotIds.length) return;

    const project =
      queryClient.getQueryData<Project>(queryKeys.project.byId(projectId)) ??
      data?.project;
    const shots = shotIds.flatMap((shotId) => {
      const shot = project?.timelines?.find(
        (timeline) => timeline.id === shotId
      );
      return shot ? [{ id: shotId, name: shot.name }] : [];
    });
    if (!shots.length) return;

    const currentItems =
      (project?.settings?.shotFolders as ShotFolderOrShot[] | undefined) ?? [];

    await updateShotFolders(
      assignShotsToFolder({ items: currentItems, shots, targetFolderId })
    );
  };

  return { placeShotsInFolder };
};
