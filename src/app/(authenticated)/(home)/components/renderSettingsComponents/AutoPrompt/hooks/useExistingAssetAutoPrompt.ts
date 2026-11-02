import { useImageAsset } from "@domains/asset/useImageAsset";

import {
  UseExistingAutoPromptParams,
  UseExistingAutoPromptResult
} from "./interface";
import { createPromptResponse, findExistingAutoPrompt } from "./utils";

export const useExistingAutoPrompt = ({
  styleReferenceImageId,
  videoAssetId,
  version
}: UseExistingAutoPromptParams): UseExistingAutoPromptResult => {
  const { data: imageAsset, isLoading: isImageAssetLoading } = useImageAsset({
    assetId: styleReferenceImageId,
    enabled: !!styleReferenceImageId
  });

  const existingPrompt =
    videoAssetId && !isImageAssetLoading
      ? findExistingAutoPrompt(
          imageAsset?.asset?.data?.auto_prompt,
          videoAssetId,
          version
        )
      : null;

  const existingPromptResponse = existingPrompt
    ? createPromptResponse(existingPrompt)
    : null;

  return {
    existingPrompt,
    existingPromptResponse,
    isPending: isImageAssetLoading,
    imageAsset
  };
};
