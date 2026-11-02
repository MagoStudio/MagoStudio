import { PlanStep } from "@schemas/plan";

import { backendApiClient } from "@/lib/backend-api-client";

import { findPlanReadableFromDesktop } from "./findPlanReadableFromDesktop";

export const fetchPlanSteps = async (planId: string): Promise<PlanStep[]> => {
  const desktopPlan = await findPlanReadableFromDesktop(planId);
  if (desktopPlan)
    return (
      Array.isArray(desktopPlan.steps) ? desktopPlan.steps : []
    ) as PlanStep[];

  const response = await backendApiClient.get<PlanStep[]>(
    `/agent/plans/${planId}/steps`
  );
  return response.data;
};
