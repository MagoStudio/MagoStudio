import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { EditSheetGroupRequest, patchSheetGroup } from "../api/patchSheetGroup";

import { ScriptProjectMutationOptions } from "./scriptProjectMutationOptions";

export const useEditSheetGroup = (
  projectId: string | null | undefined,
  options?: ScriptProjectMutationOptions<EditSheetGroupRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: EditSheetGroupRequest) =>
      patchSheetGroup({ ...request, projectId: projectId ?? undefined }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projectCut.byProjectId(projectId)
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projectState.byProjectId(projectId)
      });
    },
    onError: options?.onError
  });
};
