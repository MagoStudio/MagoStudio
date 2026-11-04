/* oxlint-disable eslint/no-magic-numbers -- model graph parameters mirror the tested/official Comfy workflows */
import path from "node:path";

import type { LocalScriptTextModel } from "../../shared/contracts";
import {
  MINIMAX_H3_HD_STEPS,
  MINIMAX_H3_STEP_LORAS,
  type MiniMaxH3StepLoraSteps
} from "../../shared/minimaxH3StepLoras";
import { asRecord as record } from "../comfy/asRecord";
import { ComfyClient } from "../comfy/ComfyClient";
import type { ComfyGraph } from "../comfy/comfyGraph";
import { findComfyOutputFile } from "../comfy/findComfyOutputFile";
import {
  clampMiniMaxH3Dimension,
  MINIMAX_H3_SHARED_MODEL_FILES,
  snapMiniMaxH3LengthFrames
} from "../comfy/minimaxH3Shared";
import {
  buildFlux2KleinGraph,
  ComfyQwenClient
} from "../imageRenders/comfyQwenClient";
import {
  buildLocalVideoSaveInputs,
  LOCAL_VIDEO_RENDER_CRF
} from "../imageRenders/comfyVideoSave";

const RUN_TIMEOUT_MS = 3 * 60 * 60 * 1000;
const SCRIPT_POLL_INTERVAL_MS = 2000;
const MAX_MEDIA_BYTES = 2 * 1024 * 1024 * 1024;

export const LOCAL_SCRIPT_MODEL_FILES = {
  llmQ5: "Qwen3.8-27B-UD-Q5_K_XL.gguf",
  llmQ3: "Qwen3.8-27B-UD-Q3_K_XL.gguf",
  imageUnet: "qwen-image-2512-Q5_K_M.gguf",
  imageClip: "qwen_2.5_vl_7b_fp8_scaled.safetensors",
  imageVae: "qwen_image_vae.safetensors",
  imageLora: "Qwen-Image-2512-Lightning-4steps-V1.0-fp32.safetensors",
  videoUnet: MINIMAX_H3_SHARED_MODEL_FILES.unet,
  videoUnetSingularity:
    "Minimax-h3_Singularity_ref2va_Pruned_v1.3_int8.safetensors",
  videoClip: "qwen3vl_32b_h3_ultra_uncensored_heretic_int8_convrot.safetensors",
  videoClipVanilla: MINIMAX_H3_SHARED_MODEL_FILES.textEncoderVanilla,
  videoVae: MINIMAX_H3_SHARED_MODEL_FILES.videoVae,
  audioVae: MINIMAX_H3_SHARED_MODEL_FILES.audioVae
} as const;

export const LOCAL_SCRIPT_TEXT_MODEL_FILES: Record<
  LocalScriptTextModel,
  string
> = {
  "qwen38-27b-q5": LOCAL_SCRIPT_MODEL_FILES.llmQ5,
  "qwen38-27b-q3": LOCAL_SCRIPT_MODEL_FILES.llmQ3
};

export type LocalH3Steps = MiniMaxH3StepLoraSteps;
export type LocalH3TextEncoder = "heretic" | "vanilla";
export type LocalH3Model = "base" | "singularity";

export const LOCAL_H3_MODELS: Record<LocalH3Model, string> = {
  base: LOCAL_SCRIPT_MODEL_FILES.videoUnet,
  singularity: LOCAL_SCRIPT_MODEL_FILES.videoUnetSingularity
};

export type LocalScriptImageModel =
  | "qwen_image_2512_local"
  | "flux2_klein_4b_q8_local"
  | "flux2_klein_9b_q8_local";

export const resolveLocalScriptImageModel = (
  value: unknown
): LocalScriptImageModel =>
  value === "flux2_klein_4b_q8_local" || value === "flux2_klein_9b_q8_local"
    ? value
    : "qwen_image_2512_local";

export const LOCAL_H3_TEXT_ENCODERS: Record<LocalH3TextEncoder, string> = {
  heretic: LOCAL_SCRIPT_MODEL_FILES.videoClip,
  vanilla: LOCAL_SCRIPT_MODEL_FILES.videoClipVanilla
};

export const LOCAL_SCRIPT_VIDEO_CRF = LOCAL_VIDEO_RENDER_CRF;

