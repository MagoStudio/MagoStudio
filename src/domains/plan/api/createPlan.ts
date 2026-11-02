import { CreatePlanRequest, Plan } from "@schemas/plan";

import { backendApiClient } from "@/lib/backend-api-client";

export const createPlan = async (data: CreatePlanRequest): Promise<Plan> => {
  const response = await backendApiClient.post<Plan>("/agent/plans", data);
  return response.data;
};
