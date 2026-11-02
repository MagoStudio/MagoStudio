import { SHOT_FPS } from "./snapShotFrames";

interface ResolveCutPlaybackFrameArgs {
  clipStartFrame: number;
  clipDurationFrames: number;
  videoCurrentTimeSeconds: number;
}

export const resolveCutPlaybackFrame = ({
  clipStartFrame,
  clipDurationFrames,
  videoCurrentTimeSeconds
}: ResolveCutPlaybackFrameArgs): number => {
  const localFrame = Math.round(videoCurrentTimeSeconds * SHOT_FPS);
  const clampedLocalFrame = Math.min(
    Math.max(0, localFrame),
    Math.max(0, clipDurationFrames - 1)
  );

  return clipStartFrame + clampedLocalFrame;
};