const sleep = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const findString = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findString(item);
      if (found) return found;
    }
    return null;
  }
  const item = record(value);
  if (!item) return null;
  for (const child of Object.values(item)) {
    const found = findString(child);
    if (found) return found;
  }
  return null;
};

const clampDimension = (value: number | undefined, fallback: number): number =>
  Math.max(256, Math.min(1536, Math.round((value ?? fallback) / 32) * 32));

export const buildMiniMaxH3ReferenceInputs = (
  imageNodeIds: string[],
  videoNodeIds: string[]
): Record<string, unknown> => {
  const inputs: Record<string, unknown> = {};
  imageNodeIds.forEach((nodeId, index) => {
    // MiniMaxH3ReferenceToVideo uses Comfy V3 Autogrow inputs. API prompts
    // address those as dotted, zero-based paths; Comfy nests them into the
    // `ref_images` dictionary passed to execute().
    inputs[`ref_images.ref_image_${index}`] = [nodeId, 0];
  });
  videoNodeIds.forEach((nodeId, index) => {
    inputs[`ref_videos.ref_video_${index}`] = [nodeId, 0];
    inputs[`ref_video_audios.ref_video_audio_${index}`] = [nodeId, 2];
  });
  return inputs;
};

type ComfyGraphNode = {
  class_type: string;
  inputs: Record<string, unknown>;
};

type MiniMaxH3GraphInput = {
  prompt: string;
  width: number;
  height: number;
  length: number;
  steps: LocalH3Steps;
  textEncoder: LocalH3TextEncoder;
  videoModel: LocalH3Model;
  noiseSeed: number;
  referenceInputs: Record<string, unknown>;
};

const buildMiniMaxH3FastGraph = (
  input: MiniMaxH3GraphInput
): Record<string, ComfyGraphNode> => {
  return {
    "1": {
      class_type: "UNETLoader",
      inputs: {
        unet_name: LOCAL_H3_MODELS[input.videoModel],
        weight_dtype: "default"
      }
    },
    "2": {
      class_type: "LoraLoaderModelOnly",
      inputs: {
        model: ["1", 0],
        lora_name: MINIMAX_H3_STEP_LORAS[input.steps].loraFile,
        strength_model: 1
      }
    },
    "3": {
      class_type: "MiniMaxChunkFeedForward",
      inputs: {
        model: ["2", 0],
        chunks: 4,
        seq_threshold: 4096
      }
    },
    "4": {
      class_type: "MiniMaxH3SigmaShift",
      inputs: { model: ["3", 0], shift_video: 12, shift_audio: 3 }
    },
    "5": {
      class_type: "CLIPLoader",
      inputs: {
        clip_name: LOCAL_H3_TEXT_ENCODERS[input.textEncoder],
        type: "minimax",
        device: "default"
      }
    },
    "6": {
      class_type: "VAELoader",
      inputs: { vae_name: LOCAL_SCRIPT_MODEL_FILES.videoVae }
    },
    "7": {
      class_type: "VAELoader",
      inputs: { vae_name: LOCAL_SCRIPT_MODEL_FILES.audioVae }
    },
    "8": {
      class_type: "MiniMaxH3ReferenceToVideo",
      inputs: {
        clip: ["5", 0],
        vae: ["6", 0],
        audio_vae: ["7", 0],
        prompt: input.prompt,
        width: input.width,
        height: input.height,
        length: input.length,
        ref_image_size: "match",
        ...input.referenceInputs
      }
    },
    "9": {
      class_type: "RandomNoise",
      inputs: { noise_seed: input.noiseSeed }
    },
    "10": {
      class_type: "BasicGuider",
      inputs: {
        model: ["4", 0],
        conditioning: ["8", 0]
      }
    },
    "11": {
      class_type: "KSamplerSelect",
      inputs: { sampler_name: "euler" }
    },
    "12": {
      class_type: "BasicScheduler",
      inputs: {
        model: ["4", 0],
        scheduler: "simple",
        steps: input.steps,
        denoise: 1
      }
    },
    "13": {
      class_type: "SamplerCustomAdvanced",
      inputs: {
        noise: ["9", 0],
        guider: ["10", 0],
        sampler: ["11", 0],
        sigmas: ["12", 0],
        latent_image: ["8", 1]
      }
    },
    "14": {
      class_type: "VAEDecode",
      inputs: { samples: ["13", 0], vae: ["6", 0] }
    },
    "15": {
      class_type: "VAEDecodeAudio",
      inputs: { samples: ["13", 0], vae: ["7", 0] }
    },
    "16": {
      class_type: "CreateVideo",
      inputs: {
        images: ["14", 0],
        audio: ["15", 0],
        fps: 24,
        bit_depth: "auto",
        color_space: "sRGB"
      }
    },
    "17": {
      class_type: "SaveVideo",
      inputs: buildLocalVideoSaveInputs({
        filenamePrefix: "video/mago_script_h3",
        videoNodeId: "16"
      })
    }
  };
};

