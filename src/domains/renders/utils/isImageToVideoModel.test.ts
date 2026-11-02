import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { isImageToVideoModel } from "./isImageToVideoModel";

describe("isImageToVideoModel", () => {
  it.each([VideoEngine.seedance_2_i2v, VideoEngine.seedance_2_i2v_fast])(
    "returns true for image-to-video engine %s",
    (engine) => {
      expect(isImageToVideoModel(engine)).toBe(true);
    }
  );

  it.each([
    VideoEngine.seedance_2,
    VideoEngine.v1_0_0_mask,
    VideoEngine.V5_1_0,
    VideoEngine.kling_o1,
    VideoEngine.kling_3_motion_control,
    VideoEngine.V4_0_0,
    VideoEngine.happy_horse_1,
    VideoEngine.v1_0_0_upscaler,
    VideoEngine.v2_0_0_esrgan_upscaler
  ])("returns false for non-image-to-video engine %s", (engine) => {
    expect(isImageToVideoModel(engine)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isImageToVideoModel(undefined)).toBe(false);
  });

  it("returns false for an unknown string", () => {
    expect(isImageToVideoModel("unknown_engine")).toBe(false);
  });
});
