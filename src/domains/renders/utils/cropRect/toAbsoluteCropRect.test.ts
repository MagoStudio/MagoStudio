import { describe, expect, it } from "vitest";

import { toAbsoluteCropRect } from "./toAbsoluteCropRect";
import { toNormalizedCropRect } from "./toNormalizedCropRect";

describe("toAbsoluteCropRect", () => {
  it("converts a normalized rect to absolute source pixels", () => {
    const result = toAbsoluteCropRect({
      crop: { x: 0.5, y: 0, width: 0.5, height: 1 },
      sourceWidth: 1920,
      sourceHeight: 1080
    });

    expect(result).toEqual({
      topLeft: [960, 0],
      bottomRight: [1920, 1080]
    });
  });

  it("rounds a fractional pixel value to the nearest integer", () => {
    const result = toAbsoluteCropRect({
      crop: { x: 0.1, y: 0.1, width: 0.3, height: 0.3 },
      sourceWidth: 1001,
      sourceHeight: 1001
    });

    expect(Number.isInteger(result.topLeft[0])).toBe(true);
    expect(Number.isInteger(result.topLeft[1])).toBe(true);
    expect(Number.isInteger(result.bottomRight[0])).toBe(true);
    expect(Number.isInteger(result.bottomRight[1])).toBe(true);
  });

  it("clamps bottom_right so it never exceeds the source dimensions", () => {
    const result = toAbsoluteCropRect({
      crop: { x: 0.9, y: 0.9, width: 0.3, height: 0.3 },
      sourceWidth: 1000,
      sourceHeight: 1000
    });

    expect(result.bottomRight).toEqual([1000, 1000]);
  });

  it("round-trips normalize -> absolute -> normalize", () => {
    const original = { x: 0.25, y: 0.1, width: 0.5, height: 0.6 };
    const absolute = toAbsoluteCropRect({
      crop: original,
      sourceWidth: 1920,
      sourceHeight: 1080
    });
    const roundTripped = toNormalizedCropRect({
      crop: absolute,
      sourceWidth: 1920,
      sourceHeight: 1080
    });

    expect(roundTripped.x).toBeCloseTo(original.x, 2);
    expect(roundTripped.y).toBeCloseTo(original.y, 2);
    expect(roundTripped.width).toBeCloseTo(original.width, 2);
    expect(roundTripped.height).toBeCloseTo(original.height, 2);
  });
});
