import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { resumePlan } from "../api/resumePlan";

export const useResumePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resumePlan,
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
