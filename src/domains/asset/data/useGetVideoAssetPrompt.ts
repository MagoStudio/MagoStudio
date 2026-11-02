import { useVideoAsset } from "@domains/asset/useVideoAsset";
import { useVlmStatus } from "@domains/prompt/useVlmStatus";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { getAssetPrompt } from "../api/getAssetPrompt";
import { selectPromptWithFormattedText } from "../utils/selectPromptWithFormattedText";

import { useIsAssetPromptGeneratedInCloud } from "./useIsAssetPromptGeneratedInCloud";

export const useGetVideoAssetPrompt = ({
  assetId,
  enabled = true
}: {
  assetId: string | undefined;
  enabled?: boolean;
  onSuccess?: () => void;
}) => {
  const queryClient = useQueryClient();
  const isVideoAssetEnabled = enabled && !!assetId;

  const { data: videoAsset, isLoading: isVideoAssetLoading } = useVideoAsset({
    assetId: assetId,
    enabled: isVideoAssetEnabled
  });

  const { isVlmReady } = useVlmStatus();
  const { isPromptGeneratedInCloud } = useIsAssetPromptGeneratedInCloud({
    assetId,
    enabled
  });

  const assetExistingPrompt =
    videoAsset && "asset" in videoAsset ? videoAsset.asset?.data?.prompt : null;

  return useQuery({
    queryKey: queryKeys.assetPrompt.byId(assetId),
    queryFn: async () => {
      if (assetExistingPrompt) {
        return {
          prompt: assetExistingPrompt
        };
      }
      const response = await getAssetPrompt(assetId);
      // A newly generated caption also lands on the asset row, and AutoPrompt's
      // `motionDescription` reads it off the *track's* asset rather than off
      // this query. Without refreshing the asset the video2video AutoPrompt
      // would stay disabled until the next app start.
      if (response.prompt) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.videoAsset.byId(assetId)
        });
      }
      return response;
    },
    select: selectPromptWithFormattedText,
    // A cached prompt is a free read; generating one locally is a multi-minute
    // ComfyUI job, so only run when Qwen3-VL is actually reachable.
    enabled:
      !!assetId &&
      enabled &&
      !isVideoAssetLoading &&
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
