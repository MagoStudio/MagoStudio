import { BulkRendersRun, BulkRendersRunSchema } from "@schemas/bulkRendersRun";

import { backendApiClient } from "@/lib/backend-api-client";

import {
  getLocalBulkRendersRun,
  parseLocalBulkRendersRun
} from "./localBulkRendersRun";

export const fetchBulkRendersRunProgress = async (
  bulkRunId: string
): Promise<BulkRendersRun> => {
  const local = await getLocalBulkRendersRun(bulkRunId);
  if (local) return parseLocalBulkRendersRun(local)!;
  const response = await backendApiClient.get(
    `/agent/plans/${bulkRunId}/progress`
  );
  return BulkRendersRunSchema.parse(response.data);
};
