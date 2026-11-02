import { VideoSettings } from "@models/video/types";
import { Layer } from "@schemas/layer";

import { getTrackClip } from "./getTrackClip";

export const getTrackRenderSettings = (
  track: Layer | undefined
): VideoSettings | undefined =>
  getTrackClip(track)?.asset?.data?.data?.render_settings?.magov2 as
    | VideoSettings
    | undefined;
