import { Layer } from "@schemas/layer";

import { getTrackClip } from "./getTrackClip";
import { getTrackSources } from "./getTrackSources";

export const getTrackInputVideoId = (
  track: Layer | undefined
): string | undefined => {
  const assetVideo = getTrackSources(track)?.video;
  return typeof assetVideo === "string"
    ? assetVideo
    : getTrackClip(track)?.data?.sources?.video;
};
