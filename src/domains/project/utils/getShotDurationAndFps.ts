import { getTrackAssetData } from "@domains/track/utils/getTrackAssetData";
import { LayerType } from "@schemas/layer";
import { Shot } from "@schemas/shot";

const DEFAULT_FPS = 24;

export function getShotDurationAndFps(shot: Shot): {
  durationFrames: number;
  fps: number;
} {
  const imageLayer = shot.layers.find(
    (layer) => layer.type === LayerType.IMAGE
  );
  const assetData = getTrackAssetData(imageLayer);

  if (!assetData?.duration) {
    return { durationFrames: 0, fps: DEFAULT_FPS };
  }

  const fps = assetData.fps ?? DEFAULT_FPS;
  const durationFrames = assetData.duration;

  return { durationFrames, fps };
}
