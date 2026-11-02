import { describe, expect, it } from "vitest";

import {
  ComfyWanFunControlClient,
  isWanFunQuantisation,
  resolveWanFunSplitStep,
  resolveWanFunUnetFiles,
  WAN_FUN_QUANTISATIONS
} from "./comfyWanAnimateClient";
import {
  FUN_CONTROL_SETTING_BOUNDS,
  readBoundedNumber,
  readBoundedSetting,
  readRawVideoControlStrength
} from "./imageRenderService";

describe("resolveWanFunUnetFiles", () => {
  it("uses the repackaged fp8 pair by default", () => {
    expect(resolveWanFunUnetFiles("fp8_scaled")).toEqual({
      high: "wan2.2_fun_control_high_noise_14B_fp8_scaled.safetensors",
      low: "wan2.2_fun_control_low_noise_14B_fp8_scaled.safetensors",
      isGguf: false
    });
  });

  it("names the QuantStack GGUF pair for a quantisation", () => {
    expect(resolveWanFunUnetFiles("Q4_K_M")).toEqual({
      high: "Wan2.2-Fun-A14B-Control_HighNoise-Q4_K_M.gguf",
      low: "Wan2.2-Fun-A14B-Control_LowNoise-Q4_K_M.gguf",
      isGguf: true
    });
    expect(resolveWanFunUnetFiles("Q8_0").low).toBe(
      "Wan2.2-Fun-A14B-Control_LowNoise-Q8_0.gguf"
    );
  });

  it("marks every quantisation except fp8 as GGUF", () => {
    for (const quantisation of WAN_FUN_QUANTISATIONS) {
      expect(resolveWanFunUnetFiles(quantisation).isGguf).toBe(
        quantisation !== "fp8_scaled"
      );
    }
  });
});

describe("isWanFunQuantisation", () => {
  it("accepts the offered sizes", () => {
    expect(isWanFunQuantisation("Q6_K")).toBe(true);
    expect(isWanFunQuantisation("fp8_scaled")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isWanFunQuantisation("Q2_K")).toBe(false);
    expect(isWanFunQuantisation(undefined)).toBe(false);
  });
});

describe("resolveWanFunSplitStep", () => {
  it("splits the default 4 steps at 40 percent", () => {
    expect(resolveWanFunSplitStep(4, 40)).toBe(2);
  });

  it("keeps at least one step in each pass", () => {
    expect(resolveWanFunSplitStep(4, 20)).toBe(1);
    expect(resolveWanFunSplitStep(4, 80)).toBe(3);
  });

  it("never hands every step to one pass", () => {
    for (let steps = 4; steps <= 20; steps += 1) {
      for (const percentage of [20, 30, 40, 50, 60, 70, 80]) {
        const split = resolveWanFunSplitStep(steps, percentage);
        expect(split).toBeGreaterThanOrEqual(1);
        expect(split).toBeLessThanOrEqual(steps - 1);
      }
    }
  });
});

describe("readBoundedNumber", () => {
  it("passes a valid value through", () => {
    expect(readBoundedNumber(6, 4, 4, 20)).toBe(6);
  });

  it("falls back for a non-numeric value", () => {
    expect(readBoundedNumber("6", 4, 4, 20)).toBe(4);
    expect(readBoundedNumber(undefined, 4, 4, 20)).toBe(4);
  });

  it("clamps to the bounds", () => {
    expect(readBoundedNumber(99, 4, 4, 20)).toBe(20);
    expect(readBoundedNumber(-1, 4, 4, 20)).toBe(4);
  });
});

describe("readBoundedSetting", () => {
  it("applies the declared bounds for a setting", () => {
    expect(readBoundedSetting(99, FUN_CONTROL_SETTING_BOUNDS.steps)).toBe(20);
    expect(readBoundedSetting(undefined, FUN_CONTROL_SETTING_BOUNDS.cfg)).toBe(
      1
    );
  });

  it("mirrors the cloud V5 defaults", () => {
    expect(FUN_CONTROL_SETTING_BOUNDS.steps.fallback).toBe(4);
    expect(FUN_CONTROL_SETTING_BOUNDS.splitPercentage.fallback).toBe(40);
    expect(FUN_CONTROL_SETTING_BOUNDS.cfg.fallback).toBe(1);
    expect(FUN_CONTROL_SETTING_BOUNDS.shift.fallback).toBe(8);
  });
});

describe("readRawVideoControlStrength", () => {
  it("defaults to the tuned production value, not full source fidelity", () => {
    expect(readRawVideoControlStrength({})).toBe(0.5);
  });

  it("passes a chosen strength through", () => {
    expect(readRawVideoControlStrength({ raw_video_cn_strength: 0.8 })).toBe(
      0.8
    );
  });
});

