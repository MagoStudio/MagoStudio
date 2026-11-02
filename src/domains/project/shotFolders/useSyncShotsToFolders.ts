/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import { useUnnavigableShotIds } from "@domains/shot/useUnnavigableShotIds";
import dayjs from "dayjs";
import { useEffect, useRef } from "react";

import { useProject } from "../useProject";
import { useUpdateProject } from "../useUpdateProject";

import { ShotFolderOrShot } from "./interface";

export const useSyncShotsToFolders = (projectId: string | undefined) => {
  const {
    data: project,
    isLoading: isProjectLoading,
    isError: isProjectError
  } = useProject(projectId);
  const { unnavigableShotIds } = useUnnavigableShotIds(projectId);
  const {
    mutateAsync: updateProject,
    isPending: isUpdating,
    isError: isUpdateError
  } = useUpdateProject();
  const syncedProjectIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (
      !project ||
      isProjectLoading ||
      isProjectError ||
      isUpdating ||
      isUpdateError
    ) {
      return;
    }

    if (syncedProjectIdRef.current === project.id) {
      return;
    }

    const syncFolders = async () => {
      try {
        const shotFolders = project.settings.shotFolders ?? [];
        const shots = (project.timelines ?? []).filter(
          (shot) => !unnavigableShotIds.includes(shot.id)
        );

        const shotItemIdSet = new Set(
          shotFolders
            .filter((item: ShotFolderOrShot) => item.type === "shot")
            .map((item: ShotFolderOrShot) => item.id)
        );

        const shotIdSet = new Set(shots.map((shot) => shot.id));

        const shotsToAdd = shots.filter((shot) => !shotItemIdSet.has(shot.id));

        const itemsToRemove = shotFolders.filter(
          (item: ShotFolderOrShot) =>
            item.type === "shot" && !shotIdSet.has(item.id)
        );

        syncedProjectIdRef.current = project.id;

        if (shotsToAdd.length === 0 && itemsToRemove.length === 0) {
          return;
        }

        const removeIds = new Set(itemsToRemove.map((item) => item.id));

        const updatedFolders: ShotFolderOrShot[] = [
          ...shotFolders.filter(
            (item: ShotFolderOrShot) => !removeIds.has(item.id)
          ),
          ...shotsToAdd.map(
            (shot) =>
              ({
                id: shot.id,
                name: shot.name,
                parentFolderId: "",
                createdAt: dayjs().unix(),
                type: "shot"
              }) as ShotFolderOrShot
          )
        ];

        await updateProject({
          projectId: project.id,
          projectName: project.name,
          projectDescription: project.description,
          settings: {
            ...project.settings,
            shotFolders: updatedFolders
          },
          settingsPatch: { shotFolders: updatedFolders },
          settingsMergeBase: { shotFolders }
        });
      } catch (error) {
        console.error("Failed to sync shots to folders:", error);
      }
    };
    void syncFolders();
  }, [
    project,
    unnavigableShotIds,
    isProjectLoading,
    isProjectError,
    isUpdating,
    isUpdateError,
    updateProject
  ]);
};
