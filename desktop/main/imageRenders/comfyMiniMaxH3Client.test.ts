import { describe, expect, it } from "vitest";

import { MINIMAX_H3_STEP_LORAS } from "../../shared/minimaxH3StepLoras";
import { resolveMiniMaxH3VfxLora } from "../../shared/minimaxH3VfxModes";

import {
  buildMiniMaxH3LocalGraph,
  clampMiniMaxH3Dimension,
  ComfyMiniMaxH3Client,
  type MiniMaxH3LocalGraphInput,
  snapMiniMaxH3LengthFrames
} from "./comfyMiniMaxH3Client";

const graphInput = (
  overrides: Partial<MiniMaxH3LocalGraphInput> = {}
): MiniMaxH3LocalGraphInput => ({
  prompt: "<Video 1> walks into <Picture 1>",
  width: 720,
  height: 1280,
  lengthFrames: 124,
  steps: 8,
  seed: 7,
  referenceImages: ["mago/reference.png"],
  referenceVideo: "mago/input.mp4",
  useReferenceVideoAudio: true,
  ...overrides
});

describe("buildMiniMaxH3LocalGraph", () => {
  it.each([
    [2, "pika_h3_flex_turbo_2step_draft_ref2va.safetensors"],
    [4, "pika_h3_flex_turbo_4step_ref2va.safetensors"],
    [8, "pika_h3_flex_turbo_8step_hd_ref2va.safetensors"]
  ] as const)(
    "uses the %i-step LoRA and a matching scheduler",
    (steps, loraFile) => {
      const graph = buildMiniMaxH3LocalGraph(graphInput({ steps }));

      expect(MINIMAX_H3_STEP_LORAS[steps].loraFile).toBe(loraFile);
      expect(graph["2"]).toMatchObject({
        class_type: "LoraLoaderModelOnly",
        inputs: { model: ["1", 0], lora_name: loraFile, strength_model: 1 }
      });
      expect(graph["3"]?.inputs.model).toEqual(["2", 0]);
      expect(graph["12"]).toMatchObject({
        class_type: "BasicScheduler",
        inputs: { model: ["4", 0], steps }
      });
      expect(graph["10"]?.inputs.model).toEqual(["4", 0]);
      expect(graph["13"]?.inputs.sigmas).toEqual(["12", 0]);
    }
  );

  it("never adds the retired PDD accelerator", () => {
    const graph = buildMiniMaxH3LocalGraph(graphInput({ steps: 8 }));

    expect(Object.values(graph).map((node) => node.class_type)).not.toContain(
      "MiniMaxH3PDDAccApply"
    );
  });

  it("loads the vanilla model files", () => {
    const graph = buildMiniMaxH3LocalGraph(graphInput());

    expect(graph["1"]?.inputs.unet_name).toBe(
      "minimax_h3_ref2va_pruned_int8_convrot.safetensors"
    );
    expect(graph["5"]?.inputs.clip_name).toBe(
      "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors"
    );
    expect(graph["16"]?.inputs.fps).toBe(24);
    expect(graph["19"]?.class_type).toBe("SaveVideo");
  });

  it("passes experimental portrait 1080p dimensions to ComfyUI", () => {
    const graph = buildMiniMaxH3LocalGraph(
      graphInput({ width: 1080, height: 1920 })
    );

    expect(graph["8"]?.inputs).toMatchObject({ width: 1088, height: 1920 });
  });

  it("wires the source video, its audio and the reference images", () => {
    const graph = buildMiniMaxH3LocalGraph(
      graphInput({
        referenceImages: ["mago/first.png", "mago/second.png"]
      })
    );

    expect(graph["20"]?.inputs.image).toBe("mago/first.png");
    expect(graph["21"]?.inputs.image).toBe("mago/second.png");
    expect(graph["40"]).toMatchObject({
      class_type: "VHS_LoadVideo",
      inputs: { video: "mago/input.mp4", force_rate: 24, frame_load_cap: 124 }
    });
    expect(graph["8"]?.inputs).toMatchObject({
      "ref_images.ref_image_0": ["20", 0],
      "ref_images.ref_image_1": ["21", 0],
      "ref_videos.ref_video_0": ["40", 0],
      "ref_video_audios.ref_video_audio_0": ["40", 2]
    });
  });

  it("leaves the source audio out when the video audio is off", () => {
    const graph = buildMiniMaxH3LocalGraph(
      graphInput({ useReferenceVideoAudio: false })
    );

    expect(graph["8"]?.inputs["ref_videos.ref_video_0"]).toEqual(["40", 0]);
    expect(
      graph["8"]?.inputs["ref_video_audios.ref_video_audio_0"]
    ).toBeUndefined();
  });

  it("leaves the source video out when there is no video reference", () => {
    const graph = buildMiniMaxH3LocalGraph(
      graphInput({ referenceVideo: undefined })
    );

    expect(graph["40"]).toBeUndefined();
    expect(graph["8"]?.inputs["ref_videos.ref_video_0"]).toBeUndefined();
  });
});

