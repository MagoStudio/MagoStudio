import { BulkRendersRun, BulkRendersRunSchema } from "@schemas/bulkRendersRun";

import { backendApiClient } from "@/lib/backend-api-client";

export const fetchBulkRendersRunProgress = async (
  bulkRunId: string
): Promise<BulkRendersRun> => {
  const response = await backendApiClient.get(
    `/agent/plans/${bulkRunId}/progress`
  );
  return BulkRendersRunSchema.parse(response.data);
};
