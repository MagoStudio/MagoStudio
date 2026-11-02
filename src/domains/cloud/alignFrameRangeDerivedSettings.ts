import { getDurationFromFrameRange } from "@domains/renders/utils/getDurationFromFrameRange";

export const alignFrameRangeDerivedSettings = (
  settings: Record<string, unknown>,
  frameRange: readonly [number, number],
  fps: number
): Record<string, unknown> => {
  const [firstFrame, lastFrame] = frameRange;
  return {
    ...settings,
    ...(Object.hasOwn(settings, "frame_range")
      ? { frame_range: [firstFrame, lastFrame] }
      : {}),
    ...(Object.hasOwn(settings, "durationInSeconds")
      ? { durationInSeconds: getDurationFromFrameRange([...frameRange], fps) }
      : {}),
    ...(Object.hasOwn(settings, "frameRangeSeconds")
      ? { frameRangeSeconds: [firstFrame / fps, lastFrame / fps] }
      : {}),
    ...(Object.hasOwn(settings, "offsetInSeconds")
      ? { offsetInSeconds: firstFrame / fps }
      : {})
  };
};
