import { describe, expect, it } from "vitest";

import { buildShotFrameRange } from "./buildShotFrameRange";
import { snapShotSecondsToFrames } from "./snapShotFrames";

describe("buildShotFrameRange", () => {
  it("ends one before the frame count, because both ends are inclusive", () => {
    expect(buildShotFrameRange(73)).toEqual([0, 72]);
  });

  it("spans exactly the number of frames asked for", () => {
    const [firstFrame, lastFrame] = buildShotFrameRange(73);

    expect(lastFrame - firstFrame + 1).toBe(73);
  });

  it("matches what the backend derives from a shot's own duration", () => {
    const framesForThreeSeconds = snapShotSecondsToFrames(3);

    expect(buildShotFrameRange(framesForThreeSeconds)).toEqual([
      0,
      framesForThreeSeconds - 1
    ]);
  });

  it("never returns a negative end frame", () => {
    expect(buildShotFrameRange(0)).toEqual([0, 0]);
  });
});
