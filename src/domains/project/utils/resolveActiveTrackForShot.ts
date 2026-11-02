import { getTrackClip } from "@domains/track/utils/getTrackClip";
import { Clip } from "@schemas/clip";
import { LayerType } from "@schemas/layer";
import { Shot } from "@schemas/shot";

interface ResolvedTrack {
  clip: Clip | undefined;
  trackId: string | undefined;
  isBlank: boolean;
  layerName: string | undefined;
}

export function resolveActiveTrackForShot(
  shot: Shot,
  trackType: "source" | "pinned",
  pinnedTrackIds: Record<string, string>
): ResolvedTrack {
  const imageLayer = shot.layers.find((l) => l.type === LayerType.IMAGE);

  if (trackType === "source") {
    const clip = getTrackClip(imageLayer);
    return {
      clip,
      trackId: imageLayer?.id,
      isBlank: !clip,
      layerName: imageLayer?.name
    };
  }

  const pinnedLayerId = pinnedTrackIds[shot.id];

  if (pinnedLayerId) {
    const pinnedLayer = shot.layers.find(
      (l) => l.id === pinnedLayerId && l.type === LayerType.RENDER
    );
    const clip = getTrackClip(pinnedLayer);
    if (clip)
      return {
        clip,
        trackId: pinnedLayer?.id,
        isBlank: false,
        layerName: pinnedLayer?.name
      };
  }

  return {
    clip: undefined,
    trackId: undefined,
    isBlank: true,
    layerName: undefined
  };
}
