import { getTrackAssetData } from "@domains/track/utils/getTrackAssetData";
import { LayerType } from "@schemas/layer";
import { Shot } from "@schemas/shot";

export const getShotFrameCount = (shot: Shot): number | undefined => {
  const imageLayer = shot.layers.find(
    (layer) => layer.type === LayerType.IMAGE
  );
  const assetData = getTrackAssetData(imageLayer);
  return assetData?.total_frames ?? assetData?.duration;
};
