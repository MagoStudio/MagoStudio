import { extractFrameFromVideo } from "@app/services/mediaBunny";
import { useQuery } from "@tanstack/react-query";

import { useVideoAsset } from "./useVideoAsset";
import { getFrameFromCache, saveFrameToCache } from "./utils/frameCache";

interface UseVideoFrameProps {
  assetId?: string;
  selectedLayerId?: string;
  enabled?: boolean;
  frameNumber: number;
  fps?: number;
}

export function useVideoFrame({
  assetId,
  selectedLayerId,
  enabled = true,
  frameNumber,
  fps
}: UseVideoFrameProps) {
  const {
    data: cachedFrame,
    isLoading: isCheckingCache,
    error: cacheError
  } = useQuery({
    queryKey: ["frame-cache", assetId, frameNumber, fps],
    queryFn: () => getFrameFromCache(assetId!, frameNumber, fps),
    enabled: enabled && !!assetId,
    staleTime: Infinity,
    gcTime: Infinity
  });

  const hasCachedFrame = !!cachedFrame;
  const cacheChecked = !isCheckingCache;

  const { data: videoAsset, isLoading: isVideoAssetLoading } = useVideoAsset({
    assetId,
    selectedLayerId,
    enabled: enabled && cacheChecked && !hasCachedFrame && !!assetId
  });
  const urlToUse = (() => {
    if (!videoAsset) return undefined;
    if ("urlToUse" in videoAsset && videoAsset.urlToUse)
      return videoAsset.urlToUse;
    return undefined;
  })();
  const {
    data: generatedFrame,
    isLoading: isGenerating,
    error: generateError
  } = useQuery({
    queryKey: ["frame-generate", assetId, frameNumber, fps],
    queryFn: async () => {
      if (!urlToUse || !assetId) return null;

      const frame = await extractFrameFromVideo({
        videoSource: urlToUse,
        frameNumber,
        fps
      });

      if (frame) {
        saveFrameToCache(assetId, frameNumber, frame, fps).catch(() => {});
      }

      return frame;
    },
    enabled:
      enabled && cacheChecked && !hasCachedFrame && !!urlToUse && !!assetId,
    staleTime: Infinity,
    gcTime: Infinity
  });

  const isLoading =
    isCheckingCache ||
    (!hasCachedFrame && (isVideoAssetLoading || isGenerating));

  return {
    data: cachedFrame || generatedFrame || undefined,
    isLoading,
    error: cacheError || generateError
  };
}
