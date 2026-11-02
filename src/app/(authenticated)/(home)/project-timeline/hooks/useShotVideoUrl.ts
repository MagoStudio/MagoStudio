import { useVideoAsset } from "@domains/asset/useVideoAsset";
import { getVideoAssetUrl } from "@domains/asset/utils/getVideoAssetUrl";

export function useShotVideoUrl(
  assetId: string | undefined,
  trackId: string | undefined
) {
  const { data: videoAsset } = useVideoAsset({
    assetId,
    selectedLayerId: trackId,
    enabled: !!assetId
  });

  return getVideoAssetUrl(videoAsset);
}
