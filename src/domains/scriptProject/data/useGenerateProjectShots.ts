import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import {
  GenerateProjectShotsRequest,
  postGenerateProjectShots
} from "../api/postGenerateProjectShots";

import { ScriptProjectMutationOptions } from "./scriptProjectMutationOptions";

export const useGenerateProjectShots = (
  options?: ScriptProjectMutationOptions<GenerateProjectShotsRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: GenerateProjectShotsRequest) =>
      postGenerateProjectShots(request),
    onSuccess: (_result, request) => {
      if (request.isDryRun) return;

      void queryClient.invalidateQueries({
        queryKey: queryKeys.projectState.byProjectId(request.projectId)
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projectCut.byProjectId(request.projectId)
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.bulkRendersRuns.byProjectId(request.projectId)
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.balance.all });
    },
    onError: options?.onError
  });
};
