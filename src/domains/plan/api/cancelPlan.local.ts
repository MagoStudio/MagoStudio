import { Plan } from "@schemas/plan";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi } from "@/platform/localDesktop";

import { findLocallyRunPlan } from "./findLocallyRunPlan";

export const cancelPlan = async (planId: string): Promise<Plan> => {
  if (await findLocallyRunPlan(planId)) {
    return (await getLocalDesktopApi().scriptProjects.cancelPlan(
      planId
    )) as Plan;
  }
  const response = await backendApiClient.post<Plan>(
    `/agent/plans/${planId}/cancel`
  );
  return response.data;
};
