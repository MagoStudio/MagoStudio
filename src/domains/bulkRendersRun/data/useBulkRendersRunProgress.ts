import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { fetchBulkRendersRunProgress } from "../api/fetchBulkRendersRunProgress";
import { BULK_RENDERS_RUN_POLL_INTERVAL_MS } from "../constants";
import { isBulkRendersRunStatusTerminal } from "../utils/isBulkRendersRunStatusTerminal";

export const useBulkRendersRunProgress = (bulkRunId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.bulkRendersRunProgress.byRunId(bulkRunId),
    queryFn: () => fetchBulkRendersRunProgress(bulkRunId as string),
    enabled: !!bulkRunId,
    refetchInterval: (query) => {
      if (query.state.status === "error") return false;
      const latestStatus = query.state.data?.status;
      if (!latestStatus) return BULK_RENDERS_RUN_POLL_INTERVAL_MS;
      return isBulkRendersRunStatusTerminal(latestStatus)
        ? false
        : BULK_RENDERS_RUN_POLL_INTERVAL_MS;
    }
  });
