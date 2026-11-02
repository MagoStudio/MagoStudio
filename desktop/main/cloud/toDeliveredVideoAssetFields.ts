import { RenderedVideoMetadata } from "./parseRenderedVideoMetadata";

const MS_PER_SECOND = 1000;
const FPS_SCALE = 1000;

export interface DeliveredVideoAssetFields {
  frameCount: number;
  fps?: number;
  duration?: number;
  width?: number;
  height?: number;
}

export const toDeliveredVideoAssetFields = (
  deliveredVideo: RenderedVideoMetadata,
  registeredFps: unknown
): DeliveredVideoAssetFields => {
  const isRegisteredFpsUsable =
    typeof registeredFps === "number" && registeredFps > 0;
  const deliveredFps =
    deliveredVideo.fps ?? (isRegisteredFpsUsable ? registeredFps : null);
  const hasDeliveredDimensions =
    !!deliveredVideo.width && !!deliveredVideo.height;
  return {
    frameCount: deliveredVideo.frameCount,
    ...(deliveredFps
      ? {
          fps: Math.round(deliveredFps * FPS_SCALE),
          duration: Math.round(
            (deliveredVideo.frameCount / deliveredFps) * MS_PER_SECOND
          )
        }
      : {}),
    ...(hasDeliveredDimensions
      ? { width: deliveredVideo.width!, height: deliveredVideo.height! }
      : {})
  };
};
