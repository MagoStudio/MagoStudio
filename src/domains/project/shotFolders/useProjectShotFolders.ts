import { getTrackAsset } from "@domains/track/utils/getTrackAsset";
import { isVideoAssetReady } from "@domains/track/utils/isVideoAssetReady";
import { LayerType } from "@schemas/layer";
import { Shot } from "@schemas/shot";

import { useProject } from "../useProject";

import { ShotFolderOrShot } from "./interface";
import { isContainerShot } from "./utils/isContainerShot";

const isShotReady = (shot: Shot): boolean => {
  const imageLayer = shot.layers?.find((l) => l.type === LayerType.IMAGE);
  return isVideoAssetReady(getTrackAsset(imageLayer));
};

export const useProjectShotFolders = (projectId: string | undefined) => {
  const { data: project, isLoading, isError, error } = useProject(projectId);
  const shotFoldersAndShots = (() => {
    const folders = project?.settings?.shotFolders || [];
    const shots = project?.timelines ?? [];

    const readyShots = shots.filter(
      (shot) => isShotReady(shot) && !isContainerShot(shot, project)
    );

    const withRealShotNames = folders
      .map((item) => {
        if (item.type === "folder") {
          return item;
        }
        const shot = readyShots.find((s) => s.id === item.id);
        if (!shot) {
          return null;
        }
        return {
          ...item,
          name: shot.name
        };
      })
      .filter(Boolean) as ShotFolderOrShot[];

    const referencedShotIds = new Set(
      folders.filter((item) => item.type === "shot").map((item) => item.id)
    );
    const missingShots: ShotFolderOrShot[] = readyShots
      .filter((shot) => !referencedShotIds.has(shot.id))
      .map((shot) => ({
        id: shot.id,
        name: shot.name,
        parentFolderId: "",
        createdAt: 0,
        type: "shot" as const
      }));

    return [...withRealShotNames, ...missingShots];
  })();
  return {
    data: {
      shotFoldersAndShots,
      project
    },
    isLoading,
    isError,
    error
  };
};
