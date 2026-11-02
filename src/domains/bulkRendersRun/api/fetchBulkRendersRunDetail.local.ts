import {
  BulkRendersRunDetail,
  BulkRendersRunDetailSchema
} from "@schemas/bulkRendersRun";

import { backendApiClient } from "@/lib/backend-api-client";

import {
  getLocalBulkRendersRun,
  parseLocalBulkRendersRunDetail
} from "./localBulkRendersRun";

export const fetchBulkRendersRunDetail = async (
  bulkRunId: string
): Promise<BulkRendersRunDetail> => {
  const local = await getLocalBulkRendersRun(bulkRunId);
  if (local) return parseLocalBulkRendersRunDetail(local);
  const response = await backendApiClient.get(`/agent/plans/${bulkRunId}`);
  return BulkRendersRunDetailSchema.parse(response.data);
};
