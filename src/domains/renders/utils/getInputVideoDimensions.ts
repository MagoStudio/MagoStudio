import { getAssetDimensions } from "@domains/asset/utils/getAssetDimensions";
import { getTrackAssetData } from "@domains/track/utils/getTrackAssetData";
import { Layer } from "@schemas/layer";

export interface InputVideoDimensions {
  inputVideoWidth: number | undefined;
  inputVideoHeight: number | undefined;
}

export const getInputVideoDimensions = (
  sourceTrack: Layer | undefined
): InputVideoDimensions => {
  const { width, height } = getAssetDimensions(getTrackAssetData(sourceTrack));
  return { inputVideoWidth: width, inputVideoHeight: height };
};
