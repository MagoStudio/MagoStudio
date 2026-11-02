import { AssetPromptResponse } from "@hooks/assets/interface";

import { backendApiClient } from "@/lib/backend-api-client";

import { isAssetPromptGeneratedInCloud } from "./isAssetPromptGeneratedInCloud";

const getCloudAssetPrompt = async (
  assetId: string
): Promise<AssetPromptResponse> => {
  const response = await backendApiClient.get(`/assets/${assetId}/prompt`);
  return response.data;
};

export const getAssetPrompt = async (
  assetId?: string
): Promise<AssetPromptResponse> => {
  if (!assetId) {
    throw new Error("Asset ID is required");
  }

  if (await isAssetPromptGeneratedInCloud(assetId)) {
    return getCloudAssetPrompt(assetId);
  }

  const { prompt } = await window.mago.vlm.captionAsset(assetId);
  return { prompt } as AssetPromptResponse;
};
