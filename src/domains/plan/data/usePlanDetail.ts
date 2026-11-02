import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { fetchPlanDetail } from "../api/fetchPlanDetail";

export const usePlanDetail = (planId: string) => {
  return useQuery({
    queryKey: queryKeys.planDetail.byId(planId),
    queryFn: () => fetchPlanDetail(planId),
    enabled: !!planId,
    staleTime: Infinity
  });
};
