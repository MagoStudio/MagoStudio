import { Plan } from "@schemas/plan";

import { backendApiClient } from "@/lib/backend-api-client";

export const cancelPlan = async (planId: string): Promise<Plan> => {
  const response = await backendApiClient.post<Plan>(
    `/agent/plans/${planId}/cancel`
  );
  return response.data;
};
