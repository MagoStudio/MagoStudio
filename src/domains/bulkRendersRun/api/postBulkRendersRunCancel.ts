import { backendApiClient } from "@/lib/backend-api-client";

export const postBulkRendersRunCancel = async (
  bulkRunId: string
): Promise<void> => {
  await backendApiClient.post(
    `/agent/plans/${encodeURIComponent(bulkRunId)}/cancel`
  );
};
