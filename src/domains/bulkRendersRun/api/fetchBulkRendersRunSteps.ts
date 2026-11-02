import {
  BulkRendersRunStep,
  BulkRendersRunStepListSchema
} from "@schemas/bulkRendersRun";

import { backendApiClient } from "@/lib/backend-api-client";

export const fetchBulkRendersRunSteps = async (
  bulkRunId: string
): Promise<BulkRendersRunStep[]> => {
  const response = await backendApiClient.get(
    `/agent/plans/${bulkRunId}/steps`
  );
  return BulkRendersRunStepListSchema.parse(response.data);
};
