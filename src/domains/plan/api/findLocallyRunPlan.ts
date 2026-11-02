import { getLocalDesktopApi } from "@/platform/localDesktop";

import { isLocallyRunPlan } from "../utils/isLocallyRunPlan";

export const findLocallyRunPlan = async (
  planId: string
): Promise<Record<string, unknown> | null> => {
  const plan = await getLocalDesktopApi().scriptProjects.getPlan(planId);
  return isLocallyRunPlan(plan) ? plan : null;
};
