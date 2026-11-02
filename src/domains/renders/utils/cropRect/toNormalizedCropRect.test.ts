import { describe, expect, it } from "vitest";

import { toNormalizedCropRect } from "./toNormalizedCropRect";

describe("toNormalizedCropRect", () => {
  it("converts absolute source pixels to a normalized rect", () => {
    const result = toNormalizedCropRect({
      crop: { topLeft: [360, 0], bottomRight: [1920, 1080] },
      sourceWidth: 1920,
      sourceHeight: 1080
    });

    expect(result.x).toBeCloseTo(0.1875, 4);
    expect(result.y).toBe(0);
    expect(result.width).toBeCloseTo(0.8125, 4);
    expect(result.height).toBe(1);
  });

  it("detects a full-frame absolute rect as covering the entire frame", () => {
    const result = toNormalizedCropRect({
      crop: { topLeft: [0, 0], bottomRight: [1920, 1080] },
      sourceWidth: 1920,
      sourceHeight: 1080
    });

    expect(result).toEqual({ x: 0, y: 0, width: 1, height: 1 });
  });
});
