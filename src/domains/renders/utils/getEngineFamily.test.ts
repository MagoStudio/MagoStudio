import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { getEngineFamily } from "./getEngineFamily";

describe("getEngineFamily", () => {
  it("classifies mask engines", () => {
    expect(getEngineFamily(VideoEngine.v1_0_0_mask)).toBe("mask");
  });

  it("classifies both upscalers and Mago SDR-to-HDR", () => {
    expect(getEngineFamily(VideoEngine.v1_0_0_upscaler)).toBe("upscale");
    expect(getEngineFamily(VideoEngine.v2_0_0_esrgan_upscaler)).toBe("upscale");
    expect(getEngineFamily(VideoEngine.V7_0_0)).toBe("upscale");
  });

  it("classifies both image-to-video engines", () => {
    expect(getEngineFamily(VideoEngine.seedance_2_i2v)).toBe("image-to-video");
    expect(getEngineFamily(VideoEngine.seedance_2_i2v_fast)).toBe(
      "image-to-video"
    );
  });

  it("falls back to render for ordinary video engines", () => {
    expect(getEngineFamily(VideoEngine.V5_0_0)).toBe("render");
    expect(getEngineFamily(VideoEngine.V3_4_0)).toBe("render");
    expect(getEngineFamily(VideoEngine.seedance_2)).toBe("render");
    expect(getEngineFamily(VideoEngine.kling_o1)).toBe("render");
  });

  it("still classifies Mago V8.0.0 as render, not upscale", () => {
    expect(getEngineFamily(VideoEngine.V8_0_0)).toBe("render");
  });

  it("treats a missing engine as render", () => {
    expect(getEngineFamily(undefined)).toBe("render");
  });
});
