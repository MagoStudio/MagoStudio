import { getLocalDesktopApi } from "@/platform/localDesktop";

import { isLocallyRunPlan } from "../utils/isLocallyRunPlan";

export const findPlanReadableFromDesktop = async (
  planId: string
): Promise<Record<string, unknown> | null> => {
  const desktop = getLocalDesktopApi();
  const plan = await desktop.scriptProjects.getPlan(planId);
  if (!plan) return null;
  if (isLocallyRunPlan(plan)) return plan;
  const isCloudReachable = desktop.account.mode === "cloud";
  return isCloudReachable ? null : plan;
};
