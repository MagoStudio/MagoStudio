import { backendCloudApi } from "@domains/cloud/backendCloudApi";
import { ensureCloudImageAsset } from "@domains/cloud/mirrorService";
import {
  BulkRendersRun,
  BulkRendersRunSchema,
  CreateBulkRendersRunRequest,
  CreateBulkRendersRunRequestSchema
} from "@schemas/bulkRendersRun";

import { backendApiClient } from "@/lib/backend-api-client";

import { collectBulkRendersRunRequestImageAssetIds } from "../utils/collectBulkRendersRunRequestImageAssetIds";
import { replaceBulkRendersRunRequestImageAssetIds } from "../utils/replaceBulkRendersRunRequestImageAssetIds";

export const postBulkRendersRun = async (
  request: CreateBulkRendersRunRequest
): Promise<BulkRendersRun> => {
  const validatedRequest = CreateBulkRendersRunRequestSchema.parse(request);
  const cloudApi = backendCloudApi();
  const cloudAssetIdByLocalAssetId = new Map<string, string>();
  for (const localAssetId of collectBulkRendersRunRequestImageAssetIds(
    validatedRequest
  )) {
    cloudAssetIdByLocalAssetId.set(
      localAssetId,
      await ensureCloudImageAsset(
        cloudApi,
        localAssetId,
        validatedRequest.project_id
      )
    );
  }
  const response = await backendApiClient.post(
    "/agent/plans",
    replaceBulkRendersRunRequestImageAssetIds(
      validatedRequest,
      cloudAssetIdByLocalAssetId
    )
  );
  return BulkRendersRunSchema.parse(response.data);
};
