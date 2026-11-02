import { isRenderCancelable } from "@domains/queue/utils/isRenderCancelable";
import { AssetStatus } from "@schemas/asset";
import { useQuery, UseQueryResult, Query } from "@tanstack/react-query";

import { backendApiClient } from "@/lib/backend-api-client";
import { queryKeys } from "@/queryKeys";

import { QueueItem } from "./interface";

async function fetchFilteredQueue(): Promise<QueueItem[]> {
  const response = await backendApiClient.get<QueueItem[]>(`/queue`);
  return response.data.map((item) => ({
    ...item,
    render_provider: "mago-cloud" as const
  }));
}

type UseQueueResult = UseQueryResult<QueueItem[], Error> & {
  triggerRefetch: () => void;
};

const POLL_INTERVAL = parseInt(process.env.QUEUE_POLL_INTERVAL || "5000");

const queueRefetchInterval = (
  queryState: Query<QueueItem[], Error>,
  projectId?: string
) => {
  const queueItems = queryState.state.data;

  const filteredQueueItems = projectId
    ? queueItems?.filter((item: QueueItem) => item.project_id === projectId)
    : queueItems;

  const hasInProgressItems = filteredQueueItems?.some(
    (item: QueueItem) =>
      item.status === AssetStatus.INPROGRESS ||
      item.status === AssetStatus.PENDING ||
      item.status === AssetStatus.INQUEUE
  );

  return hasInProgressItems ? POLL_INTERVAL : false;
};

const select = (data: QueueItem[]) => {
  return data.map((item: QueueItem) => ({
    ...item,
    isCancelable: isRenderCancelable({
      status: item.status,
      positionInQueue: item.display_order
    })
  }));
};

export function useQueue(props?: { enabled?: boolean }): UseQueueResult {
  const enabled = props?.enabled ?? true;

  const query = useQuery({
    queryKey: queryKeys.queue.all,
    queryFn: fetchFilteredQueue,
    refetchInterval: (queryState: Query<QueueItem[], Error>) =>
      queueRefetchInterval(queryState),
    refetchIntervalInBackground: true,
    enabled: enabled,
    select
  });

  return {
    ...query,
    triggerRefetch: () => query.refetch()
  };
}
