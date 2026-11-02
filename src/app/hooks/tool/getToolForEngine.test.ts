import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { getToolForEngine } from "./getToolForEngine";

describe("getToolForEngine", () => {
  it("returns render-video for undefined", () => {
    expect(getToolForEngine(undefined)).toBe("render-video");
  });

  it("returns mask for a mask engine", () => {
    expect(getToolForEngine(VideoEngine.v1_0_0_mask)).toBe("mask");
  });

  it.each([
    VideoEngine.v1_0_0_upscaler,
    VideoEngine.v2_0_0_esrgan_upscaler,
    VideoEngine.V7_0_0
  ])("returns upscale for upscaler engine %s", (engine) => {
    expect(getToolForEngine(engine)).toBe("upscale");
  });

  it("returns render-video for Mago Clean Plate (v8.0.0)", () => {
    expect(getToolForEngine(VideoEngine.V8_0_0)).toBe("render-video");
  });

  it.each([VideoEngine.seedance_2_i2v, VideoEngine.seedance_2_i2v_fast])(
    "returns image-to-video for %s",
    (engine) => {
      expect(getToolForEngine(engine)).toBe("image-to-video");
    }
  );

  it("returns render-video for an ordinary render engine", () => {
    expect(getToolForEngine(VideoEngine.V4_0_0)).toBe("render-video");
  });
});
