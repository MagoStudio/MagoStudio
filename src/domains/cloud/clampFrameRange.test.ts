import { describe, expect, it } from "vitest";

import { clampFrameRange } from "./clampFrameRange";

describe("clampFrameRange", () => {
  it("keeps a range that fits", () => {
    expect(clampFrameRange([0, 40], 75)).toEqual({
      range: [0, 40],
      clamped: false
    });
  });

  it("clamps a range that runs one frame past the end", () => {
    // The failure observed on staging: a 75-frame source (frames 0..74)
    // submitted as [0, 75] was rejected a second after starting, with nothing
    // recorded about why.
    expect(clampFrameRange([0, 75], 75)).toEqual({
      range: [0, 74],
      clamped: true
    });
  });

  it("allows the last frame itself", () => {
    expect(clampFrameRange([0, 74], 75).clamped).toBe(false);
  });

  it("clamps a start that is past the end too", () => {
    expect(clampFrameRange([200, 300], 75)).toEqual({
      range: [74, 74],
      clamped: true
    });
  });

  it("never returns a negative start", () => {
    expect(clampFrameRange([-5, 10], 75).range).toEqual([0, 10]);
  });

  it("never returns an inverted range", () => {
    expect(clampFrameRange([40, 10], 75).range).toEqual([40, 40]);
  });

  it("floors fractional frames", () => {
    expect(clampFrameRange([1.7, 40.9], 75).range).toEqual([1, 40]);
  });

  it("passes the range through when the frame count is unknown", () => {
    // Guessing at a limit would be worse than trusting the caller.
    for (const frameCount of [null, undefined, 0, -1, Number.NaN]) {
      expect(clampFrameRange([0, 75], frameCount).clamped).toBe(false);
      expect(clampFrameRange([0, 75], frameCount).range).toEqual([0, 75]);
    }
  });
});
