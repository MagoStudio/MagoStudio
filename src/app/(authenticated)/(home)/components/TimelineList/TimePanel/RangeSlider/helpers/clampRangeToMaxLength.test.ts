import { describe, expect, it } from "vitest";

import { clampRangeToMaxLength } from "./clampRangeToMaxLength";

describe("clampRangeToMaxLength", () => {
  it("leaves a range within the maximum untouched", () => {
    expect(
      clampRangeToMaxLength({
        rangeMin: 0,
        rangeMax: 100,
        maxRangeLength: 300,
        shotMaxFrames: 1000
      })
    ).toBeUndefined();
  });

  it("leaves a range exactly at the maximum untouched", () => {
    expect(
      clampRangeToMaxLength({
        rangeMin: 0,
        rangeMax: 300,
        maxRangeLength: 300,
        shotMaxFrames: 1000
      })
    ).toBeUndefined();
  });

  it("shortens the end to the maximum length", () => {
    expect(
      clampRangeToMaxLength({
        rangeMin: 10,
        rangeMax: 500,
        maxRangeLength: 300,
        shotMaxFrames: 1000
      })
    ).toEqual([10, 310]);
  });

  it("never extends past the end of the shot", () => {
    expect(
      clampRangeToMaxLength({
        rangeMin: 900,
        rangeMax: 1500,
        maxRangeLength: 300,
        shotMaxFrames: 1000
      })
    ).toEqual([900, 1000]);
  });

  it("does not clamp a full-clip range that fits the maximum", () => {
    expect(
      clampRangeToMaxLength({
        rangeMin: 0,
        rangeMax: 1000,
        maxRangeLength: 1000,
        shotMaxFrames: 1000
      })
    ).toBeUndefined();
  });

  it("clamps to the shot end when the max length would overrun a short shot", () => {
    expect(
      clampRangeToMaxLength({
        rangeMin: 0,
        rangeMax: 1000,
        maxRangeLength: 300,
        shotMaxFrames: 300
      })
    ).toEqual([0, 300]);
  });
});
