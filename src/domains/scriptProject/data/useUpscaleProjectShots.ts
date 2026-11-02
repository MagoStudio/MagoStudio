import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import {
  UpscaleProjectShotsRequest,
  postUpscaleProjectShots
} from "../api/postUpscaleProjectShots";

import { ScriptProjectMutationOptions } from "./scriptProjectMutationOptions";

export const useUpscaleProjectShots = (
  options?: ScriptProjectMutationOptions<UpscaleProjectShotsRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpscaleProjectShotsRequest) =>
      postUpscaleProjectShots(request),
    onSuccess: (_result, request) => {
      if (request.isDryRun) return;

      void queryClient.invalidateQueries({
        queryKey: queryKeys.projectCut.byProjectId(request.projectId)
      });
      /* The upscale dry run lives under this key, so without it the "N shots upscalable" count
       * keeps listing the Shots this run just queued. */
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projectState.byProjectId(request.projectId)
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.bulkRendersRuns.byProjectId(request.projectId)
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.balance.all });
    },
    onError: options?.onError
  });
};
