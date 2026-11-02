import { Layer } from "@schemas/layer";

import { getTrackClip } from "./getTrackClip";

export const getTrackSources = (track: Layer | undefined) =>
  getTrackClip(track)?.asset?.data?.data?.sources;
