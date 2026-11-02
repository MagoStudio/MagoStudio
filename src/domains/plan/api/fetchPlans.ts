import { PlanSummary, PlanStatus } from "@schemas/plan";

import { backendApiClient } from "@/lib/backend-api-client";

interface FetchPlansParams {
  status?: PlanStatus;
  projectId?: string;
}

export const fetchPlans = async ({
  status,
  projectId
}: FetchPlansParams = {}): Promise<PlanSummary[]> => {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (projectId) params.project_id = projectId;
  const response = await backendApiClient.get<PlanSummary[]>("/agent/plans", {
    params
  });
  return response.data;
};
