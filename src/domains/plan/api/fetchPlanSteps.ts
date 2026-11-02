import { PlanStep } from "@schemas/plan";

import { backendApiClient } from "@/lib/backend-api-client";

export const fetchPlanSteps = async (planId: string): Promise<PlanStep[]> => {
  const response = await backendApiClient.get<PlanStep[]>(
    `/agent/plans/${planId}/steps`
  );
  return response.data;
};
