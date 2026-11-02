import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { fetchBulkRendersRunSteps } from "../api/fetchBulkRendersRunSteps";
import { BULK_RENDERS_RUN_POLL_INTERVAL_MS } from "../constants";

/** The run going terminal buys one more fetch rather than cancelling the pending one.
 *
 * The progress and steps queries poll on independent timers that drift apart, so a progress
 * response reporting a terminal run can arrive while the last steps response still showed a step
 * running. Switching this query off on that status cleared its pending timer without it ever
 * firing, and the view stayed frozen mid-progress for as long as it was open.
 *
 * The activity flag lives in the query key, so the run settling produces a new key and react
 * query fetches it once. Polling is still off for a terminal run, which is what
 * `bulk-renders-run-progress` requires — a failed run whose remaining steps stay PENDING forever
 * is never polled again.
 *
 * A terminal run's steps never change again, so they never go stale. Without that, a history row
 * and its expanded tabs share one key but subscribe at different moments, and the second
 * subscriber refetches what the first already has. */
export const useBulkRendersRunSteps = ({
  bulkRunId,
  isBulkRendersRunActive,
  enabled = true
}: {
  bulkRunId: string | undefined;
  isBulkRendersRunActive: boolean;
  enabled?: boolean;
}) =>
  useQuery({
    queryKey: queryKeys.bulkRendersRunSteps.byRunIdWhileActive(
      bulkRunId,
      isBulkRendersRunActive
    ),
    queryFn: () => fetchBulkRendersRunSteps(bulkRunId as string),
    enabled: enabled && !!bulkRunId,
    staleTime: isBulkRendersRunActive ? 0 : Infinity,
    refetchInterval: (query) => {
      if (query.state.status === "error") return false;
      return isBulkRendersRunActive ? BULK_RENDERS_RUN_POLL_INTERVAL_MS : false;
    }
  });
