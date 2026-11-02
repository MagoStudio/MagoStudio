import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { isMaskModel } from "./isMaskModel";

describe("isMaskModel", () => {
  it("returns true for the SAM3 Mask engine", () => {
    expect(isMaskModel(VideoEngine.v1_0_0_mask)).toBe(true);
  });

  it.each([
    VideoEngine.V5_1_0,
    VideoEngine.v1_0_0_upscaler,
    VideoEngine.v2_0_0_esrgan_upscaler,
    VideoEngine.kling_o1,
    VideoEngine.kling_o3_edit_pro,
    VideoEngine.V4_0_0,
    VideoEngine.seedance_2,
    VideoEngine.happy_horse_1
  ])("returns false for non-mask engine %s", (engine) => {
    expect(isMaskModel(engine)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isMaskModel(undefined)).toBe(false);
  });

  it("returns false for an unknown string", () => {
    expect(isMaskModel("unknown_engine")).toBe(false);
  });
});
