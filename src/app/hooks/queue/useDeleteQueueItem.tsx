import { useMutation, useQueryClient } from "@tanstack/react-query";

import { backendApiClient } from "@/lib/backend-api-client";
import { queryKeys } from "@/queryKeys";

const deleteQueueItem = async ({ queueItemId }: { queueItemId: string }) => {
  const response = await backendApiClient.delete(`/queue/${queueItemId}`);

  return response;
};

export const useDeleteQueueItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { queueItemId: string }) => {
      await deleteQueueItem(params);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.queue.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.project.all });
    }
  });
};
