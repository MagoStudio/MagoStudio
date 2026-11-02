import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import {
  GenerateSceneStoryboardRequest,
  postSceneStoryboardGenerate
} from "../api/postSceneStoryboardGenerate";

import { ScriptProjectMutationOptions } from "./scriptProjectMutationOptions";

export const useSubmitSceneStoryboard = (
  options?: ScriptProjectMutationOptions<GenerateSceneStoryboardRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postSceneStoryboardGenerate,
    onSuccess: (_submitted, request) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projectState.byProjectId(request.projectId)
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.balance.all });
    },
    onError: options?.onError
  });
};
