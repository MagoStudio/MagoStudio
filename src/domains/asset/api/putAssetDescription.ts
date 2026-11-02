import { backendApiClient } from "@/lib/backend-api-client";

export type EditAssetDescriptionRequest = {
  assetId: string;
  description: string;
};

export const putAssetDescription = async ({
  assetId,
  description
}: EditAssetDescriptionRequest): Promise<void> => {
  await backendApiClient.put(`/assets/${encodeURIComponent(assetId)}`, {
    description
  });
};
