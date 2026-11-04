import { afterEach, describe, expect, it, vi } from "vitest";

import { MINIMAX_H3_STEP_LORAS } from "../../shared/minimaxH3StepLoras";
import { ComfyClient } from "../comfy/ComfyClient";
import { ComfyQwenClient } from "../imageRenders/comfyQwenClient";

import {
  buildMiniMaxH3Graph,
  buildMiniMaxH3ReferenceInputs,
  ComfyScriptProjectClient,
  LOCAL_H3_MODELS,
  LOCAL_SCRIPT_VIDEO_CRF,
  LOCAL_SCRIPT_MODEL_FILES,
  withOpeningFrameGuide
} from "./comfyScriptProjectClient";

const offlineProgressMonitor = {
  watch: () => undefined,
  forget: () => undefined,
  livePrompt: () => null,
  waitForSettle: () => Promise.resolve(),
  resetConnection: () => undefined
};

describe("ComfyScriptProjectClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("uses Qwen Image Edit with the master image for design variants", async () => {
    const submit = vi
      .spyOn(ComfyQwenClient.prototype, "submit")
      .mockResolvedValue("edit-1");
    vi.spyOn(ComfyQwenClient.prototype, "poll").mockResolvedValue({
      state: "finished",
      bytes: Buffer.from("edited")
    });
    const client = new ComfyScriptProjectClient("http://127.0.0.1:8188");

    await expect(
      client.runImageEdit({
        sourcePath: "C:/refs/mara.png",
        prompt: "Keep Mara identical; change only the coat",
        seed: 7
      })
    ).resolves.toEqual(Buffer.from("edited"));
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        imagePaths: ["C:/refs/mara.png"],
        prompt: "Keep Mara identical; change only the coat",
        seed: 7
      })
    );
  });

  it("busts ComfyUI's text-output cache for repeated casting requests", async () => {
    const submittedSeeds: number[] = [];
    const submittedConfigs: Array<Record<string, unknown>> = [];
    let promptNumber = 0;
    const fetchMock = vi.fn(async (input: string | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/experiment/models")) {
        return Response.json([
          { name: "clip_gguf", folders: ["C:\\ComfyUI\\models\\text_encoders"] }
        ]);
      }
      if (url.endsWith("/models/clip_gguf")) {
        return Response.json([LOCAL_SCRIPT_MODEL_FILES.llmQ3]);
      }
      if (url.endsWith("/prompt")) {
        const requestBody = typeof init?.body === "string" ? init.body : "{}";
        const body = JSON.parse(requestBody) as {
          prompt: Record<
            string,
            { inputs?: { seed?: number; value?: string } }
          >;
        };
        submittedSeeds.push(Number(body.prompt["2"].inputs?.seed));
        submittedConfigs.push(
          JSON.parse(body.prompt["1"].inputs?.value ?? "{}") as Record<
            string,
            unknown
          >
        );
        promptNumber += 1;
        return Response.json({ prompt_id: `prompt-${promptNumber}` });
      }
      const promptId = url.split("/").at(-1) ?? "";
      return Response.json({
        [promptId]: {
          status: { status_str: "success", completed: true },
          outputs: { "3": { text: ["{}"] } }
        }
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(Math, "random").mockReturnValueOnce(0.1).mockReturnValueOnce(0.2);

    const client = new ComfyScriptProjectClient(
      "http://127.0.0.1:8188",
      "qwen38-27b-q3",
      new ComfyClient("http://127.0.0.1:8188", offlineProgressMonitor)
    );
    await client.runCasting("same script");
    await client.runCasting("same script");

    expect(submittedSeeds).toEqual([
      Math.floor(0.1 * 2 ** 32),
      Math.floor(0.2 * 2 ** 32)
    ]);
    expect(new Set(submittedSeeds).size).toBe(2);
    expect(submittedConfigs).toEqual([
      expect.objectContaining({
        model_path:
          "C:\\ComfyUI\\models\\text_encoders\\Qwen3.8-27B-UD-Q3_K_XL.gguf",
        n_ctx: 32_768,
        max_tokens: 16_000
      }),
      expect.objectContaining({
        model_path:
          "C:\\ComfyUI\\models\\text_encoders\\Qwen3.8-27B-UD-Q3_K_XL.gguf",
        n_ctx: 32_768,
        max_tokens: 16_000
      })
    ]);
  });

  it("uses Comfy V3 autogrow paths for MiniMax H3 references", () => {
    const inputs = buildMiniMaxH3ReferenceInputs(["20", "21"], ["40", "41"]);

    expect(inputs).toEqual({
      "ref_images.ref_image_0": ["20", 0],
      "ref_images.ref_image_1": ["21", 0],
      "ref_videos.ref_video_0": ["40", 0],
      "ref_video_audios.ref_video_audio_0": ["40", 2],
      "ref_videos.ref_video_1": ["41", 0],
      "ref_video_audios.ref_video_audio_1": ["41", 2]
    });
    expect(Object.keys(inputs)).not.toContain("ref_image_1");
  });

  it.each([2, 4, 8] as const)(
    "builds the supplied FastH3 baseline for the %i-step preset",
    (steps) => {
      const graph = buildMiniMaxH3Graph({
        prompt: "move naturally",
        width: 1280,
        height: 736,
        length: 243,
        steps,
        noiseSeed: 123_456,
        referenceInputs: { "ref_images.ref_image_0": ["20", 0] }
      });

      expect(graph["2"]).toEqual({
        class_type: "LoraLoaderModelOnly",
        inputs: {
          model: ["1", 0],
          lora_name: MINIMAX_H3_STEP_LORAS[steps].loraFile,
          strength_model: 1
        }
      });
      expect(graph["3"]).toEqual({
        class_type: "MiniMaxChunkFeedForward",
        inputs: { model: ["2", 0], chunks: 4, seq_threshold: 4096 }
      });
      expect(graph["5"].inputs.clip_name).toBe(
        LOCAL_SCRIPT_MODEL_FILES.videoClipVanilla
      );
      expect(graph["8"].inputs).toMatchObject({
        ref_image_size: "match",
        "ref_images.ref_image_0": ["20", 0]
      });
      expect(graph["9"]).toEqual({
        class_type: "RandomNoise",
        inputs: { noise_seed: 123_456 }
      });
      expect(graph["10"]).toEqual({
        class_type: "BasicGuider",
        inputs: { model: ["4", 0], conditioning: ["8", 0] }
      });
      expect(graph["12"].inputs).toMatchObject({
        model: ["4", 0],
        scheduler: "simple",
        steps,
        denoise: 1
      });
      expect(graph["13"].class_type).toBe("SamplerCustomAdvanced");
      expect(graph["13"].inputs.sigmas).toEqual(["12", 0]);
      expect(graph["14"].inputs.samples).toEqual(["13", 0]);
      expect(graph["15"].inputs.samples).toEqual(["13", 0]);
      expect(graph["17"].inputs).toMatchObject({
        format: "auto",
        "format.codec": "h264",
        "format.codec.encoding": "re-encode",
        "format.codec.encoding.crf": LOCAL_SCRIPT_VIDEO_CRF
      });
      expect(Object.values(graph).map((node) => node.class_type)).not.toContain(
        "DisableNoise"
      );
    }
  );

  it("uses the HD step LoRA instead of the retired PDD accelerator at eight steps", () => {
    const graph = buildMiniMaxH3Graph({
      prompt: "move naturally",
      width: 1280,
      height: 736,
      length: 243,
      steps: 8,
      noiseSeed: 123_456,
      referenceInputs: { "ref_images.ref_image_0": ["20", 0] }
    });

    expect(graph["2"].inputs.lora_name).toBe(
      "pika_h3_flex_turbo_8step_hd_ref2va.safetensors"
    );
    expect(graph["12"].inputs.steps).toBe(8);
    expect(Object.values(graph).map((node) => node.class_type)).not.toContain(
      "MiniMaxH3PDDAccApply"
    );
  });

  it.each([2, 4, 8] as const)(
    "builds the legacy KSampler workflow with the %i-step preset",
    (steps) => {
      const graph = buildMiniMaxH3Graph({
        prompt: "move naturally",
        width: 1280,
        height: 736,
        length: 90,
        steps,
        noiseSeed: 654_321,
        workflow: "legacy_ksampler",
        referenceInputs: { "ref_images.ref_image_0": ["20", 0] }
      });

      expect(graph["2"].inputs).toMatchObject({
        model: ["1", 0],
        lora_name: MINIMAX_H3_STEP_LORAS[steps].loraFile
      });
      expect(graph["5"].inputs.clip_name).toBe(
        LOCAL_SCRIPT_MODEL_FILES.videoClipVanilla
      );
      expect(graph["9"]).toEqual({
        class_type: "KSampler",
        inputs: {
          model: ["4", 0],
          positive: ["8", 0],
          negative: ["8", 0],
          latent_image: ["8", 1],
          seed: 654_321,
          steps,
          cfg: 1,
          sampler_name: "euler",
          scheduler: "simple",
          denoise: 1
        }
      });
      expect(graph["10"]).toEqual({
        class_type: "LTXVSeparateAVLatent",
        inputs: { av_latent: ["9", 0] }
      });
      const nodeTypes = Object.values(graph).map((node) => node.class_type);
      expect(graph["17"].inputs).toMatchObject({
        format: "auto",
        "format.codec": "h264",
        "format.codec.encoding": "re-encode",
        "format.codec.encoding.crf": LOCAL_SCRIPT_VIDEO_CRF
      });
      expect(nodeTypes).not.toContain("MiniMaxChunkFeedForward");
      expect(nodeTypes).not.toContain("SamplerCustomAdvanced");
    }
  );

  it.each([
    ["fast_h3", "heretic", LOCAL_SCRIPT_MODEL_FILES.videoClip],
    ["fast_h3", "vanilla", LOCAL_SCRIPT_MODEL_FILES.videoClipVanilla],
    ["legacy_ksampler", "heretic", LOCAL_SCRIPT_MODEL_FILES.videoClip],
    ["legacy_ksampler", "vanilla", LOCAL_SCRIPT_MODEL_FILES.videoClipVanilla]
  ] as const)(
    "uses the %s topology with the %s text encoder",
    (workflow, textEncoder, expectedClip) => {
      const graph = buildMiniMaxH3Graph({
        prompt: "move naturally",
        width: 1280,
        height: 736,
        length: 90,
        steps: 4,
        noiseSeed: 123,
        workflow,
        textEncoder,
        referenceInputs: { "ref_images.ref_image_0": ["20", 0] }
      });

      expect(graph["5"].inputs.clip_name).toBe(expectedClip);
    }
  );

  it("uses the selected MiniMax H3 checkpoint without changing the workflow", () => {
    const graph = buildMiniMaxH3Graph({
      prompt: "dynamic sword fight",
      width: 1280,
      height: 736,
      length: 124,
      steps: 4,
      noiseSeed: 999,
      videoModel: "singularity",
      referenceInputs: { "ref_images.ref_image_0": ["20", 0] }
    });

    expect(graph["1"].inputs.unet_name).toBe(LOCAL_H3_MODELS.singularity);
    expect(graph["2"].inputs.lora_name).toBe(MINIMAX_H3_STEP_LORAS[4].loraFile);
    expect(graph["8"].class_type).toBe("MiniMaxH3ReferenceToVideo");
  });
});

describe("withOpeningFrameGuide", () => {
  it.each(["fast_h3", "legacy_ksampler"] as const)(
    "pins the predecessor's last frame as frame 0 of the %s render",
    (workflow) => {
      const graph = withOpeningFrameGuide(
        buildMiniMaxH3Graph({
          prompt: "hold the frame",
          width: 1280,
          height: 736,
          length: 121,
          steps: 4,
          noiseSeed: 1,
          workflow,
          referenceInputs: { "ref_images.ref_image_0": ["20", 0] }
        }),
        "last-frame.png"
      );

      expect(graph["59"]).toEqual({
        class_type: "LoadImage",
        inputs: { image: "last-frame.png" }
      });
      expect(graph["60"]).toEqual({
        class_type: "MiniMaxH3AddGuide",
        inputs: {
          positive: ["8", 0],
          latent: ["8", 1],
          vae: ["6", 0],
          image: ["59", 0],
          frame_idx: 0
        }
      });
      const guidedConditioningLinks = Object.values(graph).flatMap((node) =>
        ["conditioning", "positive"].flatMap((inputName) =>
          node === graph["60"] ? [] : [node.inputs[inputName]]
        )
      );
      expect(guidedConditioningLinks).toContainEqual(["60", 0]);
      expect(guidedConditioningLinks).not.toContainEqual(["8", 0]);
    }
  );
});
