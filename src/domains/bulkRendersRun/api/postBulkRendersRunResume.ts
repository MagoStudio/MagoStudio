import { backendApiClient } from "@/lib/backend-api-client";

export const postBulkRendersRunResume = async (
  bulkRunId: string
): Promise<void> => {
  await backendApiClient.post(
    `/agent/plans/${encodeURIComponent(bulkRunId)}/resume`
  );
};
