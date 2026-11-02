import { generateFilmstrip } from "@app/services/mediaBunny";
import { useVideoAsset } from "@domains/asset/useVideoAsset";
import { buildRenderCacheKey } from "@domains/asset/utils/buildRenderCacheKey";
import { cacheVideoUrl } from "@domains/asset/utils/cacheVideoUrl";
import {
  getFilmstripFromCache,
  saveFilmstripToCache
} from "@domains/asset/utils/filmstripCache";
import { useQuery } from "@tanstack/react-query";

interface UseMediaBunnyFilmstripProps {
  assetId: string;
  trackId: string;
  width: number;
  fps?: number;
  enabled: boolean;
  isSingleFrame?: boolean;
  videoUrl?: string | null;
}

export function useMediaBunnyFilmstrip({
  assetId,
  trackId,
  width,
  fps,
  enabled,
  videoUrl: directVideoUrl
}: UseMediaBunnyFilmstripProps) {
  const renderCacheKey = buildRenderCacheKey(assetId, directVideoUrl);
  const {
    data: cachedFilmstrip,
    isLoading: isCheckingCache,
    error: cacheError
  } = useQuery({
    queryKey: ["filmstrip-cache", renderCacheKey, width],
    queryFn: () => getFilmstripFromCache(renderCacheKey, width),
    enabled: enabled && !!assetId,
    staleTime: Infinity,
    gcTime: Infinity
  });

  const hasCachedFilmstrip = !!cachedFilmstrip;
  const cacheChecked = !isCheckingCache;

  const {
    data: videoAsset,
    isLoading: isVideoAssetLoading,
    error: videoAssetError
  } = useVideoAsset({
    assetId,
    selectedLayerId: trackId,
    enabled: enabled && cacheChecked && !hasCachedFilmstrip && !directVideoUrl
  });
  const videoUrl = (() => {
    if (directVideoUrl) return directVideoUrl;
    if (!videoAsset) return undefined;
    if ("urlToUse" in videoAsset && videoAsset.urlToUse)
      return videoAsset.urlToUse;
    if ("s3_url" in videoAsset && videoAsset.s3_url) return videoAsset.s3_url;
    return undefined;
  })();
  const {
    data: generatedFilmstrip,
    isLoading: isGenerating,
    error: generateError
  } = useQuery({
    queryKey: ["filmstrip-generate", renderCacheKey, width, fps],
    queryFn: async () => {
      if (!videoUrl) return null;

      const downloadedVideo = directVideoUrl
        ? await cacheVideoUrl(directVideoUrl, renderCacheKey)
        : null;
      if (downloadedVideo && !downloadedVideo.isCached) {
        throw new Error("Shot video is not downloadable yet");
      }
      const sourceUrl = downloadedVideo?.urlToUse ?? videoUrl;

      let filmstrip: string;
      try {
        filmstrip = await generateFilmstrip(sourceUrl, {
          fps,
          width,
          frameHeight: 65
        });
      } finally {
        if (downloadedVideo) URL.revokeObjectURL(sourceUrl);
      }

      if (filmstrip) {
        saveFilmstripToCache(renderCacheKey, width, filmstrip).catch(() => {});
      }

      return filmstrip;
    },
    enabled:
      enabled && cacheChecked && !hasCachedFilmstrip && !!videoUrl && !!assetId,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1
  });

  const isLoading =
    isCheckingCache ||
    (!hasCachedFilmstrip && (isVideoAssetLoading || isGenerating));

  return {
    data: cachedFilmstrip || generatedFilmstrip,
    isLoading,
    error: cacheError || videoAssetError || generateError
  };
}
