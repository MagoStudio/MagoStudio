import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import {
  PinProjectShotRequest,
  putProjectShotPin
} from "../api/putProjectShotPin";

import { ScriptProjectMutationOptions } from "./scriptProjectMutationOptions";

export const usePinProjectShot = (
  options?: ScriptProjectMutationOptions<PinProjectShotRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: PinProjectShotRequest) => putProjectShotPin(request),
    onSuccess: (_shotPin, request) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projectCut.byProjectId(request.projectId)
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projectState.byProjectId(request.projectId)
      });
    },
    onError: options?.onError
  });
};
