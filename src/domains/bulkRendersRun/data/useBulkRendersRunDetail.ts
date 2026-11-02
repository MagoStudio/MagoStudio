import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { fetchBulkRendersRunDetail } from "../api/fetchBulkRendersRunDetail";

export const useBulkRendersRunDetail = (
  bulkRunId: string | undefined,
  { enabled = true }: { enabled?: boolean } = {}
) =>
  useQuery({
    queryKey: queryKeys.bulkRendersRunDetail.byRunId(bulkRunId),
    queryFn: () => fetchBulkRendersRunDetail(bulkRunId as string),
    enabled: enabled && !!bulkRunId,
    staleTime: (query) => (query.state.data?.started_at ? Infinity : 0)
  });
