import { MirrorProgress } from "@domains/cloud/mirrorService";
import { Layer } from "@schemas/layer";
import { Project } from "@schemas/project";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { postRender, PostRenderParams } from "../api/postRender";
import { buildUpdatedProjectAfterRender } from "../utils/buildUpdatedProjectAfterRender";

export const usePostRender = ({
  selectedProjectId,
  selectedShotId,
  onProgress
}: {
  selectedProjectId?: string;
  selectedShotId?: string;
  onProgress?: MirrorProgress;
}) => {
  const queryClient = useQueryClient();
  const onSuccess = (updatedLayer: Layer) => {
    queryClient.setQueryData<Project>(
      queryKeys.project.byId(selectedProjectId),
      (project) =>
        buildUpdatedProjectAfterRender(project, selectedShotId, updatedLayer)
    );
  };
  return useMutation({
    mutationFn: (params: PostRenderParams) => postRender(params, onProgress),
    onSuccess
  });
};
