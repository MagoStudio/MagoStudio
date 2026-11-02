import { getAssetDimensions } from "@domains/asset/utils/getAssetDimensions";
import { getTrackAssetData } from "@domains/track/utils/getTrackAssetData";
import { LayerType } from "@schemas/layer";
import { Shot } from "@schemas/shot";

export const getShotDimensions = (
  shot: Shot
): { width: number | undefined; height: number | undefined } => {
  const imageLayer = shot.layers.find(
    (layer) => layer.type === LayerType.IMAGE
  );
  return getAssetDimensions(getTrackAssetData(imageLayer));
};
