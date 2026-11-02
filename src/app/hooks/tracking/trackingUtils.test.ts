import { VideoEngine, VideoSettings } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { getMaskInputType, getRenderGenerationType } from "./trackingUtils";

describe("getRenderGenerationType", () => {
  it("returns 'mask' for v1_0_0_mask engine", () => {
    expect(getRenderGenerationType(VideoEngine.v1_0_0_mask)).toBe("mask");
  });

  it("returns 'upscale' for v1_0_0_upscaler engine", () => {
    expect(getRenderGenerationType(VideoEngine.v1_0_0_upscaler)).toBe(
      "upscale"
    );
  });

  it("returns 'upscale' for v2_0_0_esrgan_upscaler engine", () => {
    expect(getRenderGenerationType(VideoEngine.v2_0_0_esrgan_upscaler)).toBe(
      "upscale"
    );
  });

  it("returns 'render' for V5_0_0 engine", () => {
    expect(getRenderGenerationType(VideoEngine.V5_0_0)).toBe("render");
  });

  it("returns 'render' for V3_4_0 engine", () => {
    expect(getRenderGenerationType(VideoEngine.V3_4_0)).toBe("render");
  });

  it("returns 'render' for seedance_2 engine", () => {
    expect(getRenderGenerationType(VideoEngine.seedance_2)).toBe("render");
  });

  it("returns 'render' for kling_o1 engine", () => {
    expect(getRenderGenerationType(VideoEngine.kling_o1)).toBe("render");
  });

  it("returns 'image-to-video' for seedance_2_i2v engine", () => {
    expect(getRenderGenerationType(VideoEngine.seedance_2_i2v)).toBe(
      "image-to-video"
    );
  });

  it("returns 'image-to-video' for seedance_2_i2v_fast engine", () => {
    expect(getRenderGenerationType(VideoEngine.seedance_2_i2v_fast)).toBe(
      "image-to-video"
    );
  });
});

describe("getMaskInputType", () => {
  it("returns 'prompt' when type is 'mask' and mask_mode is 'prompt'", () => {
    const settings: VideoSettings = { mask_mode: "prompt" };
    expect(getMaskInputType("mask", settings)).toBe("prompt");
  });

  it("returns 'visual_selection' when type is 'mask' and mask_mode is 'visual_selection'", () => {
    const settings: VideoSettings = { mask_mode: "visual_selection" };
    expect(getMaskInputType("mask", settings)).toBe("visual_selection");
  });

  it("returns 'prompt_and_visual_selection' when type is 'mask' and mask_mode is 'prompt_and_visual_selection'", () => {
    const settings: VideoSettings = {
      mask_mode: "prompt_and_visual_selection"
    };
    expect(getMaskInputType("mask", settings)).toBe(
      "prompt_and_visual_selection"
    );
  });

  it("returns 'N/A' when type is 'mask' but mask_mode is undefined", () => {
    const settings: VideoSettings = {};
    expect(getMaskInputType("mask", settings)).toBe("N/A");
  });

  it("returns 'N/A' when type is 'mask' but mask_mode is an unrecognized value", () => {
    const settings: VideoSettings = { mask_mode: "something_else" };
    expect(getMaskInputType("mask", settings)).toBe("N/A");
  });

  it("returns 'N/A' when type is 'render' regardless of mask_mode", () => {
    const settings: VideoSettings = { mask_mode: "prompt" };
    expect(getMaskInputType("render", settings)).toBe("N/A");
  });

  it("returns 'N/A' when type is 'upscale' regardless of mask_mode", () => {
    const settings: VideoSettings = { mask_mode: "visual_selection" };
    expect(getMaskInputType("upscale", settings)).toBe("N/A");
  });

  it("returns 'N/A' when type is 'render' and mask_mode is undefined", () => {
    const settings: VideoSettings = {};
    expect(getMaskInputType("render", settings)).toBe("N/A");
  });
});
