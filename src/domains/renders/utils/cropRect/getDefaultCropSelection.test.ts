import { describe, expect, it } from "vitest";

import { getDefaultCropSelection } from "./getDefaultCropSelection";
import { hasPositiveCropArea } from "./hasPositiveCropArea";
import { isFullFrameCropRect } from "./isFullFrameCropRect";

describe("getDefaultCropSelection", () => {
  it("is centred on the frame", () => {
    const crop = getDefaultCropSelection();
    expect(crop.x + crop.width / 2).toBeCloseTo(0.5, 5);
    expect(crop.y + crop.height / 2).toBeCloseTo(0.5, 5);
  });

  it("covers half the frame's width and height", () => {
    const crop = getDefaultCropSelection();
    expect(crop.width).toBe(0.5);
    expect(crop.height).toBe(0.5);
  });

  it("is a valid, non-full-frame selection", () => {
    const crop = getDefaultCropSelection();
    expect(hasPositiveCropArea({ crop })).toBe(true);
    expect(isFullFrameCropRect({ crop })).toBe(false);
  });
});
