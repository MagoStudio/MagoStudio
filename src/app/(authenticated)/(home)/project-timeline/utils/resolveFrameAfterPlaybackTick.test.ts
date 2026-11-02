import { describe, expect, it } from "vitest";

import { resolveFrameAfterPlaybackTick } from "./resolveFrameAfterPlaybackTick";

describe("resolveFrameAfterPlaybackTick", () => {
  it("advances within a shot when the local frame is still inside it", () => {
    expect(
      resolveFrameAfterPlaybackTick({
        shotStartFrame: 10,
        shotDurationFrames: 20,
        localFrame: 5,
        totalDurationFrames: 100
      })
    ).toEqual({ nextFrame: 15, shouldPausePlayback: false });
  });

  it("advances to the next shot's start frame when the local frame crosses the shot boundary", () => {
    expect(
      resolveFrameAfterPlaybackTick({
        shotStartFrame: 0,
        shotDurationFrames: 10,
        localFrame: 10,
        totalDurationFrames: 100
      })
    ).toEqual({ nextFrame: 10, shouldPausePlayback: false });
  });

  it("resets to frame 0 and pauses when the tick reaches the final frame of the timeline", () => {
    expect(
      resolveFrameAfterPlaybackTick({
        shotStartFrame: 90,
        shotDurationFrames: 10,
        localFrame: 9,
        totalDurationFrames: 100
      })
    ).toEqual({ nextFrame: 0, shouldPausePlayback: true });
  });

  it("resets to frame 0 and pauses when the tick overshoots past the final frame", () => {
    expect(
      resolveFrameAfterPlaybackTick({
        shotStartFrame: 90,
        shotDurationFrames: 10,
        localFrame: 15,
        totalDurationFrames: 100
      })
    ).toEqual({ nextFrame: 0, shouldPausePlayback: true });
  });

  it("resets on a single-shot timeline once the shot's last frame is reached", () => {
    expect(
      resolveFrameAfterPlaybackTick({
        shotStartFrame: 0,
        shotDurationFrames: 50,
        localFrame: 49,
        totalDurationFrames: 50
      })
    ).toEqual({ nextFrame: 0, shouldPausePlayback: true });
  });

  it("keeps advancing mid-shot on a single-shot timeline before the last frame", () => {
    expect(
      resolveFrameAfterPlaybackTick({
        shotStartFrame: 0,
        shotDurationFrames: 50,
        localFrame: 25,
        totalDurationFrames: 50
      })
    ).toEqual({ nextFrame: 25, shouldPausePlayback: false });
  });

  it("resets immediately on a zero-length timeline", () => {
    expect(
      resolveFrameAfterPlaybackTick({
        shotStartFrame: 0,
        shotDurationFrames: 0,
        localFrame: 0,
        totalDurationFrames: 0
      })
    ).toEqual({ nextFrame: 0, shouldPausePlayback: true });
  });
});
