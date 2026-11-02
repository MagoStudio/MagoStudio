import { useVideoAsset } from "@domains/asset/useVideoAsset";
import { getTrackAssetId } from "@domains/track/utils/getTrackAssetId";
import { Layer } from "@schemas/layer";

export const useLongFormShotVideoUrl = (
  renderTrack: Layer | undefined,
  enabled = true
) => {
  const assetId = getTrackAssetId(renderTrack);

  const { data: videoAsset, isLoading: isVideoUrlLoading } = useVideoAsset({
    assetId,
    selectedLayerId: renderTrack?.id,
    enabled: !!assetId && enabled
  });

  const videoUrl =
    videoAsset && "urlToUse" in videoAsset && videoAsset.urlToUse
      ? videoAsset.urlToUse
      : undefined;

  return { videoUrl, isVideoUrlLoading };
};
