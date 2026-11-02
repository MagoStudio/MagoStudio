import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { isKlingModel } from "./isKlingModel";

describe("isKlingModel", () => {
  it.each([
    VideoEngine.kling_o1,
    VideoEngine.kling_2_6_motion_control,
    VideoEngine.kling_3_motion_control,
    VideoEngine.kling_o3_edit_pro
  ])("returns true for Kling engine %s", (engine) => {
    expect(isKlingModel(engine)).toBe(true);
  });

  it.each([
    VideoEngine.V4_0_0,
    VideoEngine.V5_1_0,
    VideoEngine.v1_0_0_mask,
    VideoEngine.v1_0_0_upscaler,
    VideoEngine.v2_0_0_esrgan_upscaler,
    VideoEngine.seedance_2,
    VideoEngine.happy_horse_1
  ])("returns false for non-Kling engine %s", (engine) => {
    expect(isKlingModel(engine)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isKlingModel(undefined)).toBe(false);
  });

  it("returns false for an unknown string", () => {
    expect(isKlingModel("unknown_engine")).toBe(false);
  });
});
