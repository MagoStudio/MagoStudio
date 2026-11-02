import { VideoSettings } from "@models/video/types";
import { Layer } from "@schemas/layer";

import { getTrackClip } from "./getTrackClip";

/**
 * Desktop cloud jobs persist settings on the clip as well as the asset. The
 * clip copy lets older/interrupted jobs reuse their settings even if a failure
 * status overwrote the asset metadata.
 */
export const getTrackRenderSettings = (
  track: Layer | undefined
): VideoSettings | undefined => {
  const clip = getTrackClip(track);
  return (clip?.asset?.data?.data?.render_settings?.magov2 ??
    clip?.data?.settings) as VideoSettings | undefined;
};
