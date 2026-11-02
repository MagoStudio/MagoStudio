import { describe, expect, it } from "vitest";

import { getPaddingFramePlan } from "./getPaddingFramePlan";

describe("getPaddingFramePlan", () => {
  it("pads a short clip up to round(minSeconds*fps) frames with a black tail", () => {
    expect(getPaddingFramePlan(2, 25, 3.2)).toEqual({
      totalFrames: 80,
      sourceFrameCount: 50
    });
  });

  it("adds no black frames when the source already fills the window", () => {
    expect(getPaddingFramePlan(3.2, 25, 3.2)).toEqual({
      totalFrames: 80,
      sourceFrameCount: 80
    });
  });

  it("never sources more frames than the total (longer source is truncated)", () => {
    expect(getPaddingFramePlan(10, 25, 3.2)).toEqual({
      totalFrames: 80,
      sourceFrameCount: 80
    });
  });

  it("rounds the total frame count half-up at the target duration", () => {
    expect(getPaddingFramePlan(0, 24, 3.2).totalFrames).toBe(77);
    expect(getPaddingFramePlan(0, 23, 3.2).totalFrames).toBe(74);
    expect(getPaddingFramePlan(0, 26, 3.2).totalFrames).toBe(83);
  });
});
