import {
  BulkRendersRun,
  BulkRendersRunSchema,
  CreateBulkRendersRunRequest,
  CreateBulkRendersRunRequestSchema
} from "@schemas/bulkRendersRun";

import { backendApiClient } from "@/lib/backend-api-client";

export const postBulkRendersRun = async (
  request: CreateBulkRendersRunRequest
): Promise<BulkRendersRun> => {
  const validatedRequest = CreateBulkRendersRunRequestSchema.parse(request);
  const response = await backendApiClient.post(
    "/agent/plans",
    validatedRequest
  );
  return BulkRendersRunSchema.parse(response.data);
};
