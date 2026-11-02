import { describe, expect, it } from "vitest";

import {
  ComfyMagoAnimateClient,
  isMagoAnimateQuantisation,
  MAGO_ANIMATE_QUANTISATIONS,
  magoAnimateUnetFile
} from "./comfyWanAnimateClient";
import {
  MAGO_ANIMATE_SETTING_BOUNDS,
  readAnimateCacheDtype,
  readBoundedSetting,
  readStringSetting
} from "./imageRenderService";

describe("magoAnimateUnetFile", () => {
  it("names the distilled TURBO GGUF for a quantisation", () => {
    expect(magoAnimateUnetFile("Q4_K_M")).toBe(
      "Wan-Animate-2-14B-TURBO-Q4_K_M.gguf"
    );
    expect(magoAnimateUnetFile("Q8_0")).toBe(
      "Wan-Animate-2-14B-TURBO-Q8_0.gguf"
    );
  });

  it("names the distilled INT8 safetensors model", () => {
    expect(magoAnimateUnetFile("int8_convrot")).toBe(
      "wan_animate_2_distill_int8_convrot.safetensors"
    );
  });

  it("covers every offered GGUF quantisation", () => {
    for (const quantisation of MAGO_ANIMATE_QUANTISATIONS.filter(
      (value) => value !== "int8_convrot"
    )) {
      expect(magoAnimateUnetFile(quantisation)).toMatch(
        /^Wan-Animate-2-14B-TURBO-.+\.gguf$/
      );
    }
  });
});

describe("isMagoAnimateQuantisation", () => {
  it("accepts the offered sizes and rejects others", () => {
    expect(isMagoAnimateQuantisation("int8_convrot")).toBe(true);
    expect(isMagoAnimateQuantisation("Q6_K")).toBe(true);
    expect(isMagoAnimateQuantisation("Q8_0")).toBe(true);
    expect(isMagoAnimateQuantisation("Q2_K")).toBe(false);
    expect(isMagoAnimateQuantisation(undefined)).toBe(false);
  });
});

describe("readAnimateCacheDtype", () => {
  it("passes a supported dtype through", () => {
    expect(readAnimateCacheDtype({ animate_cache_dtype: "int4" })).toBe("int4");
  });

  it("falls back to int8 for anything unsupported", () => {
    expect(readAnimateCacheDtype({ animate_cache_dtype: "fp8" })).toBe("int8");
    expect(readAnimateCacheDtype({})).toBe("int8");
  });
});

describe("readStringSetting", () => {
  it("returns the string or an empty string", () => {
    expect(readStringSetting("a girl dancing")).toBe("a girl dancing");
    expect(readStringSetting(undefined)).toBe("");
    expect(readStringSetting(7)).toBe("");
  });
});

describe("MAGO_ANIMATE_SETTING_BOUNDS", () => {
  it("mirrors the workflow's sampler defaults", () => {
    expect(MAGO_ANIMATE_SETTING_BOUNDS.steps.fallback).toBe(10);
    expect(MAGO_ANIMATE_SETTING_BOUNDS.cfg.fallback).toBe(1);
    expect(MAGO_ANIMATE_SETTING_BOUNDS.shift.fallback).toBe(5);
    expect(MAGO_ANIMATE_SETTING_BOUNDS.poseEndPercent.fallback).toBe(1);
  });

  it("clamps out-of-range values", () => {
    expect(
      readBoundedSetting(99, MAGO_ANIMATE_SETTING_BOUNDS.poseStrength)
    ).toBe(2);
  });
});

type MagoAnimateGraphBuilder = {
  buildMagoAnimateGraph(
    input: Record<string, unknown>
  ): Record<string, { class_type: string; inputs: Record<string, unknown> }>;
};

const buildGraph = (overrides: Record<string, unknown> = {}) => {
  const client = new ComfyMagoAnimateClient("http://127.0.0.1:8188");
  return (client as unknown as MagoAnimateGraphBuilder).buildMagoAnimateGraph({
    video: "mago/pose.mp4",
    referenceImage: "mago/character.png",
    prompt: "a woman in a trench coat",
    posePrompt: "a man walking",
    negativePrompt: "bad quality",
    frameCount: 49,
    quantisation: "Q4_K_M",
    width: 832,
    height: 480,
    steps: 10,
    cfg: 1,
    shift: 5,
    referenceImageStrength: 1,
    poseStrength: 1,
    poseStartPercent: 0,
    poseEndPercent: 1,
    cacheDevice: "gpu",
    cacheDtype: "int8",
    trimDuplicatedFrame: false,
    seed: 456,
    ...overrides
  });
};

