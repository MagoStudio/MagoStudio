import { Asset } from "@schemas/asset";
import { Layer } from "@schemas/layer";

import { getTrackAsset } from "./getTrackAsset";

export const getTrackAssetData = (
  track: Layer | undefined
): Asset["data"] | undefined => getTrackAsset(track)?.data;