const buildMiniMaxH3LegacyGraph = (
  input: MiniMaxH3GraphInput
): Record<string, ComfyGraphNode> => {
  return {
    "1": {
      class_type: "UNETLoader",
      inputs: {
        unet_name: LOCAL_H3_MODELS[input.videoModel],
        weight_dtype: "default"
      }
    },
    "2": {
      class_type: "LoraLoaderModelOnly",
      inputs: {
        model: ["1", 0],
        lora_name: MINIMAX_H3_STEP_LORAS[input.steps].loraFile,
        strength_model: 1
      }
    },
    "4": {
      class_type: "MiniMaxH3SigmaShift",
      inputs: { model: ["2", 0], shift_video: 12, shift_audio: 3 }
    },
    "5": {
      class_type: "CLIPLoader",
      inputs: {
        clip_name: LOCAL_H3_TEXT_ENCODERS[input.textEncoder],
        type: "minimax",
        device: "default"
      }
    },
    "6": {
      class_type: "VAELoader",
      inputs: { vae_name: LOCAL_SCRIPT_MODEL_FILES.videoVae }
    },
    "7": {
      class_type: "VAELoader",
      inputs: { vae_name: LOCAL_SCRIPT_MODEL_FILES.audioVae }
    },
    "8": {
      class_type: "MiniMaxH3ReferenceToVideo",
      inputs: {
        clip: ["5", 0],
        vae: ["6", 0],
        audio_vae: ["7", 0],
        prompt: input.prompt,
        width: input.width,
        height: input.height,
        length: input.length,
        ref_image_size: "match",
        ...input.referenceInputs
      }
    },
    "9": {
      class_type: "KSampler",
      inputs: {
        model: ["4", 0],
        positive: ["8", 0],
        negative: ["8", 0],
        latent_image: ["8", 1],
        seed: input.noiseSeed,
        steps: input.steps,
        cfg: 1,
        sampler_name: "euler",
        scheduler: "simple",
        denoise: 1
      }
    },
    "10": {
      class_type: "LTXVSeparateAVLatent",
      inputs: { av_latent: ["9", 0] }
    },
    "14": {
      class_type: "VAEDecode",
      inputs: { samples: ["10", 0], vae: ["6", 0] }
    },
    "15": {
      class_type: "VAEDecodeAudio",
      inputs: { samples: ["10", 1], vae: ["7", 0] }
    },
    "16": {
      class_type: "CreateVideo",
      inputs: {
        images: ["14", 0],
        audio: ["15", 0],
        fps: 24,
        bit_depth: "auto",
        color_space: "sRGB"
      }
    },
    "17": {
      class_type: "SaveVideo",
      inputs: buildLocalVideoSaveInputs({
        filenamePrefix: "video/mago_script_h3_legacy",
        videoNodeId: "16"
      })
    }
  };
};

export const buildMiniMaxH3Graph = (
  input: Omit<MiniMaxH3GraphInput, "textEncoder" | "videoModel"> & {
    workflow?: "fast_h3" | "legacy_ksampler";
    textEncoder?: LocalH3TextEncoder;
    videoModel?: LocalH3Model;
  }
): Record<string, ComfyGraphNode> => {
  const normalizedInput = {
    ...input,
    textEncoder: input.textEncoder ?? "vanilla",
    videoModel: input.videoModel ?? "base"
  };
  return input.workflow === "legacy_ksampler"
    ? buildMiniMaxH3LegacyGraph(normalizedInput)
    : buildMiniMaxH3FastGraph(normalizedInput);
};