describe("ComfyMagoAnimateClient graph", () => {
  it("loads distilled INT8 natively without either GGUF loader", () => {
    const graph = buildGraph({ quantisation: "int8_convrot" });
    expect(graph["4"]).toEqual({
      class_type: "UNETLoader",
      inputs: {
        unet_name: "wan_animate_2_distill_int8_convrot.safetensors",
        weight_dtype: "default"
      }
    });
    const loaded = Object.values(graph).map((node) => node.class_type);
    expect(loaded).not.toContain("RebelsGGUFUnetLoaderMeta");
    expect(loaded).not.toContain("UnetLoaderGGUF");
    expect(loaded).not.toContain("LoraLoaderModelOnly");
    expect(graph["5"].inputs.model).toEqual(["4", 0]);
    expect(graph["9"].inputs.sampler_name).toBe("lcm");
    expect(graph["8"].inputs.steps).toBe(10);
    expect(graph["23"].inputs.cfg).toBe(1);
  });

  it("loads the selected GGUF through the Rebels loader with the animate2 model type", () => {
    const graph = buildGraph({ quantisation: "Q6_K" });
    expect(graph["4"]).toMatchObject({
      class_type: "RebelsGGUFUnetLoaderMeta",
      inputs: {
        unet_name: "Wan-Animate-2-14B-TURBO-Q6_K.gguf",
        model_type: "animate2"
      }
    });
  });

  it("puts the motion cache on the chunked feed-forward model, with no speedup LoRA", () => {
    const graph = buildGraph({ cacheDevice: "cpu" });
    expect(graph["5"]).toMatchObject({
      class_type: "WanChunkFeedForward",
      inputs: { model: ["4", 0] }
    });
    expect(graph["6"]).toMatchObject({
      class_type: "WanAnimate2Cache",
      inputs: { device: "cpu", dtype: "int8", model: ["5", 0] }
    });
  });

  it("loads no LoRA at all, since the TURBO weights are already distilled", () => {
    const graph = buildGraph();
    const loaded = Object.values(graph).map((node) => node.class_type);
    expect(loaded).not.toContain("LoraLoaderModelOnly");
  });

  it("feeds the pose video and the character reference at the padded size", () => {
    const graph = buildGraph({ width: 850, height: 480 });
    expect(graph["16"].inputs).toMatchObject({ width: 864, height: 480 });
    expect(graph["17"].inputs).toMatchObject({ width: 864, height: 480 });
    expect(graph["22"].inputs).toMatchObject({
      width: 864,
      height: 480,
      length: 49,
      pose_video: ["16", 0],
      reference_image: ["17", 0]
    });
  });

  it("encodes clip vision for the reference and the first pose frame", () => {
    const graph = buildGraph();
    expect(graph["18"].inputs).toMatchObject({
      batch_index: 0,
      length: 1,
      image: ["16", 0]
    });
    expect(graph["20"].inputs.image).toEqual(["17", 0]);
    expect(graph["21"].inputs.image).toEqual(["18", 0]);
    expect(graph["22"].inputs).toMatchObject({
      clip_vision_output: ["20", 0],
      clip_vision_output_pose: ["21", 0],
      positive_pose: ["13", 0]
    });
  });

  it("samples from the conditioning and latent the animate node returns", () => {
    const graph = buildGraph();
    expect(graph["23"].inputs).toMatchObject({
      positive: ["22", 0],
      negative: ["22", 1],
      latent_image: ["22", 2],
      model: ["7", 0],
      sigmas: ["8", 0],
      sampler: ["9", 0]
    });
  });

  it("trims the latent by the amount the animate node reports", () => {
    const graph = buildGraph();
    expect(graph["24"].inputs).toEqual({
      samples: ["23", 0],
      trim_amount: ["22", 3]
    });
  });

  it("omits the duplicate-frame trim by default", () => {
    const graph = buildGraph({ trimDuplicatedFrame: false });
    expect(graph["26"]).toBeUndefined();
    expect(graph["27"].inputs.images).toEqual(["25", 0]);
  });

  it("drops the repeated first frame when asked", () => {
    const graph = buildGraph({ trimDuplicatedFrame: true });
    expect(graph["26"].inputs).toMatchObject({
      batch_index: 1,
      length: 4096,
      image: ["25", 0]
    });
    expect(graph["27"].inputs.images).toEqual(["26", 0]);
  });

  it("keeps the source audio and fps, and saves through the polled node id", () => {
    const graph = buildGraph();
    expect(graph["27"].inputs).toMatchObject({
      fps: ["2", 2],
      audio: ["2", 1]
    });
    expect(graph["19"].class_type).toBe("SaveVideo");
    expect(graph["19"].inputs.video).toEqual(["27", 0]);
  });
});
