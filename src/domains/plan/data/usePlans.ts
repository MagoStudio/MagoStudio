import { PlanStatus } from "@schemas/plan";
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { fetchPlans } from "../api/fetchPlans";
import { ACTIVE_PLAN_STATUSES } from "../utils/planStatuses";

const ACTIVE_POLL_INTERVAL_MS = 10000;

interface UsePlansParams {
  status?: PlanStatus;
  projectId?: string;
  enabled?: boolean;
}

export const usePlans = ({
  status,
  projectId,
  enabled = true
}: UsePlansParams = {}) => {
  return useQuery({
    queryKey: queryKeys.plans.list(status, projectId),
    queryFn: () => fetchPlans({ status, projectId }),
    enabled,
    refetchInterval: (query) => {
      const hasActivePlans = query.state.data?.some((planSummary) =>
        ACTIVE_PLAN_STATUSES.has(planSummary.status)
      );
      return hasActivePlans ? ACTIVE_POLL_INTERVAL_MS : false;
    }
  });
};
