import { describe, expect, it } from "vitest";

import { clampRangeToMinLength } from "./clampRangeToMinLength";

describe("clampRangeToMinLength", () => {
  it("leaves a range that already meets the minimum untouched", () => {
    expect(
      clampRangeToMinLength({
        rangeMin: 10,
        rangeMax: 40,
        minRangeLength: 24,
        shotMaxFrames: 200
      })
    ).toBeUndefined();
  });

  it("leaves a range exactly at the minimum untouched", () => {
    expect(
      clampRangeToMinLength({
        rangeMin: 10,
        rangeMax: 34,
        minRangeLength: 24,
        shotMaxFrames: 200
      })
    ).toBeUndefined();
  });

  it("extends the end when there is room in the shot", () => {
    expect(
      clampRangeToMinLength({
        rangeMin: 10,
        rangeMax: 15,
        minRangeLength: 24,
        shotMaxFrames: 200
      })
    ).toEqual([10, 34]);
  });

  it("extends to exactly the shot end when the minimum just fits", () => {
    expect(
      clampRangeToMinLength({
        rangeMin: 176,
        rangeMax: 180,
        minRangeLength: 24,
        shotMaxFrames: 200
      })
    ).toEqual([176, 200]);
  });

  it("shifts the start earlier when extending would overrun the shot", () => {
    expect(
      clampRangeToMinLength({
        rangeMin: 190,
        rangeMax: 195,
        minRangeLength: 24,
        shotMaxFrames: 200
      })
    ).toEqual([176, 200]);
  });

  it("floors the shifted start at zero when the shot is shorter than the minimum", () => {
    expect(
      clampRangeToMinLength({
        rangeMin: 5,
        rangeMax: 8,
        minRangeLength: 24,
        shotMaxFrames: 20
      })
    ).toEqual([0, 20]);
  });

  it("reports no change when the range is already the shifted result", () => {
    expect(
      clampRangeToMinLength({
        rangeMin: 0,
        rangeMax: 20,
        minRangeLength: 24,
        shotMaxFrames: 20
      })
    ).toBeUndefined();
  });
});
