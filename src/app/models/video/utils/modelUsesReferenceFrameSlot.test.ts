import { RENDER_MODELS } from "@models/video/constants";
import { VideoEngine } from "@models/video/types";
import { describe, it, expect } from "vitest";

import { kling3_0MotionControlModel } from "../kling3_0MotionControlModel";
import { magoV3_4_0RenderModel } from "../magoV3_4_0VideoModel";
import { magoV5_0_0RenderModel } from "../magoV5_0_0VideoModel";

import { modelUsesReferenceFrameSlot } from "./modelUsesReferenceFrameSlot";

describe("modelUsesReferenceFrameSlot", () => {
  it("returns false for MAGO V3.4.0 (key-frame slot only after removing the additional reference image slot)", () => {
    expect(modelUsesReferenceFrameSlot(magoV3_4_0RenderModel)).toBe(false);
  });

  it("returns false for MAGO V5.0.0 (key-frame slot only)", () => {
    expect(modelUsesReferenceFrameSlot(magoV5_0_0RenderModel)).toBe(false);
  });

  it("returns false for Kling 3.0 Motion Control (TwoAngleImageUploader binds to values, not sources)", () => {
    expect(modelUsesReferenceFrameSlot(kling3_0MotionControlModel)).toBe(false);
  });

  it.each(RENDER_MODELS)(
    "is true only for v5.1.0 Inpainting across the whole registry: $name",
    (model) => {
      const expected = model.name === VideoEngine.V5_1_0;
      expect(modelUsesReferenceFrameSlot(model)).toBe(expected);
    }
  );
});
