import { describe, expect, it } from "vitest";

import { getAdjustedFrameRange } from "./getAdjustedFrameRange";

describe("getAdjustedFrameRange", () => {
  it("does not expand a range whose span already equals the minimum count", () => {
    expect(
      getAdjustedFrameRange({
        trackRange: [0, 23],
        shotMaxFrames: 200,
        minFrames: 24,
        isInterpolationEnabled: true
      })
    ).toEqual([0, 23]);
  });

  it("does not expand magoV2_5_0's 15-frame minimum when the span already meets it", () => {
    expect(
      getAdjustedFrameRange({
        trackRange: [0, 14],
        shotMaxFrames: 200,
        minFrames: 15,
        isInterpolationEnabled: true
      })
    ).toEqual([0, 14]);
  });

  it("expands a too-short range to exactly the minimum count", () => {
    expect(
      getAdjustedFrameRange({
        trackRange: [0, 20],
        shotMaxFrames: 200,
        minFrames: 24,
        isInterpolationEnabled: true
      })
    ).toEqual([0, 23]);
  });

  it("expands a range exactly one frame under the minimum", () => {
    expect(
      getAdjustedFrameRange({
        trackRange: [0, 22],
        shotMaxFrames: 200,
        minFrames: 24,
        isInterpolationEnabled: true
      })
    ).toEqual([0, 23]);
  });

  it("takes the forward-expansion branch when the expansion lands exactly on shotMaxFrames", () => {
    expect(
      getAdjustedFrameRange({
        trackRange: [77, 90],
        shotMaxFrames: 100,
        minFrames: 24,
        isInterpolationEnabled: true
      })
    ).toEqual([77, 100]);
  });

  it("does not expand when interpolation is disabled", () => {
    expect(
      getAdjustedFrameRange({
        trackRange: [0, 10],
        shotMaxFrames: 200,
        minFrames: 24,
        isInterpolationEnabled: false
      })
    ).toEqual([0, 10]);
  });

  it("clamps the range to shotMaxFrames even without interpolation", () => {
    expect(
      getAdjustedFrameRange({
        trackRange: [10, 50],
        shotMaxFrames: 30,
        minFrames: 24,
        isInterpolationEnabled: false
      })
    ).toEqual([10, 30]);
  });

  it("shifts the start when expanding to the minimum would exceed shotMaxFrames", () => {
    expect(
      getAdjustedFrameRange({
        trackRange: [95, 100],
        shotMaxFrames: 100,
        minFrames: 24,
        isInterpolationEnabled: true
      })
    ).toEqual([77, 100]);
  });
});
