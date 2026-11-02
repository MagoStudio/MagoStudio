import { Layer } from "@schemas/layer";
import { Project } from "@schemas/project";
import { Shot } from "@schemas/shot";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { deleteTrack } from "../api/deleteTrack";
import { buildUpdatedProjectAfterTrackDelete } from "../utils/buildUpdatedProjectAfterTrackDelete";

type DeleteTrackParams = {
  trackId: Layer["id"];
  shotId?: Shot["id"];
  projectId?: Project["id"];
};

export const useDeleteTrack = () => {
  const queryClient = useQueryClient();
  const onSuccess = (_: unknown, params: DeleteTrackParams) => {
    if (!params.projectId) {
      return;
    }

    queryClient.setQueryData<Project>(
      queryKeys.project.byId(params.projectId),
      (project) =>
        buildUpdatedProjectAfterTrackDelete(
          project,
          params.shotId,
          params.trackId
        )
    );

    void queryClient.invalidateQueries({
      queryKey: queryKeys.project.byId(params.projectId)
    });
  };
  return useMutation({
    mutationFn: deleteTrack,
    onSuccess
  });
};
