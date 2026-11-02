import { describe, expect, it } from "vitest";

import { fitWanDimensions, padToMultipleOf16 } from "./wanDimensions";

describe("padToMultipleOf16", () => {
  it("pads a value up to the next multiple of 16", () => {
    expect(padToMultipleOf16(360)).toBe(368);
  });

  it("leaves an already-aligned value unchanged", () => {
    expect(padToMultipleOf16(640)).toBe(640);
  });

  it("never returns less than 16", () => {
    expect(padToMultipleOf16(1)).toBe(16);
  });
});

describe("fitWanDimensions", () => {
  it("fits the long side to max_size while preserving aspect ratio", () => {
    expect(fitWanDimensions(1920, 1080, 640)).toEqual({
      width: 640,
      height: 360
    });
  });

  it("scales a portrait crop by its own long side", () => {
    expect(fitWanDimensions(540, 960, 640)).toEqual({
      width: 360,
      height: 640
    });
  });

  it("scales a cropped region up when it is smaller than max_size", () => {
    expect(fitWanDimensions(128, 128, 640)).toEqual({
      width: 640,
      height: 640
    });
  });

  it("falls back to a square 640 when the size is degenerate", () => {
    expect(fitWanDimensions(0, 100, 640)).toEqual({ width: 640, height: 640 });
  });

  it("falls back to 640 on the long side when max_size is missing", () => {
    expect(fitWanDimensions(1000, 500, undefined)).toEqual({
      width: 640,
      height: 320
    });
  });

  it("returns even dimensions", () => {
    const { width, height } = fitWanDimensions(1001, 333, 640);
    expect(width % 2).toBe(0);
    expect(height % 2).toBe(0);
  });
});
