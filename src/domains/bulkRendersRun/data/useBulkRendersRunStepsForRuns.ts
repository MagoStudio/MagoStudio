import { BulkRendersRunStep } from "@schemas/bulkRendersRun";
import { Query, useQueries } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { fetchBulkRendersRunSteps } from "../api/fetchBulkRendersRunSteps";
import { FAILING_POLL_INTERVAL_MS } from "../constants";
import { areBulkRendersRunStepsSettled } from "../utils/areBulkRendersRunStepsSettled";

export interface BulkRendersRunStepsRequest {
  bulkRunId: string;
  isRunActive: boolean;
}

/** Steps for several runs at once, for a caller that has to watch every run a project has in
 * flight rather than one the user selected.
 *
 * Each entry carries its own `isRunActive`, which lands it on the same cache entry
 * `useBulkRendersRunSteps` uses for that run. Keying on the flagless `byRunId` instead gave the
 * two hooks separate entries and polled the endpoint twice on independent timers whenever both
 * were mounted for one run.
 *
 * Each query stops once its own steps have settled, so a run that finishes between refreshes of
 * the caller's run list is not fetched every interval for the rest of the session, and a run that
 * was already terminal when the caller asked is fetched exactly once. */
export const useBulkRendersRunStepsForRuns = (
  stepsRequests: BulkRendersRunStepsRequest[],
  pollIntervalMs: number
): BulkRendersRunStep[][] => {
  const stepQueries = useQueries({
    queries: stepsRequests.map(({ bulkRunId, isRunActive }) => ({
      queryKey: queryKeys.bulkRendersRunSteps.byRunIdWhileActive(
        bulkRunId,
        isRunActive
      ),
      queryFn: () => fetchBulkRendersRunSteps(bulkRunId),
      refetchInterval: (query: Query<BulkRendersRunStep[]>) => {
        if (query.state.status === "error") return FAILING_POLL_INTERVAL_MS;
        return areBulkRendersRunStepsSettled(query.state.data)
          ? false
          : pollIntervalMs;
      }
    }))
  });

  return stepQueries.map((stepQuery) => stepQuery.data ?? []);
};
