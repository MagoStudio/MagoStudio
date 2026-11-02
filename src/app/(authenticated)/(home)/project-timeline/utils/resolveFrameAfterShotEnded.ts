import { type ProjectTimelinePlaybackFrameResult } from "./resolveFrameAfterPlaybackTick";

interface ResolveFrameAfterShotEndedArgs {
  shotStartFrame: number;
  shotDurationFrames: number;
  totalDurationFrames: number;
}

export function resolveFrameAfterShotEnded({
  shotStartFrame,
  shotDurationFrames,
  totalDurationFrames
}: ResolveFrameAfterShotEndedArgs): ProjectTimelinePlaybackFrameResult {
  const candidateNextFrame = shotStartFrame + shotDurationFrames;

  if (candidateNextFrame >= totalDurationFrames) {
    return { nextFrame: 0, shouldPausePlayback: true };
  }

  return { nextFrame: candidateNextFrame, shouldPausePlayback: false };
}
