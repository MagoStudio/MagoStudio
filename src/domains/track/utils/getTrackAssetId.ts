import { Layer } from "@schemas/layer";

import { getTrackClip } from "./getTrackClip";

export const getTrackAssetId = (track: Layer | undefined): string | undefined =>
  getTrackClip(track)?.asset_id;
