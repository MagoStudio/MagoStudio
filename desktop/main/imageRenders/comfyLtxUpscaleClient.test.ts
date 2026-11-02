import { describe, expect, it, vi } from "vitest";

import {
  ComfyLtxUpscaleClient,
  computeLtxTileGrid,
  LTX_TILED_SAMPLER_CLASS,
  LTX_UPSCALE_MODEL_FILES,
  ltxUpscaleLoraFile,
  normalizeLtxUpscaleDimension
} from "./comfyLtxUpscaleClient";

type GraphBuilder = {
  buildLtxGraph(input: {
    video: string;
    prompt: string;
    negativePrompt: string;
    width: number;
    height: number;
    factor: 2 | 4;
    loraStrength: number;
    tileSize: number;
    seed: number;
  }): Record<string, { class_type: string; inputs: Record<string, unknown> }>;
};

const build = (
  factor: 2 | 4 = 4,
  width = 1920,
  height = 1088,
  tileSize = 1024
) => {
  const client = new ComfyLtxUpscaleClient("http://127.0.0.1:8188");
  return (client as unknown as GraphBuilder).buildLtxGraph({
    video: "mago/input.mp4",
    prompt: "natural fine detail",
    negativePrompt: "flicker",
    width,
    height,
    factor,
    loraStrength: 0.8,
    tileSize,
    seed: 123
  });
};

describe("ComfyLtxUpscaleClient graph", () => {
  it("reports when the Mago tiled sampler node is missing", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ system: {} }), { status: 200 })
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
    try {
      await expect(
        new ComfyLtxUpscaleClient("http://127.0.0.1:8188").validate()
      ).rejects.toThrow("install ComfyUI-MagoNodes");
    } finally {
      fetchMock.mockRestore();
    }
  });

  it("loads the supplied distilled Q5 GGUF and split LTX models", () => {
    const graph = build();
    expect(graph["3"]).toEqual({
      class_type: "UnetLoaderGGUF",
      inputs: { unet_name: LTX_UPSCALE_MODEL_FILES.unet }
    });
    expect(graph["4"].inputs).toMatchObject({
      clip_name1: LTX_UPSCALE_MODEL_FILES.textEncoder,
      clip_name2: LTX_UPSCALE_MODEL_FILES.textConnector,
      type: "ltxv"
    });
    expect(graph["5"].inputs.vae_name).toBe(LTX_UPSCALE_MODEL_FILES.videoVae);
    expect(graph["6"].inputs.vae_name).toBe(LTX_UPSCALE_MODEL_FILES.audioVae);
  });

  it("selects the matching x2 or x4 spatial-upscaler LoRA", () => {
    expect(build(2)["10"].inputs.lora_name).toBe(ltxUpscaleLoraFile(2));
    expect(build(4)["10"].inputs.lora_name).toBe(ltxUpscaleLoraFile(4));
  });

  it("uses the calculated output dimensions and preserves source audio", () => {
    const graph = build();
    expect(graph["11"].inputs).toMatchObject({ width: 1920, height: 1152 });
    expect(graph["17"].inputs.audio_latent).toEqual(["15", 2]);
    expect(graph["27"].inputs).toMatchObject({
      images: ["26", 0],
      audio: ["25", 0],
      fps: ["2", 2]
    });
    expect(graph["19"].class_type).toBe("SaveVideo");
  });

  it("aligns stale dimensions to the IC-LoRA's 64-pixel grid", () => {
    expect(normalizeLtxUpscaleDimension(928, 2)).toBe(960);
    const graph = build(2, 1664, 928);
    expect(graph["11"].inputs).toMatchObject({ width: 1664, height: 960 });
  });

  it("uses the x4 LoRA's 128-pixel grid", () => {
    expect(normalizeLtxUpscaleDimension(1856, 4)).toBe(1920);
    expect(normalizeLtxUpscaleDimension(3328, 4)).toBe(3328);
    const graph = build(4, 3328, 1856);
    expect(graph["11"].inputs).toMatchObject({ width: 3328, height: 1920 });
  });

  it("uses the official distilled upscaler sampling recipe", () => {
    const graph = build();
    expect(graph["16"].inputs.cfg).toBe(1);
    expect(graph["20"].inputs.sampler_name).toBe("euler_cfg_pp");
    expect(graph["21"].inputs.sigmas).toBe(
      "1.0, 0.99375, 0.9875, 0.98125, 0.975, 0.909375, 0.725, 0.421875, 0.0"
    );
  });

  it("patches the IC-LoRA model with Mago's tiled sampler", () => {
    const graph = build();
    expect(graph["28"]).toEqual({
      class_type: LTX_TILED_SAMPLER_CLASS,
      inputs: {
        model: ["10", 0],
        tiles_h: 2,
        tiles_w: 2,
        overlap_h: 6,
        overlap_w: 6,
        tiles_t: 1,
        overlap_t: 8,
        bypass_tiling: false,
        debug: true
      }
    });
    expect(graph["16"].inputs.model).toEqual(["28", 0]);
  });

  it("derives the tile grid from the padded output size", () => {
    const graph = build(4, 3328, 1856, 1024);
    expect(graph["11"].inputs).toMatchObject({ width: 3328, height: 1920 });
    expect(graph["28"].inputs).toMatchObject({
      tiles_w: 4,
      tiles_h: 2,
      bypass_tiling: false
    });
  });

  it("bypasses tiling when the output fits within the selected tile size", () => {
    expect(computeLtxTileGrid(1920, 1088, 2048)).toEqual({
      tilesW: 1,
      tilesH: 1,
      bypassTiling: true
    });
  });

  it("caps large output grids at the node's supported maximum", () => {
    expect(computeLtxTileGrid(8192, 4608, 512)).toEqual({
      tilesW: 8,
      tilesH: 8,
      bypassTiling: false
    });
  });
});
