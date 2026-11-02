import { describe, expect, it } from "vitest";

import {
  computeLtxUpscaleDimensions,
  ltx23SpatialUpscalerModel
} from "./ltx23SpatialUpscalerModel";

describe("LTX 2.3 spatial upscaler model", () => {
  it("calculates x2 and x4 output dimensions from the source", () => {
    expect(computeLtxUpscaleDimensions(960, 544, 2)).toEqual({
      width: 1920,
      height: 1088
    });
    expect(computeLtxUpscaleDimensions(480, 272, 4)).toEqual({
      width: 1920,
      height: 1088
    });
    expect(computeLtxUpscaleDimensions(1920, 1080, 4)).toEqual({
      width: 7680,
      height: 4320
    });
    expect(computeLtxUpscaleDimensions(832, 464, 2)).toEqual({
      width: 1664,
      height: 928
    });
  });

  it("preserves the exact source ratio before processing-canvas padding", () => {
    const dimensions = computeLtxUpscaleDimensions(832, 464, 4);
    expect(dimensions).toEqual({ width: 3328, height: 1856 });
    expect(dimensions.width / dimensions.height).toBe(832 / 464);
  });

  it("offers both official Pixel Spatial Upscaler variants", () => {
    const setting = ltx23SpatialUpscalerModel.settingsGroups
      .flatMap((group) => group.sections)
      .flatMap((section) => section.settings)
      .find((candidate) => candidate.key === "ltx_upscale_factor");
    expect(setting?.type).toBe("enum");
    expect(setting?.type === "enum" ? setting.options : undefined).toEqual([
      { value: "2", label: "x2" },
      { value: "4", label: "x4" }
    ]);
  });

  it("includes the tiled sampler pack in its setup instructions", () => {
    const setup = ltx23SpatialUpscalerModel.settingsGroups
      .flatMap((group) => group.sections)
      .flatMap((section) => section.settings)
      .find((candidate) => candidate.key === "ltx_upscale_setup");
    expect(setup?.tooltip).toContain(
      "https://github.com/MagoStudio/ComfyUI-MagoNodes"
    );
  });

  it("exposes the output-pixel tile size control", () => {
    const setting = ltx23SpatialUpscalerModel.settingsGroups
      .flatMap((group) => group.sections)
      .flatMap((section) => section.settings)
      .find((candidate) => candidate.key === "tile_base_size");
    expect(setting).toMatchObject({
      type: "number",
      min: 512,
      max: 2048,
      step: 64,
      defaultValue: 1024
    });
  });

  it("hides prompt and LoRA strength while retaining their defaults", () => {
    const settings = ltx23SpatialUpscalerModel.settingsGroups
      .flatMap((group) => group.sections)
      .flatMap((section) => section.settings);
    const prompt = settings.find((candidate) => candidate.key === "prompt");
    const loraStrength = settings.find(
      (candidate) => candidate.key === "ltx_upscale_lora_strength"
    );

    expect(prompt).toMatchObject({
      ui: "hidden",
      defaultValue: expect.any(String)
    });
    expect(loraStrength).toMatchObject({ ui: "hidden", defaultValue: 1 });
  });

  it("always submits the fixed prompt and LoRA strength", () => {
    const result = ltx23SpatialUpscalerModel.formatValuesForBackend!(
      {
        prompt: "old saved custom prompt",
        ltx_upscale_lora_strength: 0.25,
        ltx_upscale_factor: "2"
      },
      {} as never
    );

    expect(result.prompt).toBe(
      "high quality, crisp natural detail, realistic textures, clean edges, temporally consistent"
    );
    expect(result.ltx_upscale_lora_strength).toBe(1);
  });
});
