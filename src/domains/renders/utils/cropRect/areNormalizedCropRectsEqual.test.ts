import { describe, expect, it } from "vitest";

import { areNormalizedCropRectsEqual } from "./areNormalizedCropRectsEqual";

const crop = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };

describe("areNormalizedCropRectsEqual", () => {
  it("treats identical rects as equal", () => {
    expect(areNormalizedCropRectsEqual(crop, { ...crop })).toBe(true);
  });

  it("tolerates the rounding drift of an absolute-pixel round trip", () => {
    expect(areNormalizedCropRectsEqual(crop, { ...crop, x: 0.2504 })).toBe(
      true
    );
  });

  it("treats a moved handle as different", () => {
    expect(areNormalizedCropRectsEqual(crop, { ...crop, x: 0.3 })).toBe(false);
  });

  it("treats two absent rects as equal and one absent rect as different", () => {
    expect(areNormalizedCropRectsEqual(undefined, undefined)).toBe(true);
    expect(areNormalizedCropRectsEqual(crop, undefined)).toBe(false);
    expect(areNormalizedCropRectsEqual(undefined, crop)).toBe(false);
  });
});
