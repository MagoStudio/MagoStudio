import { PlanSummary } from "@schemas/plan";
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { fetchPlanProgress } from "../api/fetchPlanProgress";
import { ACTIVE_PLAN_STATUSES } from "../utils/planStatuses";

const ACTIVE_POLL_INTERVAL_MS = 10000;

export const usePlanProgress = (
  planId: string,
  pollIntervalMs: number = ACTIVE_POLL_INTERVAL_MS
) => {
  return useQuery({
    queryKey: queryKeys.planProgress.byId(planId),
    queryFn: () => fetchPlanProgress(planId),
    enabled: !!planId,
    refetchInterval: (query) => {
      const status = (query.state.data as PlanSummary | undefined)?.status;
      if (status && !ACTIVE_PLAN_STATUSES.has(status)) return false;
      return pollIntervalMs;
    }
  });
};
