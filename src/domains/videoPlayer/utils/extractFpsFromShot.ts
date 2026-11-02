import { getTrackAssetData } from "@domains/track/utils/getTrackAssetData";
import { Shot } from "@schemas/shot";

export function extractFpsFromShot(shot: Shot | null): number | null {
  const videoLayer = shot?.layers?.[0];
  const fpsValue = getTrackAssetData(videoLayer)?.fps;

  if (typeof fpsValue !== "number" || fpsValue <= 0) {
    return null;
  }

  return fpsValue;
}
