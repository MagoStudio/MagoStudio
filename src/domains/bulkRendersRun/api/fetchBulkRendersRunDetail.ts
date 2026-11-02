import {
  BulkRendersRunDetail,
  BulkRendersRunDetailSchema
} from "@schemas/bulkRendersRun";

import { backendApiClient } from "@/lib/backend-api-client";

export const fetchBulkRendersRunDetail = async (
  bulkRunId: string
): Promise<BulkRendersRunDetail> => {
  const response = await backendApiClient.get(`/agent/plans/${bulkRunId}`);
  return BulkRendersRunDetailSchema.parse(response.data);
};
