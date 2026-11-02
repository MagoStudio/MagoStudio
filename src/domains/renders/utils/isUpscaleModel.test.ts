import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { isUpscaleModel } from "./isUpscaleModel";

describe("isUpscaleModel", () => {
  it.each([
    VideoEngine.v1_0_0_upscaler,
    VideoEngine.v2_0_0_esrgan_upscaler,
    VideoEngine.V7_0_0
  ])("returns true for upscaler engine %s", (engine) => {
    expect(isUpscaleModel(engine)).toBe(true);
  });

  it.each([
    VideoEngine.v1_0_0_mask,
    VideoEngine.V5_1_0,
    VideoEngine.kling_o1,
    VideoEngine.kling_3_motion_control,
    VideoEngine.V4_0_0,
    VideoEngine.V8_0_0,
    VideoEngine.seedance_2,
    VideoEngine.happy_horse_1
  ])("returns false for non-upscaler engine %s", (engine) => {
    expect(isUpscaleModel(engine)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isUpscaleModel(undefined)).toBe(false);
  });

  it("returns false for an unknown string", () => {
    expect(isUpscaleModel("unknown_engine")).toBe(false);
  });
});
