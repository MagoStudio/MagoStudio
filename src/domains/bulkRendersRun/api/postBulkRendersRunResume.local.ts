import { resumePlan } from "@domains/plan/resumePlan";

export const postBulkRendersRunResume = async (
  bulkRunId: string
): Promise<void> => {
  await resumePlan(bulkRunId);
};
