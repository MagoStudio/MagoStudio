import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import {
  RenderSheetGroupRequest,
  postSheetGroupRender
} from "../api/postSheetGroupRender";

import { ScriptProjectMutationOptions } from "./scriptProjectMutationOptions";

export const useRenderSheetGroup = (
  projectId: string | null | undefined,
  options?: ScriptProjectMutationOptions<RenderSheetGroupRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: RenderSheetGroupRequest) =>
      postSheetGroupRender({ ...request, projectId: projectId ?? undefined }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projectState.byProjectId(projectId)
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.balance.all });
    },
    onError: options?.onError
  });
};
