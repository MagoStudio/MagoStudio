import { Asset } from "@schemas/asset";
import { Layer } from "@schemas/layer";

import { getTrackClip } from "./getTrackClip";

export const getTrackAsset = (track: Layer | undefined): Asset | undefined =>
  getTrackClip(track)?.asset;
