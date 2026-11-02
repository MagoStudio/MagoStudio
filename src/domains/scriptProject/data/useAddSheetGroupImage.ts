import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import {
  AddSheetGroupImageRequest,
  postSheetGroupImage
} from "../api/postSheetGroupImage";

import { ScriptProjectMutationOptions } from "./scriptProjectMutationOptions";

export const useAddSheetGroupImage = (
  projectId: string | null | undefined,
  options?: ScriptProjectMutationOptions<AddSheetGroupImageRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AddSheetGroupImageRequest) =>
      postSheetGroupImage({ ...request, projectId: projectId ?? undefined }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projectState.byProjectId(projectId)
      });
    },
    onError: options?.onError
  });
};
