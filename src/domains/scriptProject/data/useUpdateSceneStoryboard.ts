import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import {
  UpdateSceneStoryboardRequest,
  putSceneStoryboard
} from "../api/putSceneStoryboard";
import { isSameQueryKey } from "../utils/isSameQueryKey";

import { ScriptProjectMutationOptions } from "./scriptProjectMutationOptions";

export const useUpdateSceneStoryboard = (
  options?: ScriptProjectMutationOptions<UpdateSceneStoryboardRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: putSceneStoryboard,
    onSuccess: async (sceneStoryboard, request) => {
      const sceneStoryboardQueryKey = queryKeys.projectState.sceneStoryboard(
        request.projectId,
        request.sceneTimelineId
      );
      queryClient.setQueryData(sceneStoryboardQueryKey, sceneStoryboard);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.projectState.byProjectId(request.projectId),
        predicate: (query) =>
          !isSameQueryKey(query.queryKey, sceneStoryboardQueryKey)
      });
    },
    onError: options?.onError
  });
};
