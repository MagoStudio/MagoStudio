import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { AddProjectShotRequest, postProjectShot } from "../api/postProjectShot";

import { ScriptProjectMutationOptions } from "./scriptProjectMutationOptions";

export const useAddProjectShot = (
  options?: ScriptProjectMutationOptions<AddProjectShotRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AddProjectShotRequest) => postProjectShot(request),
    onSuccess: (_response, request) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projectState.byProjectId(request.projectId)
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projectCut.byProjectId(request.projectId)
      });
    },
    onError: options?.onError
  });
};
