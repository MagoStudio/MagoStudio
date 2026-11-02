import { PlanSummary } from "@schemas/plan";

import { backendApiClient } from "@/lib/backend-api-client";

export const fetchPlanProgress = async (
  planId: string
): Promise<PlanSummary> => {
  const response = await backendApiClient.get<PlanSummary>(
    `/agent/plans/${planId}/progress`
  );
  return response.data;
};