const OPENING_FRAME_IMAGE_NODE_ID = "59";
const OPENING_FRAME_GUIDE_NODE_ID = "60";
const REFERENCE_TO_VIDEO_NODE_ID = "8";
const GUIDED_CONDITIONING_INPUT_NAMES = ["conditioning", "positive"];

const isReferenceToVideoConditioning = (value: unknown) =>
  Array.isArray(value) &&
  value[0] === REFERENCE_TO_VIDEO_NODE_ID &&
  value[1] === 0;

/** A `pin` shot opens on the predecessor's last frame: MiniMaxH3AddGuide at frame 0
 *  (as on the cloud), wired as the editor's
 *  source-clip guide is (imageRenders/comfyMiniMaxH3Client.ts). */
export const withOpeningFrameGuide = (
  graph: Record<string, ComfyGraphNode>,
  openingFrameImage: string
): Record<string, ComfyGraphNode> => {
  const guidedGraph = Object.fromEntries(
    Object.entries(graph).map(([nodeId, node]) => [
      nodeId,
      {
        ...node,
        inputs: Object.fromEntries(
          Object.entries(node.inputs).map(([inputName, value]) => [
            inputName,
            GUIDED_CONDITIONING_INPUT_NAMES.includes(inputName) &&
            isReferenceToVideoConditioning(value)
              ? [OPENING_FRAME_GUIDE_NODE_ID, 0]
              : value
          ])
        )
      }
    ])
  );
  return {
    ...guidedGraph,
    [OPENING_FRAME_IMAGE_NODE_ID]: {
      class_type: "LoadImage",
      inputs: { image: openingFrameImage }
    },
    [OPENING_FRAME_GUIDE_NODE_ID]: {
      class_type: "MiniMaxH3AddGuide",
      inputs: {
        positive: [REFERENCE_TO_VIDEO_NODE_ID, 0],
        latent: [REFERENCE_TO_VIDEO_NODE_ID, 1],
        vae: ["6", 0],
        image: [OPENING_FRAME_IMAGE_NODE_ID, 0],
        frame_idx: 0
      }
    }
  };
};

export class ComfyScriptProjectClient {
  private readonly endpoint: string;
  private readonly comfy: ComfyClient;

  constructor(
    endpoint: string,
    private readonly scriptTextModel: LocalScriptTextModel = "qwen38-27b-q5",
    comfy?: ComfyClient
  ) {
    this.comfy = comfy ?? new ComfyClient(endpoint);
    this.endpoint = this.comfy.endpoint;
  }

  async runCasting(
    prompt: string,
    isCancelled?: () => boolean
  ): Promise<string> {
    // Casting is the one long Qwen task. direct_clean preserves the model's
    // supported low-thinking mode without the custom node's fixed five-minute
    // subprocess cutoff, and unloads the model when the response is complete.
    return this.runQwen(prompt, 16_000, isCancelled, "direct_clean");
  }

  async runPromptAdaptation(
    prompt: string,
    isCancelled?: () => boolean
  ): Promise<string> {
    return this.runQwen(prompt, 4600, isCancelled);
  }

  /** One shot's six-section H3 document (the cloud composer's model
   *  call): a 350-500 word description plus five sections, after reasoning. */
  async runVideoPrompt(
    prompt: string,
    isCancelled?: () => boolean
  ): Promise<string> {
    return this.runQwen(prompt, 8000, isCancelled);
  }

  /** One script-chat turn. A `write_script` answer carries a whole script, so
   *  it gets casting's budget and mode rather than a short reply's. */
  async runScriptChat(prompt: string): Promise<string> {
    return this.runQwen(prompt, 16_000, undefined, "direct_clean");
  }

