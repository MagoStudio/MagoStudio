import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import {
  CastProjectScriptRequest,
  postProjectScript
} from "../api/postProjectScript";

import { ScriptProjectMutationOptions } from "./scriptProjectMutationOptions";

export const useCastProjectScript = (
  options?: ScriptProjectMutationOptions<CastProjectScriptRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CastProjectScriptRequest) =>
      postProjectScript(request),
    onSuccess: (_created, request) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projectScriptVersions.byProjectId(request.projectId)
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projectState.byProjectId(request.projectId)
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.bulkRendersRuns.byProjectId(request.projectId)
      });
    },
    onError: options?.onError
  });
};
