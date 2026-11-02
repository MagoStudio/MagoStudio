import { Plan } from "@schemas/plan";

import { backendApiClient } from "@/lib/backend-api-client";

export const resumePlan = async (planId: string): Promise<Plan> => {
  const response = await backendApiClient.post<Plan>(
    `/agent/plans/${planId}/resume`
  );
  return response.data;
};
