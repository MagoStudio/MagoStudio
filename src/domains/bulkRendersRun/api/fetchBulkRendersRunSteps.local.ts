import {
  BulkRendersRunStep,
  BulkRendersRunStepListSchema
} from "@schemas/bulkRendersRun";

import { backendApiClient } from "@/lib/backend-api-client";

import {
  getLocalBulkRendersRun,
  parseLocalBulkRendersRunSteps
} from "./localBulkRendersRun";

export const fetchBulkRendersRunSteps = async (
  bulkRunId: string
): Promise<BulkRendersRunStep[]> => {
  const local = await getLocalBulkRendersRun(bulkRunId);
  if (local) return parseLocalBulkRendersRunSteps(local);
  const response = await backendApiClient.get(
    `/agent/plans/${bulkRunId}/steps`
  );
  return BulkRendersRunStepListSchema.parse(response.data);
};
