import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import {
  PinSheetGroupImageRequest,
  putSheetGroupPin
} from "../api/putSheetGroupPin";

import { ScriptProjectMutationOptions } from "./scriptProjectMutationOptions";

export const usePinSheetGroupImage = (
  projectId: string | null | undefined,
  options?: ScriptProjectMutationOptions<PinSheetGroupImageRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: PinSheetGroupImageRequest) =>
      putSheetGroupPin({ ...request, projectId: projectId ?? undefined }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projectState.byProjectId(projectId)
      });
    },
    onError: options?.onError
  });
};
