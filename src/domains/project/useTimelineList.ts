import { useQuery } from "@tanstack/react-query";

import { MINUTES_TO_MILLISECONDS } from "@/constants";
import { queryKeys } from "@/queryKeys";

import { fetchTimelineList } from "./api/fetchTimelineList";

const STALE_TIME_MINUTES = 5;
const STALE_TIME_MS = STALE_TIME_MINUTES * MINUTES_TO_MILLISECONDS;

export const useTimelineList = (projectId: string | undefined) => {
  const query = useQuery({
    queryKey: queryKeys.timelineList.byProjectId(projectId),
    queryFn: () => fetchTimelineList({ projectId: projectId! }),
    enabled: !!projectId,
    staleTime: STALE_TIME_MS,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });

  const items = query.data?.items ?? [];

  const thumbnailUrlById: Record<string, string | undefined> = {};
  for (const item of items) {
    thumbnailUrlById[item.id] = item.preview_url ?? undefined;
  }

  const timelineIdsByMostRecentlyEdited = items.map((item) => item.id);

  return {
    thumbnailUrlById,
    timelineIdsByMostRecentlyEdited,
    isLoading: query.isLoading
  };
};