  private async runQwen(
    prompt: string,
    maxTokens: number,
    isCancelled?: () => boolean,
    mode: "subprocess" | "direct_clean" = "subprocess"
  ): Promise<string> {
    const modelPath = await this.resolveTextEncoderPath(
      LOCAL_SCRIPT_TEXT_MODEL_FILES[this.scriptTextModel]
    );
    const config = JSON.stringify({
      model_path: modelPath,
      system_prompt:
        "Return only valid JSON after completing brief internal reasoning. The final answer's first character must be { and its last must be }.",
      // Casting prompts contain the full screenplay plus the production
      // schema. Keep enough combined context for a complete 16k-token answer.
      n_ctx: 32_768,
      n_batch: 512,
      n_ubatch: 512,
      n_keep: 256,
      n_gpu_layers: -1,
      offload_kqv: true,
      use_mmap: false,
      max_tokens: maxTokens,
      temperature: 0.1,
      top_p: 0.95,
      top_k: 40,
      min_p: 0.05,
      repeat_penalty: 1.05,
      enable_thinking: true,
      force_reasoning: true,
      speculative_enabled: true,
      speculative_type: 3,
      draft_n_max: 3,
      draft_p_min: 0,
      raw_mode: true,
      prompt_template:
        "<|im_start|>system\nReasoning effort is set to low. Keep your thinking brief and focused, moving directly to the conclusion without unnecessary elaboration.\n\n{system}<|im_end|>\n<|im_start|>user\n{images}{user}<|im_end|>\n<|im_start|>assistant\n<think>\n",
      stop: '["<|im_end|>"]',
      remove_thinking: true,
      force_mmproj: false,
      debug: false,
      verbose: false,
      force_gc_unload: true
    });
    const graph = {
      "1": {
        class_type: "PrimitiveStringMultiline",
        inputs: { value: config }
      },
      "2": {
        class_type: "SimpleQwenVLggufV2",
        inputs: {
          config_override: ["1", 0],
          model_preset: "None",
          system_preset: "None",
          user_prompt: prompt,
          // ComfyUI caches an identical graph, including the model's text
          // output. A fixed seed made every retry reuse the first malformed
          // casting response and finish in 0 seconds instead of asking Qwen
          // again. Casting is not user-seeded, so every request must be fresh.
          seed: Math.floor(Math.random() * 2 ** 32),
          unload_all_models: true,
          mode,
          bypass: false
        }
      },
      "3": { class_type: "PreviewAny", inputs: { source: ["2", 0] } }
    };
    const outputs = await this.submitAndWait(graph, isCancelled);
    const output = record(outputs["3"]);
    const text = findString(output);
    if (!text) throw new Error("Qwen3.8 completed without text output");
    if (text.trimStart().startsWith("❌")) {
      throw new Error(text.trim());
    }
    return text;
  }

  async runImage(input: {
    prompt: string;
    model?: LocalScriptImageModel;
    width?: number;
    height?: number;
    seed?: number;
    isCancelled?: () => boolean;
  }): Promise<Buffer> {
    const width = clampDimension(input.width, 1024);
    const height = clampDimension(input.height, 1024);
    const imageModel = resolveLocalScriptImageModel(input.model);
    if (
      imageModel === "flux2_klein_4b_q8_local" ||
      imageModel === "flux2_klein_9b_q8_local"
    ) {
      const graph = buildFlux2KleinGraph({
        setup:
          imageModel === "flux2_klein_4b_q8_local"
            ? "flux2-klein-4b-q8"
            : "flux2-klein-9b-q8",
        prompt: input.prompt,
        width,
        height,
        seed: input.seed ?? Math.floor(Math.random() * 2 ** 32)
      });
      const outputs = await this.submitAndWait(graph, input.isCancelled);
      return this.downloadOutput(outputs, "37");
    }
    const graph = {
      "1": {
        class_type: "UnetLoaderGGUF",
        inputs: { unet_name: LOCAL_SCRIPT_MODEL_FILES.imageUnet }
      },
      "2": {
        class_type: "CLIPLoader",
        inputs: {
          clip_name: LOCAL_SCRIPT_MODEL_FILES.imageClip,
          type: "qwen_image",
          device: "default"
        }
      },
      "3": {
        class_type: "VAELoader",
        inputs: { vae_name: LOCAL_SCRIPT_MODEL_FILES.imageVae }
      },
      "4": {
        class_type: "LoraLoaderModelOnly",
        inputs: {
          model: ["1", 0],
          lora_name: LOCAL_SCRIPT_MODEL_FILES.imageLora,
          strength_model: 1
        }
      },
      "5": {
        class_type: "ModelSamplingAuraFlow",
        inputs: { model: ["4", 0], shift: 3.1 }
      },
      "6": {
        class_type: "CLIPTextEncode",
        inputs: { clip: ["2", 0], text: input.prompt }
      },
      "7": {
        class_type: "CLIPTextEncode",
        inputs: {
          clip: ["2", 0],
          text: "low resolution, low quality, malformed anatomy, distorted text, cluttered composition"
        }
      },
      "8": {
        class_type: "EmptySD3LatentImage",
        inputs: { width, height, batch_size: 1 }
      },
      "9": {
        class_type: "KSampler",
        inputs: {
          model: ["5", 0],
          positive: ["6", 0],
          negative: ["7", 0],
          latent_image: ["8", 0],
          seed: input.seed ?? Math.floor(Math.random() * 2 ** 32),
          steps: 4,
          cfg: 1,
          sampler_name: "euler",
          scheduler: "simple",
          denoise: 1
        }
      },
      "10": {
        class_type: "VAEDecode",
        inputs: { samples: ["9", 0], vae: ["3", 0] }
      },
      "11": { class_type: "PreviewImage", inputs: { images: ["10", 0] } }
    };
    const outputs = await this.submitAndWait(graph, input.isCancelled);
    return this.downloadOutput(outputs, "11");
  }

