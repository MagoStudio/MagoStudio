import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { cancelPlan } from "../api/cancelPlan";

export const useCancelPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelPlan,
    onSuccess: (_data, planId) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.planProgress.byId(planId)
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.planSteps.byId(planId)
      });
    }
  });
};
