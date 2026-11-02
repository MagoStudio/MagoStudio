import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { fetchPlanSteps } from "../api/fetchPlanSteps";

const ACTIVE_POLL_INTERVAL_MS = 10000;

export const usePlanSteps = (planId: string, isActive: boolean) => {
  return useQuery({
    queryKey: queryKeys.planSteps.byId(planId),
    queryFn: () => fetchPlanSteps(planId),
    enabled: !!planId,
    refetchInterval: isActive ? ACTIVE_POLL_INTERVAL_MS : false
  });
};
