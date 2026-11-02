import { Layer } from "@schemas/layer";
import { Project } from "@schemas/project";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { putTrack } from "../api/putTrack";
import { buildUpdatedProjectAfterTrackPut } from "../utils/buildUpdatedProjectAfterTrackPut";

export const usePutTrack = ({
  selectedProjectId,
  selectedShotId
}: {
  selectedProjectId?: string;
  selectedShotId?: string;
}) => {
  const queryClient = useQueryClient();
  const onSuccess = (data: Layer) => {
    queryClient.setQueryData<Project>(
      queryKeys.project.byId(selectedProjectId),
      (project) =>
        buildUpdatedProjectAfterTrackPut(project, selectedShotId, data)
    );
  };
  return useMutation({
    mutationFn: (params: Omit<Parameters<typeof putTrack>[0], "projectId">) =>
      putTrack({ ...params, projectId: selectedProjectId }),
    onSuccess
  });
};
