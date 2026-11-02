import { Layer } from "@schemas/layer";

import { getTrackAssetData } from "./getTrackAssetData";

export const getTrackErrorMessage = (
  track: Layer | undefined
): string | undefined => getTrackAssetData(track)?.error?.error;
