import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi } from "@/platform/localDesktop";

import { getLocalBulkRendersRun } from "./localBulkRendersRun";

export const postBulkRendersRunCancel = async (
  bulkRunId: string
): Promise<void> => {
  if (await getLocalBulkRendersRun(bulkRunId)) {
    await getLocalDesktopApi().scriptProjects.cancelPlan(bulkRunId);
    return;
  }
  await backendApiClient.post(
    `/agent/plans/${encodeURIComponent(bulkRunId)}/cancel`
  );
};