type FunGraphBuilder = {
  buildFunControlGraph(input: {
    video: string;
    startImage: string;
    prompt: string;
    negativePrompt: string;
    frameCount: number;
    quantisation: "fp8_scaled" | "Q8_0" | "Q6_K" | "Q5_K_M" | "Q4_K_M";
    width: number;
    height: number;
    steps: number;
    splitPercentage: number;
    cfg: number;
    shift: number;
    speedupLoraStrength: number;
    colorMatchStrength: number;
    seed: number;
  }): Record<string, { class_type: string; inputs: Record<string, unknown> }>;
};

const buildGraph = (
  overrides: Partial<
    Parameters<FunGraphBuilder["buildFunControlGraph"]>[0]
  > = {}
) => {
  const client = new ComfyWanFunControlClient("http://127.0.0.1:8188");
  return (client as unknown as FunGraphBuilder).buildFunControlGraph({
    video: "mago/control.mp4",
    startImage: "mago/stylized.png",
    prompt: "anime style",
    negativePrompt: "bad quality",
    frameCount: 49,
    quantisation: "fp8_scaled",
    width: 832,
    height: 480,
    steps: 4,
    splitPercentage: 40,
    cfg: 1,
    shift: 8,
    speedupLoraStrength: 1,
    colorMatchStrength: 0,
    seed: 456,
    ...overrides
  });
};

describe("ComfyWanFunControlClient graph", () => {
  it("feeds the source video as control and the stylized frame as the reference image", () => {
    const graph = buildGraph();
    expect(graph["14"]).toMatchObject({
      class_type: "Wan22FunControlToVideo",
      inputs: {
        width: 832,
        height: 480,
        length: 49,
        control_video: ["2", 0],
        ref_image: ["3", 0]
      }
    });
  });

  it("loads the fp8 pair with UNETLoader", () => {
    const graph = buildGraph();
    expect(graph["4"].class_type).toBe("UNETLoader");
    expect(graph["4"].inputs.unet_name).toBe(
      "wan2.2_fun_control_high_noise_14B_fp8_scaled.safetensors"
    );
    expect(graph["5"].inputs.unet_name).toBe(
      "wan2.2_fun_control_low_noise_14B_fp8_scaled.safetensors"
    );
  });

  it("switches to the GGUF loader for a quantised size", () => {
    const graph = buildGraph({ quantisation: "Q5_K_M" });
    expect(graph["4"].class_type).toBe("UnetLoaderGGUF");
    expect(graph["4"].inputs.unet_name).toBe(
      "Wan2.2-Fun-A14B-Control_HighNoise-Q5_K_M.gguf"
    );
    expect(graph["4"].inputs.weight_dtype).toBeUndefined();
  });

  it("applies the speedup LoRA to both noise passes", () => {
    const graph = buildGraph({ speedupLoraStrength: 0.8 });
    expect(graph["10"].inputs).toMatchObject({
      lora_name: "wan2.2_i2v_lightx2v_4steps_lora_v1_high_noise.safetensors",
      strength_model: 0.8
    });
    expect(graph["11"].inputs).toMatchObject({
      lora_name: "wan2.2_i2v_lightx2v_4steps_lora_v1_low_noise.safetensors",
      strength_model: 0.8
    });
  });

  it("hands the latent from the high pass to the low pass at the split step", () => {
    const graph = buildGraph({ steps: 10, splitPercentage: 40 });
    expect(graph["15"].inputs).toMatchObject({
      add_noise: "enable",
      start_at_step: 0,
      end_at_step: 4,
      return_with_leftover_noise: "enable",
      latent_image: ["14", 2]
    });
    expect(graph["16"].inputs).toMatchObject({
      add_noise: "disable",
      start_at_step: 4,
      end_at_step: 10,
      return_with_leftover_noise: "disable",
      latent_image: ["15", 0]
    });
  });

  it("keeps the source audio and fps on the delivered video", () => {
    const graph = buildGraph();
    expect(graph["18"].inputs).toMatchObject({
      fps: ["2", 2],
      audio: ["2", 1],
      images: ["17", 0]
    });
  });

  it("omits the color match node entirely at strength 0", () => {
    const graph = buildGraph({ colorMatchStrength: 0 });
    expect(graph["20"]).toBeUndefined();
    expect(graph["18"].inputs.images).toEqual(["17", 0]);
  });

  it("routes through color match against the stylized frame when enabled", () => {
    const graph = buildGraph({ colorMatchStrength: 0.4 });
    expect(graph["20"]).toMatchObject({
      class_type: "ColorMatch",
      inputs: {
        image_ref: ["3", 0],
        image_target: ["17", 0],
        strength: 0.4
      }
    });
    expect(graph["18"].inputs.images).toEqual(["20", 0]);
  });

  it("saves through the node id the shared poll reads", () => {
    const graph = buildGraph();
    expect(graph["19"].class_type).toBe("SaveVideo");
    expect(graph["19"].inputs.video).toEqual(["18", 0]);
  });
});
