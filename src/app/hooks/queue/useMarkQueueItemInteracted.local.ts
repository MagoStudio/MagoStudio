import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getLocalDesktopApi } from "@/platform/localDesktop";
import { queryKeys } from "@/queryKeys";

import { QueueItem } from "./interface";
import { markCloudQueueItemInteracted } from "./markCloudQueueItemInteracted";

export const useMarkQueueItemInteracted = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (queueItemId: string) => {
      const queueItem = queryClient
        .getQueryData<QueueItem[]>(queryKeys.queue.all)
        ?.find((candidate) => candidate.id === queueItemId);
      if (queueItem?.render_provider === "mago-cloud") {
        await markCloudQueueItemInteracted(queueItem);
        return;
      }
      await getLocalDesktopApi().imageRenders.markInteracted(queueItemId);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.queue.all })
  });
};
