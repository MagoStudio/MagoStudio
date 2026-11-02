import { PlanSummary } from "@schemas/plan";

import { backendApiClient } from "@/lib/backend-api-client";

import { findPlanReadableFromDesktop } from "./findPlanReadableFromDesktop";

export const fetchPlanProgress = async (
  planId: string
): Promise<PlanSummary> => {
  const desktopPlan = await findPlanReadableFromDesktop(planId);
  if (desktopPlan) return desktopPlan as PlanSummary;
  const response = await backendApiClient.get<PlanSummary>(
    `/agent/plans/${planId}/progress`
  );
  return response.data;
};