  async runImageEdit(input: {
    sourcePath: string;
    /** Further reference images after the source, as the edit model's extra inputs. */
    referencePaths?: string[];
    outputSize?: [number, number];
    prompt: string;
    model?: LocalScriptImageModel;
    seed?: number;
    isCancelled?: () => boolean;
  }): Promise<Buffer> {
    const imageModel = resolveLocalScriptImageModel(input.model);
    const client = new ComfyQwenClient(
      this.endpoint,
      imageModel === "flux2_klein_4b_q8_local"
        ? "flux2-klein-4b-q8"
        : imageModel === "flux2_klein_9b_q8_local"
          ? "flux2-klein-9b-q8"
          : undefined
    );
    const promptId = await client.submit({
      imagePaths: [input.sourcePath, ...(input.referencePaths ?? [])],
      ...(input.outputSize ? { outputSize: input.outputSize } : {}),
      prompt: input.prompt,
      negativePrompt:
        "different identity, different face, different body proportions, changed composition, duplicate subject, low resolution, low quality",
      seed: input.seed
    });
    const deadline = Date.now() + RUN_TIMEOUT_MS;
    while (Date.now() < deadline) {
      if (input.isCancelled?.()) {
        await client.cancel(promptId).catch(() => undefined);
        throw new Error("Local image edit was cancelled");
      }
      const result = await client.poll(promptId);
      if (result.state === "finished") return result.bytes;
      if (result.state === "error") throw new Error(result.message);
      await sleep(500);
    }
    await client.cancel(promptId).catch(() => undefined);
    throw new Error("Qwen Image Edit timed out");
  }

