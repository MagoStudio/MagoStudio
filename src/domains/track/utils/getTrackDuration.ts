import { Layer } from "@schemas/layer";

import { getTrackAssetData } from "./getTrackAssetData";

export const getTrackDuration = (
  track: Layer | undefined
): number | undefined => getTrackAssetData(track)?.duration;
