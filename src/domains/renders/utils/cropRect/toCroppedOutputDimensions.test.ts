import { describe, expect, it } from "vitest";

import { toCroppedOutputDimensions } from "./toCroppedOutputDimensions";

describe("toCroppedOutputDimensions", () => {
  it("returns the crop's absolute pixel size for a meaningful crop", () => {
    expect(
      toCroppedOutputDimensions({
        crop: { x: 0, y: 0, width: 0.5, height: 1 },
        sourceWidth: 1920,
        sourceHeight: 1080
      })
    ).toEqual({ width: 960, height: 1080 });
  });

  it("rounds fractional pixel sizes to whole numbers", () => {
    expect(
      toCroppedOutputDimensions({
        crop: { x: 0, y: 0, width: 1 / 3, height: 1 },
        sourceWidth: 1920,
        sourceHeight: 1080
      })
    ).toEqual({ width: 640, height: 1080 });
  });

  it("returns the source dimensions unchanged when there is no crop", () => {
    expect(
      toCroppedOutputDimensions({
        crop: undefined,
        sourceWidth: 1920,
        sourceHeight: 1080
      })
    ).toEqual({ width: 1920, height: 1080 });
  });

  it("returns the source dimensions unchanged for a full-frame crop", () => {
    expect(
      toCroppedOutputDimensions({
        crop: { x: 0, y: 0, width: 1, height: 1 },
        sourceWidth: 1920,
        sourceHeight: 1080
      })
    ).toEqual({ width: 1920, height: 1080 });
  });

  it("returns the source dimensions unchanged for a zero-area crop", () => {
    expect(
      toCroppedOutputDimensions({
        crop: { x: 0.5, y: 0.5, width: 0, height: 0 },
        sourceWidth: 1920,
        sourceHeight: 1080
      })
    ).toEqual({ width: 1920, height: 1080 });
  });

  it("returns zero when source dimensions are missing", () => {
    expect(
      toCroppedOutputDimensions({
        crop: { x: 0, y: 0, width: 0.5, height: 1 },
        sourceWidth: undefined,
        sourceHeight: undefined
      })
    ).toEqual({ width: 0, height: 0 });
  });

  it("returns the source dimensions unchanged when a source dimension is zero", () => {
    expect(
      toCroppedOutputDimensions({
        crop: { x: 0, y: 0, width: 0.5, height: 1 },
        sourceWidth: 0,
        sourceHeight: 1080
      })
    ).toEqual({ width: 0, height: 1080 });
  });

  it("honours a crop that flips the aspect ratio to portrait", () => {
    expect(
      toCroppedOutputDimensions({
        crop: { x: 0.4, y: 0, width: 0.2, height: 1 },
        sourceWidth: 1920,
        sourceHeight: 1080
      })
    ).toEqual({ width: 384, height: 1080 });
  });

  it("falls back to source dimensions when a crop rounds a side to zero", () => {
    expect(
      toCroppedOutputDimensions({
        crop: { x: 0, y: 0, width: 0.0001, height: 1 },
        sourceWidth: 100,
        sourceHeight: 1080
      })
    ).toEqual({ width: 100, height: 1080 });
  });
});