describe("MiniMax H3 sizing", () => {
  it("snaps dimensions to multiples of 32 within 256 to 1920", () => {
    expect(clampMiniMaxH3Dimension(720)).toBe(736);
    expect(clampMiniMaxH3Dimension(1280)).toBe(1280);
    expect(clampMiniMaxH3Dimension(1080)).toBe(1088);
    expect(clampMiniMaxH3Dimension(1920)).toBe(1920);
    expect(clampMiniMaxH3Dimension(100)).toBe(256);
    expect(clampMiniMaxH3Dimension(4000)).toBe(1920);
  });

  it("snaps the length to 5 + 17k frames at 24 fps, up to 362", () => {
    expect(snapMiniMaxH3LengthFrames(5)).toBe(124);
    expect(snapMiniMaxH3LengthFrames(0.1)).toBe(5);
    expect(snapMiniMaxH3LengthFrames(30)).toBe(362);
  });
});

describe("ComfyMiniMaxH3Client", () => {
  it("refuses a render with no reference at all", async () => {
    await expect(
      new ComfyMiniMaxH3Client("http://127.0.0.1:8188").submitMiniMaxH3({
        prompt: "a quiet street",
        width: 720,
        height: 1280,
        durationSeconds: 5,
        steps: 8,
        referenceImagePaths: [],
        useReferenceVideoAudio: true,
        vfxMode: "none",
        isEditedFrameProvided: false,
        vfxLoraStrength: 1
      })
    ).rejects.toThrow("MiniMax H3 needs a source video or a reference image");
  });

  it("refuses a head swap without a reference image", async () => {
    await expect(
      new ComfyMiniMaxH3Client("http://127.0.0.1:8188").submitMiniMaxH3({
        prompt: "swap the head",
        width: 720,
        height: 1280,
        durationSeconds: 5,
        steps: 8,
        referenceImagePaths: [],
        referenceVideoPath: "/library/input.mp4",
        useReferenceVideoAudio: true,
        vfxMode: "head_swap",
        isEditedFrameProvided: false,
        vfxLoraStrength: 1
      })
    ).rejects.toThrow("This VFX mode needs a reference image");
  });
});

describe("buildMiniMaxH3LocalGraph with a VFX LoRA", () => {
  const vfxGraphInput = (
    mode: "vfx_edit" | "character_swap",
    overrides: Partial<MiniMaxH3LocalGraphInput> = {}
  ) =>
    graphInput({
      vfxLora: { lora: resolveMiniMaxH3VfxLora(mode, false)!, strength: 0.7 },
      ...overrides
    });

  it("applies the VFX LoRA after the sigma shift, ahead of the scheduler", () => {
    const graph = buildMiniMaxH3LocalGraph(vfxGraphInput("vfx_edit"));

    expect(graph["17"]).toMatchObject({
      class_type: "LoraLoaderModelOnly",
      inputs: {
        model: ["4", 0],
        lora_name: "minimax_h3_vfx_edit_v1.0_r128.safetensors",
        strength_model: 0.7
      }
    });
    expect(graph["2"]?.inputs.model).toEqual(["1", 0]);
    expect(graph["12"]?.inputs.model).toEqual(["17", 0]);
    expect(graph["10"]?.inputs.model).toEqual(["17", 0]);
  });

  it("applies the VFX LoRA to the guider and scheduler at turbo steps", () => {
    const graph = buildMiniMaxH3LocalGraph(
      vfxGraphInput("vfx_edit", { steps: 4 })
    );

    expect(graph["12"]?.inputs.model).toEqual(["17", 0]);
    expect(graph["10"]?.inputs.model).toEqual(["17", 0]);
  });

  it("guides from the source clip instead of referencing it", () => {
    const graph = buildMiniMaxH3LocalGraph(vfxGraphInput("vfx_edit"));

    expect(graph["8"]?.inputs["ref_videos.ref_video_0"]).toBeUndefined();
    expect(
      graph["8"]?.inputs["ref_video_audios.ref_video_audio_0"]
    ).toBeUndefined();
    expect(graph["18"]).toMatchObject({
      class_type: "MiniMaxH3AddGuide",
      inputs: {
        positive: ["8", 0],
        latent: ["8", 1],
        vae: ["6", 0],
        image: ["40", 0],
        frame_idx: 0,
        audio: ["40", 2],
        audio_vae: ["7", 0]
      }
    });
    expect(graph["10"]?.inputs.conditioning).toEqual(["18", 0]);
    expect(graph["13"]?.inputs.latent_image).toEqual(["8", 1]);
  });

  it("guides without the soundtrack when the source audio is off", () => {
    const graph = buildMiniMaxH3LocalGraph(
      vfxGraphInput("vfx_edit", { useReferenceVideoAudio: false })
    );

    expect(graph["18"]?.inputs.audio).toBeUndefined();
    expect(graph["18"]?.inputs.audio_vae).toBeUndefined();
  });

  it("keeps the source clip as a reference video for character swap", () => {
    const graph = buildMiniMaxH3LocalGraph(vfxGraphInput("character_swap"));

    expect(graph["8"]?.inputs["ref_videos.ref_video_0"]).toEqual(["40", 0]);
    expect(graph["18"]).toBeUndefined();
    expect(graph["10"]?.inputs.conditioning).toEqual(["8", 0]);
  });

  it("adds no VFX nodes without a VFX LoRA", () => {
    const graph = buildMiniMaxH3LocalGraph(graphInput());

    expect(graph["17"]).toBeUndefined();
    expect(graph["18"]).toBeUndefined();
  });
});
