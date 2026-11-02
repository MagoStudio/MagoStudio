export interface ProjectTimelinePlaybackFrameResult {
  nextFrame: number;
  shouldPausePlayback: boolean;
}

interface ResolveFrameAfterPlaybackTickArgs {
  shotStartFrame: number;
  shotDurationFrames: number;
  localFrame: number;
  totalDurationFrames: number;
}

export function resolveFrameAfterPlaybackTick({
  shotStartFrame,
  shotDurationFrames,
  localFrame,
  totalDurationFrames
}: ResolveFrameAfterPlaybackTickArgs): ProjectTimelinePlaybackFrameResult {
  const globalFrame = shotStartFrame + localFrame;

  if (globalFrame >= totalDurationFrames - 1) {
    return { nextFrame: 0, shouldPausePlayback: true };
  }

  if (localFrame >= shotDurationFrames) {
    return {
      nextFrame: shotStartFrame + shotDurationFrames,
      shouldPausePlayback: false
    };
  }

  return { nextFrame: globalFrame, shouldPausePlayback: false };
}
