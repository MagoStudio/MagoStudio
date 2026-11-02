import {
  CLOUD_SHEET_EXECUTOR,
  executeCloudSheetPlan
} from "@domains/scriptProject/cloudSheetRender.local";
import { Plan } from "@schemas/plan";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi } from "@/platform/localDesktop";

import { findLocallyRunPlan } from "./findLocallyRunPlan";

export const resumePlan = async (planId: string): Promise<Plan> => {
  if (await findLocallyRunPlan(planId)) {
    const resumed =
      await getLocalDesktopApi().scriptProjects.resumePlan(planId);
    // A cloud sheet plan is run by the renderer, not the desktop.
    if (resumed.local_executor === CLOUD_SHEET_EXECUTOR)
      void executeCloudSheetPlan(planId);
    return resumed as Plan;
  }
  const response = await backendApiClient.post<Plan>(
    `/agent/plans/${planId}/resume`
  );
  return response.data;
};
