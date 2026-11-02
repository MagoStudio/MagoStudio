import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { postBulkRendersRun } from "../api/postBulkRendersRun";

export const useCreateBulkRendersRun = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postBulkRendersRun,
    /* Keyed from the request, never the response: the backend's plan has no `project_id` column,
     * so the create response omits the field entirely while the list response synthesises it.
     * Reading it back gave a key ending in `undefined`, which prefix-matches nothing. */
    onSuccess: (_createdRun, request) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.bulkRendersRuns.byProjectId(request.project_id)
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.bulkRendersRuns.everyProject()
      });
    }
  });
};
