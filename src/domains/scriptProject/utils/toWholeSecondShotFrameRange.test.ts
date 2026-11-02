import { describe, expect, it } from "vitest";

import { SHOT_FPS } from "./snapShotFrames";
import { toWholeSecondShotFrameRange } from "./toWholeSecondShotFrameRange";

describe("toWholeSecondShotFrameRange", () => {
  it("ends the range a whole number of seconds after its start", () => {
    expect(toWholeSecondShotFrameRange([0, 5 * SHOT_FPS - 1])).toEqual([
      0,
      5 * SHOT_FPS
    ]);
  });

  it("rounds a part second to the nearest whole second", () => {
    expect(
      toWholeSecondShotFrameRange([10, 10 + 4 * SHOT_FPS + SHOT_FPS / 4])
    ).toEqual([10, 10 + 4 * SHOT_FPS]);
  });
});
