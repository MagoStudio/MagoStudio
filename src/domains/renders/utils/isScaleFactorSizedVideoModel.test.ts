import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { isScaleFactorSizedVideoModel } from "./isScaleFactorSizedVideoModel";

describe("isScaleFactorSizedVideoModel", () => {
  it.each([VideoEngine.v1_0_0_upscaler, VideoEngine.v2_0_0_esrgan_upscaler])(
    "returns true for scale-factor upscaler engine %s",
    (engine) => {
      expect(isScaleFactorSizedVideoModel(engine)).toBe(true);
    }
  );

  it.each([
    VideoEngine.V7_0_0,
    VideoEngine.V8_0_0,
    VideoEngine.v1_0_0_mask,
    VideoEngine.V5_1_0,
    VideoEngine.V4_0_0,
    VideoEngine.kling_o1,
    VideoEngine.kling_3_motion_control,
    VideoEngine.seedance_2,
    VideoEngine.happy_horse_1
  ])("returns false for non-scale-factor engine %s", (engine) => {
    expect(isScaleFactorSizedVideoModel(engine)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isScaleFactorSizedVideoModel(undefined)).toBe(false);
  });

  it("returns false for an unknown string", () => {
    expect(isScaleFactorSizedVideoModel("unknown_engine")).toBe(false);
  });
});
