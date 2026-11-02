import { useImageAsset } from "@domains/asset/useImageAsset";
import { useVlmStatus } from "@domains/prompt/useVlmStatus";
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { getAssetPrompt } from "../api/getAssetPrompt";
import { selectPromptWithFormattedText } from "../utils/selectPromptWithFormattedText";

import { useIsAssetPromptGeneratedInCloud } from "./useIsAssetPromptGeneratedInCloud";

export const useGetImageAssetPrompt = ({
  assetId,
  enabled = true
}: {
  assetId: string | undefined;
  enabled?: boolean;
  onSuccess?: () => void;
}) => {
  const { data: imageAsset, isLoading: isImageAssetLoading } = useImageAsset({
    assetId,
    enabled: enabled && !!assetId
  });
  const { isVlmReady } = useVlmStatus();
  const { isPromptGeneratedInCloud } = useIsAssetPromptGeneratedInCloud({
    assetId,
    enabled
  });

  const assetExistingPrompt = imageAsset?.asset?.data?.prompt;

  return useQuery({
    queryKey: queryKeys.assetPrompt.byId(assetId),
    queryFn: () => {
      if (assetExistingPrompt) {
        return {
          prompt: assetExistingPrompt
        };
      }
      return getAssetPrompt(assetId);
    },
    select: selectPromptWithFormattedText,
    // A cached prompt is a free read; generating one locally is a multi-minute
    // ComfyUI job, so only run when Qwen3-VL is actually reachable.
    enabled:
      !!assetId &&
      enabled &&
      !isImageAssetLoading &&
      (!!assetExistingPrompt || isPromptGeneratedInCloud || isVlmReady),
    staleTime: Infinity,
    // Locally this is a minute-long VLM run, not a cheap GET — the default
    // three retries would leave the disclosure spinning for far too long.
    retry: 1,
    // ...and a failure must not re-submit the job every time the disclosure
    // remounts. Reachability is already tracked by useVlmStatus.
    retryOnMount: false
  });
};
