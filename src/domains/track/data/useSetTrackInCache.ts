import { Layer } from "@schemas/layer";
import { Project } from "@schemas/project";
import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

export const useSetTrackInCache = () => {
  const queryClient = useQueryClient();
  const setTrackInCache = ({
    modifiedTrack,
    selectedProjectId,
    selectedShotId
  }: {
    modifiedTrack: Layer;
    selectedProjectId?: string;
    selectedShotId?: string;
  }) => {
    if (!selectedProjectId) {
      return;
    }

    if (!selectedShotId) {
      return;
    }

    return queryClient.setQueryData(
      queryKeys.project.byId(selectedProjectId),
      (oldProject: Project) => {
        if (!oldProject) {
          return oldProject;
        }

        return {
          ...oldProject,
          timelines: oldProject.timelines?.map((shot) => {
            if (shot.id !== selectedShotId) {
              return shot;
            }
            return {
              ...shot,
              layers: shot.layers.map((track) => {
                if (track.id === modifiedTrack.id) {
                  return {
                    ...track,
                    ...modifiedTrack
                  };
                }
                return track;
              })
            };
          })
        };
      }
    );
  };
  return {
    setTrackInCache
  };
};
