import { AssetPromptResponse } from "@hooks/assets/interface";
import { AutoPromptVersionEnum } from "@hooks/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { queryKeys } from "@/queryKeys";

import { formatPromptFromResponse } from "../helpers/formatPromptFromResponse";

import { UseAutoPromptParams } from "./interface";
import { useExistingAutoPrompt } from "./useExistingAssetAutoPrompt";
import { generateNewPrompt } from "./utils";

export const useAutoPrompt = (params: UseAutoPromptParams) => {
  const queryClient = useQueryClient();
  const {
    styleReferenceImageId,
    videoAssetId,
    version,
    onAutoPromptGenerated
  } = params;

  const [isRegeneratingAutoPrompt, setIsRegeneratingAutoPrompt] =
    useState(false);

  const { existingPromptResponse, isPending: isImageAssetLoading } =
    useExistingAutoPrompt({
      styleReferenceImageId,
      videoAssetId,
      version
    });

  const hasBasicRequirements = !!params.styleReferenceImageBase64;

  const canUseVideo2Video =
    version === AutoPromptVersionEnum.VIDEO2VIDEO_DEFAULT &&
    !!params.motionDescription?.trim();

  const canUseImg2Img =
    version === AutoPromptVersionEnum.IMG2IMG_MAGO &&
    !!params.sourceVideoFrameBase64;

  const canGenerate =
    !isImageAssetLoading &&
    hasBasicRequirements &&
    (canUseVideo2Video || canUseImg2Img);

  const handleNewPromptGenerated = (newPrompt: AssetPromptResponse) => {
    if (newPrompt && onAutoPromptGenerated) {
      const formattedPrompt = formatPromptFromResponse(newPrompt);
      onAutoPromptGenerated(formattedPrompt);
    }
  };

  const queryResult = useQuery<AssetPromptResponse, Error>({
    queryKey: queryKeys.autoPrompt.for(
      version,
      styleReferenceImageId,
      videoAssetId
    ),
    enabled: canGenerate && !existingPromptResponse,

    queryFn: async () => {
      const newPrompt = await generateNewPrompt(params);
      handleNewPromptGenerated(newPrompt);
      return newPrompt;
    },
    retry: 1,
    staleTime: Infinity,
    gcTime: Infinity
  });

  const regenerateAutoPrompt = async () => {
    if (!canGenerate || isRegeneratingAutoPrompt) return;
    setIsRegeneratingAutoPrompt(true);
    try {
      const newPrompt = await generateNewPrompt(params);
      queryClient.setQueryData(
        queryKeys.autoPrompt.for(version, styleReferenceImageId, videoAssetId),
        newPrompt
      );

      handleNewPromptGenerated(newPrompt);

      await queryClient.invalidateQueries({
        queryKey: queryKeys.imageAsset.byId(styleReferenceImageId)
      });
      return newPrompt;
    } catch (error) {
      console.error("Failed to regenerate auto-prompt:", error);
      return undefined;
    } finally {
      setIsRegeneratingAutoPrompt(false);
    }
  };

  return {
    data: existingPromptResponse || queryResult.data,
    isPending: isImageAssetLoading || queryResult.isLoading,
    isFetching: queryResult.isFetching,
    isRegeneratingAutoPrompt,
    regenerateAutoPrompt,
    error: queryResult.error
  };
};
