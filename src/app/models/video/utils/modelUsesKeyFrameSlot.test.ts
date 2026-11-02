import { describe, it, expect } from "vitest";

import { klingO1Model } from "../klingO1Model";
import { magoV3_4_0RenderModel } from "../magoV3_4_0VideoModel";
import { seedance2Model } from "../seedance2Model";

import { modelUsesKeyFrameSlot } from "./modelUsesKeyFrameSlot";

describe("modelUsesKeyFrameSlot", () => {
  it("returns true for MAGO V3.4.0 (uses FileUploaderWithStylizeButton)", () => {
    expect(modelUsesKeyFrameSlot(magoV3_4_0RenderModel)).toBe(true);
  });

  it("returns false for Seedance 2.0", () => {
    expect(modelUsesKeyFrameSlot(seedance2Model)).toBe(false);
  });

  it("returns false for Kling O1", () => {
    expect(modelUsesKeyFrameSlot(klingO1Model)).toBe(false);
  });
});
