import { useMutation, useQueryClient } from "@tanstack/react-query";

import { backendApiClient } from "@/lib/backend-api-client";
import { queryKeys } from "@/queryKeys";

const markQueueItemInteracted = (queueItemId: string) =>
  backendApiClient.put(`/queue/interaction/${queueItemId}`);

export const useMarkQueueItemInteracted = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (queueItemId: string) => {
      await markQueueItemInteracted(queueItemId);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.queue.all })
  });
};
