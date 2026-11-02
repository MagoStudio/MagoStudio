import { describe, expect, it } from "vitest";

import { clampRangeToShotLength } from "./clampRangeToShotLength";

describe("clampRangeToShotLength", () => {
  it("leaves a range inside the shot untouched", () => {
    expect(
      clampRangeToShotLength({
        rangeMin: 0,
        rangeMax: 150,
        shotMaxFrames: 200
      })
    ).toBeUndefined();
  });

  it("leaves a range ending exactly at the shot end untouched", () => {
    expect(
      clampRangeToShotLength({
        rangeMin: 0,
        rangeMax: 200,
        shotMaxFrames: 200
      })
    ).toBeUndefined();
  });

  it("pulls an overrunning end back to the shot end", () => {
    expect(
      clampRangeToShotLength({
        rangeMin: 50,
        rangeMax: 400,
        shotMaxFrames: 200
      })
    ).toEqual([50, 200]);
  });

  it("pulls the start back too when it also overruns", () => {
    expect(
      clampRangeToShotLength({
        rangeMin: 300,
        rangeMax: 400,
        shotMaxFrames: 200
      })
    ).toEqual([200, 200]);
  });

  it("does nothing while the shot length is still unknown", () => {
    expect(
      clampRangeToShotLength({
        rangeMin: 0,
        rangeMax: 400,
        shotMaxFrames: 0
      })
    ).toBeUndefined();
  });

  it("does nothing for a negative shot length", () => {
    expect(
      clampRangeToShotLength({
        rangeMin: 0,
        rangeMax: 400,
        shotMaxFrames: -1
      })
    ).toBeUndefined();
  });
});
