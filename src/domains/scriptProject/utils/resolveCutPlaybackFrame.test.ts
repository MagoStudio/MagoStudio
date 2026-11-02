import { describe, expect, it } from "vitest";

import { resolveCutPlaybackFrame } from "./resolveCutPlaybackFrame";

describe("resolveCutPlaybackFrame", () => {
  it("places the video's own time inside the clip's stretch of the cut", () => {
    expect(
      resolveCutPlaybackFrame({
        clipStartFrame: 48,
        clipDurationFrames: 72,
        videoCurrentTimeSeconds: 1
      })
    ).toBe(72);
  });

  it("holds a video that overruns its measured length at the clip's last frame", () => {
    expect(
      resolveCutPlaybackFrame({
        clipStartFrame: 48,
        clipDurationFrames: 72,
        videoCurrentTimeSeconds: 10
      })
    ).toBe(48 + 71);
  });

  it("never falls behind the clip's own start", () => {
    expect(
      resolveCutPlaybackFrame({
        clipStartFrame: 48,
        clipDurationFrames: 72,
        videoCurrentTimeSeconds: -1
      })
    ).toBe(48);
  });
});
