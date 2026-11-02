import { generateFilmstrip } from "@app/services/mediaBunny";
import { useVideoAsset } from "@domains/asset/useVideoAsset";
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

/** Desktop keeps the shared hook signature, but extraction runs in the main
 * process with bundled ffmpeg. No local video bytes enter MediaBunny/browser
 * fetch, so custom-protocol CORS and large Blob copies are avoided. */
export function useMediaBunnyFilmstrip({
  assetId,
  trackId,
  width,
  fps,
  enabled,
  videoUrl: directVideoUrl
}: UseMediaBunnyFilmstripProps) {
  const isDirectVideoLocal = directVideoUrl?.startsWith("mago-media:") ?? false;
  const needsVideoAssetLookup = !directVideoUrl || isDirectVideoLocal;
  const {
    data: cachedFilmstrip,
    isLoading: isCheckingCache,
    error: cacheError
  } = useQuery({
    queryKey: ["filmstrip-cache", assetId, width],
    queryFn: () => getFilmstripFromCache(assetId, width),
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
    enabled:
      enabled && cacheChecked && !hasCachedFilmstrip && needsVideoAssetLookup
  });
  const videoUrl = (() => {
    if (directVideoUrl) return directVideoUrl;
    if (!videoAsset) return undefined;
    if ("urlToUse" in videoAsset && videoAsset.urlToUse) {
      return videoAsset.urlToUse;
    }
    if ("s3_url" in videoAsset && videoAsset.s3_url) return videoAsset.s3_url;
    return undefined;
  })();
  const localAssetStatus =
    videoAsset && "asset" in videoAsset
      ? videoAsset.asset.data?.status
      : undefined;
  const localAssetRevision =
    videoAsset && "asset" in videoAsset
      ? String(videoAsset.asset.updated_at)
      : undefined;
  const isLocalVideo = videoUrl?.startsWith("mago-media:") ?? false;
  // A cloud render gets its stable local asset id before its file exists. Do
  // not let that placeholder poison the generation query with an ffmpeg ENOENT;
  // completion changes the asset revision and marks it ingested.
  const isVideoReady = !isLocalVideo || localAssetStatus === "ingested";
  const {
    data: generatedFilmstrip,
    isLoading: isGenerating,
    error: generateError
  } = useQuery({
    queryKey: ["filmstrip-generate", assetId, width, fps, localAssetRevision],
    queryFn: async () => {
      const generateRemoteFilmstrip = async () => {
        const downloadedVideo = directVideoUrl
          ? await cacheVideoUrl(directVideoUrl, assetId)
          : null;
        if (downloadedVideo && !downloadedVideo.isCached) {
          throw new Error("Shot video is not downloadable yet");
        }
        const sourceUrl = downloadedVideo?.urlToUse ?? videoUrl!;
        try {
          return await generateFilmstrip(sourceUrl, {
            fps,
            width,
            frameHeight: 65
          });
        } finally {
          if (downloadedVideo) URL.revokeObjectURL(sourceUrl);
        }
      };
      const filmstrip = videoUrl?.startsWith("mago-media:")
        ? await window.mago.assets.generateVideoFilmstrip({
            assetId,
            width: Math.max(1, width),
            frameHeight: 65
          })
        : await generateRemoteFilmstrip();
      saveFilmstripToCache(assetId, width, filmstrip).catch(() => {});
      return filmstrip;
    },
    enabled:
      enabled &&
      cacheChecked &&
      !hasCachedFilmstrip &&
      !!assetId &&
      !!videoUrl &&
      isVideoReady,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1
  });

  return {
    data: cachedFilmstrip || generatedFilmstrip,
    isLoading:
      isCheckingCache ||
      (!hasCachedFilmstrip && (isVideoAssetLoading || isGenerating)),
    error: cacheError || videoAssetError || generateError
  };
}
