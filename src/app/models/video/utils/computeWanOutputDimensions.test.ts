import { describe, expect, it } from "vitest";

import { computeWanOutputDimensions } from "./computeWanOutputDimensions";

describe("computeWanOutputDimensions", () => {
  it("preserves a landscape aspect ratio with the longest side at maxSize", () => {
    expect(computeWanOutputDimensions(1920, 1080, 640)).toEqual({
      width: 640,
      height: 360
    });
  });

  it("preserves a portrait aspect ratio with the longest side at maxSize", () => {
    expect(computeWanOutputDimensions(1080, 1920, 640)).toEqual({
      width: 360,
      height: 640
    });
  });

  it("rounds non-integer results to the nearest even number", () => {
    expect(computeWanOutputDimensions(1280, 719, 640)).toEqual({
      width: 640,
      height: 360
    });
  });

  it("falls back to a square when input dimensions are unavailable", () => {
    expect(computeWanOutputDimensions(undefined, undefined, 640)).toEqual({
      width: 640,
      height: 640
    });
  });

  it("falls back to a 640 default when maxSize is missing", () => {
    expect(computeWanOutputDimensions(1920, 1080, undefined)).toEqual({
      width: 640,
      height: 360
    });
  });

  it("leaves an already-square input square", () => {
    expect(computeWanOutputDimensions(1000, 1000, 1280)).toEqual({
      width: 1280,
      height: 1280
    });
  });
});
