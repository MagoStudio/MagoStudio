import { describe, expect, it } from "vitest";

import { resolveFrameAfterShotEnded } from "./resolveFrameAfterShotEnded";

describe("resolveFrameAfterShotEnded", () => {
  it("resets to frame 0 and pauses when the final shot ends", () => {
    expect(
      resolveFrameAfterShotEnded({
        shotStartFrame: 80,
        shotDurationFrames: 20,
        totalDurationFrames: 100
      })
    ).toEqual({ nextFrame: 0, shouldPausePlayback: true });
  });

  it("advances to the next shot's start frame and keeps playing when a non-final shot ends", () => {
    expect(
      resolveFrameAfterShotEnded({
        shotStartFrame: 0,
        shotDurationFrames: 30,
        totalDurationFrames: 100
      })
    ).toEqual({ nextFrame: 30, shouldPausePlayback: false });
  });

  it("resets on a single-shot timeline whose only shot just ended", () => {
    expect(
      resolveFrameAfterShotEnded({
        shotStartFrame: 0,
        shotDurationFrames: 50,
        totalDurationFrames: 50
      })
    ).toEqual({ nextFrame: 0, shouldPausePlayback: true });
  });
});
