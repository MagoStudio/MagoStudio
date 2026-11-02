import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { createPlan } from "../api/createPlan";

export const useCreatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPlan,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
    }
  });
};
