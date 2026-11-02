import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import {
  GenerateProjectSheetsRequest,
  postGenerateProjectSheets
} from "../api/postGenerateProjectSheets";

import { ScriptProjectMutationOptions } from "./scriptProjectMutationOptions";

export const useGenerateProjectSheets = (
  options?: ScriptProjectMutationOptions<GenerateProjectSheetsRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: GenerateProjectSheetsRequest) =>
      postGenerateProjectSheets(request),
    onSuccess: (_result, request) => {
      if (request.isDryRun) return;

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