  async runVideo(input: {
    prompt: string;
    referencePaths: string[];
    referenceVideos?: Array<{
      path: string;
      skipFrames: number;
      frameCount: number;
    }>;
    width?: number;
    height?: number;
    durationSeconds?: number;
    steps?: LocalH3Steps;
    useLegacyWorkflow?: boolean;
    textEncoder?: LocalH3TextEncoder;
    videoModel?: LocalH3Model;
    openingFramePath?: string;
    isCancelled?: () => boolean;
  }): Promise<Buffer> {
    if (!input.referencePaths.length && !input.referenceVideos?.length)
      throw new Error("MiniMax H3 requires at least one reference");
    const uploaded = await Promise.all(
      input.referencePaths
        .slice(0, 9)
        .map((file, index) => this.comfy.uploadFile(file))
    );
    const uploadedVideos = await Promise.all(
      (input.referenceVideos ?? []).slice(0, 3).map(async (video, index) => ({
        ...video,
        uploaded: await this.comfy.uploadFile(video.path)
      }))
    );
    const graph: Record<string, ComfyGraphNode> = {};
    const imageNodeIds: string[] = [];
    uploaded.forEach((image, index) => {
      const id = String(20 + index);
      graph[id] = { class_type: "LoadImage", inputs: { image } };
      imageNodeIds.push(id);
    });
    const videoNodeIds: string[] = [];
    uploadedVideos.forEach((video, index) => {
      const id = String(40 + index);
      graph[id] = {
        class_type: "VHS_LoadVideo",
        inputs: {
          video: video.uploaded,
          force_rate: 24,
          custom_width: 0,
          custom_height: 0,
          frame_load_cap: video.frameCount,
          skip_first_frames: video.skipFrames,
          select_every_nth: 1
        }
      };
      videoNodeIds.push(id);
    });
    const referenceInputs = buildMiniMaxH3ReferenceInputs(
      imageNodeIds,
      videoNodeIds
    );
    const length = snapMiniMaxH3LengthFrames(input.durationSeconds ?? 5);
    const openingFrameImage = input.openingFramePath
      ? await this.comfy.uploadFile(input.openingFramePath)
      : null;
    Object.assign(
      graph,
      buildMiniMaxH3Graph({
        prompt: input.prompt,
        width: clampMiniMaxH3Dimension(input.width ?? 768),
        height: clampMiniMaxH3Dimension(input.height ?? 432),
        length,
        steps: input.steps ?? MINIMAX_H3_HD_STEPS,
        noiseSeed: Math.floor(Math.random() * 2 ** 32),
        workflow: input.useLegacyWorkflow ? "legacy_ksampler" : "fast_h3",
        textEncoder: input.textEncoder ?? "vanilla",
        videoModel: input.videoModel ?? "base",
        referenceInputs
      })
    );
    const submittedGraph = openingFrameImage
      ? withOpeningFrameGuide(graph, openingFrameImage)
      : graph;
    const outputs = await this.submitAndWait(submittedGraph, input.isCancelled);
    return this.downloadOutput(outputs, "17");
  }

  private async resolveTextEncoderPath(filename: string): Promise<string> {
    const [folderResponse, filesResponse] = await Promise.all([
      this.comfy.request("/experiment/models", { method: "GET" }),
      this.comfy.request("/models/clip_gguf", { method: "GET" })
    ]);
    const folders = (await folderResponse.json()) as unknown;
    const files = (await filesResponse.json()) as unknown;
    if (
      !Array.isArray(files) ||
      !files.some(
        (candidate) =>
          typeof candidate === "string" &&
          path.basename(candidate).toLowerCase() === filename.toLowerCase()
      )
    ) {
      throw new Error(`ComfyUI is missing the local script model ${filename}`);
    }
    const textEncoders = Array.isArray(folders)
      ? folders.find((candidate) => record(candidate)?.name === "clip_gguf")
      : null;
    const candidates = record(textEncoders)?.folders;
    if (!Array.isArray(candidates) || !candidates.length) {
      throw new Error(
        "ComfyUI did not expose its text-encoder folder; update ComfyUI before using local script casting"
      );
    }
    const folder = candidates.find(
      (candidate): candidate is string => typeof candidate === "string"
    );
    if (!folder) throw new Error("ComfyUI text-encoder folder is unavailable");
    const separator = folder.includes("\\") ? "\\" : "/";
    return `${folder.replace(/[\\/]$/, "")}${separator}${filename}`;
  }

  private async submitAndWait(
    graph: ComfyGraph,
    isCancelled?: () => boolean
  ): Promise<Record<string, unknown>> {
    const promptId = await this.comfy.submitGraph(graph);
    const outcome = await this.comfy.waitForPrompt(promptId, {
      timeoutMs: RUN_TIMEOUT_MS,
      pollIntervalMs: SCRIPT_POLL_INTERVAL_MS,
      isCancelled
    });
    if (outcome.kind === "cancelled") {
      await this.comfy.cancel(promptId).catch(() => undefined);
      throw new Error("Local plan cancelled");
    }
    if (outcome.kind === "timedOut") {
      this.comfy.forgetPrompt(promptId);
      throw new Error("ComfyUI did not finish the local script job in time");
    }
    return outcome.outputs;
  }

  private async downloadOutput(
    outputs: Record<string, unknown>,
    outputNode: string
  ): Promise<Buffer> {
    const reference = findComfyOutputFile(outputs, outputNode);
    if (!reference) throw new Error("ComfyUI completed without a media output");
    return this.comfy.downloadBuffer(reference, {
      maxBytes: MAX_MEDIA_BYTES,
      defaultType: "output"
    });
  }
}
