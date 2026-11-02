import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import {
  DescribeSheetGroupRequest,
  postDescribeSheetGroup
} from "../api/postDescribeSheetGroup";

import { ScriptProjectMutationOptions } from "./scriptProjectMutationOptions";

export const useDescribeSheetGroup = (
  projectId: string | null | undefined,
  options?: ScriptProjectMutationOptions<DescribeSheetGroupRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: DescribeSheetGroupRequest) =>
      postDescribeSheetGroup({ ...request, projectId: projectId ?? undefined }),
    onSuccess: () => {
      /* Describing writes onto an image asset, and the version panel reads a version's
       * description straight from the sheets response (`images[].description`). Without this
       * the request succeeds and the panel keeps showing the text it already had, so the
       * button looks dead. */
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projectState.byProjectId(projectId)
      });
    },
    onError: options?.onError
  });
};
