import { nativeImage } from "electron";

import { ComfyClient } from "../comfy/ComfyClient";
import type { ComfyGraph, ComfyGraphNode } from "../comfy/comfyGraph";
import { findComfyOutputFile } from "../comfy/findComfyOutputFile";

import {
  buildQwenImageEditGraph,
  MAX_QWEN_IMAGE_EDIT_REFERENCES,
  QWEN_IMAGE_EDIT_OUTPUT_NODE_ID
} from "./buildQwenImageEditGraph";

const MAX_IMAGE_OUTPUT_BYTES = 67_108_864;
const RANDOM_SEED_BITS = 32;
const DEFAULT_FLUX_OUTPUT_SIZE = 1024;
const FLUX2_KLEIN_OUTPUT_NODE_ID = "37";
const FLUX_LOAD_NODE_BASE = 100;
const FLUX_SCALE_NODE_BASE = 110;
const FLUX_ENCODE_NODE_BASE = 120;
const FLUX_POSITIVE_NODE_BASE = 130;
const FLUX_NEGATIVE_NODE_BASE = 140;

export const QWEN_MODEL_FILES = {
  unet: "qwen_image_edit_2511_int8_convrot.safetensors",
  clip: "qwen_2.5_vl_7b_fp8_scaled.safetensors",
  vae: "qwen_image_vae.safetensors",
  lora: "Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16.safetensors"
} as const;

export const QWEN_Q5_4STEP_MODEL_FILES = {
  unet: "Qwen-Image-Edit-2511-Q5_K_M.gguf",
  clip: QWEN_MODEL_FILES.clip,
  vae: QWEN_MODEL_FILES.vae,
  lora: "Qwen-Image-Edit-2511-Lightning-4steps-V1.0-bf16.safetensors"
} as const;

export const FLUX2_KLEIN_MODEL_FILES = {
  "flux2-klein-4b-q8": {
    unet: "flux-2-klein-4b-Q8_0.gguf",
    clip: "qwen_3_4b.safetensors",
    vae: "flux2-vae.safetensors"
  },
  "flux2-klein-9b-q8": {
    unet: "flux-2-klein-9b-Q8_0.gguf",
    clip: "qwen_3_8b_fp8mixed.safetensors",
    vae: "flux2-vae.safetensors"
  }
} as const;

export const QWEN_IMAGE_EDIT_SETUP_VALUES = [
  "native-int8-8step",
  "gguf-q5-4step",
  "flux2-klein-4b-q8",
  "flux2-klein-9b-q8"
] as const;

export type QwenImageEditSetup = (typeof QWEN_IMAGE_EDIT_SETUP_VALUES)[number];

export const DEFAULT_QWEN_IMAGE_EDIT_SETUP: QwenImageEditSetup =
  "gguf-q5-4step";

export const resolveQwenImageEditSetup = (
  value: unknown
): QwenImageEditSetup =>
  typeof value === "string" &&
  QWEN_IMAGE_EDIT_SETUP_VALUES.includes(value as QwenImageEditSetup)
    ? (value as QwenImageEditSetup)
    : DEFAULT_QWEN_IMAGE_EDIT_SETUP;

export const qwenImageEditSetupConfig = (value: unknown) => {
  const setup = resolveQwenImageEditSetup(value);
  if (setup === "flux2-klein-4b-q8" || setup === "flux2-klein-9b-q8") {
    return {
      engine: "flux2" as const,
      setup,
      files: FLUX2_KLEIN_MODEL_FILES[setup],
      unetLoader: "UnetLoaderGGUF" as const,
      steps: 4
    };
  }
  return setup === "gguf-q5-4step"
    ? {
        engine: "qwen" as const,
        setup,
        files: QWEN_Q5_4STEP_MODEL_FILES,
        unetLoader: "UnetLoaderGGUF" as const,
        steps: 4
      }
    : {
        engine: "qwen" as const,
        setup,
        files: QWEN_MODEL_FILES,
        unetLoader: "UNETLoader" as const,
        steps: 8
      };
};

export const buildFlux2KleinGraph = ({
  setup,
  references = [],
  prompt,
  width,
  height,
  seed,
  useReferenceSize = true
}: {
  setup: "flux2-klein-4b-q8" | "flux2-klein-9b-q8";
  references?: string[];
  prompt: string;
  width: number;
  height: number;
  seed: number;
  useReferenceSize?: boolean;
}): Record<string, ComfyGraphNode> => {
  const files = FLUX2_KLEIN_MODEL_FILES[setup];
  const graph: Record<string, ComfyGraphNode> = {
    "1": {
      class_type: "UnetLoaderGGUF",
      inputs: { unet_name: files.unet }
    },
    "2": {
      class_type: "CLIPLoader",
      inputs: { clip_name: files.clip, type: "flux2", device: "default" }
    },
    "3": {
      class_type: "VAELoader",
      inputs: { vae_name: files.vae }
    },
    "4": {
      class_type: "CLIPTextEncode",
      inputs: { clip: ["2", 0], text: prompt }
    },
    "5": {
      class_type: "ConditioningZeroOut",
      inputs: { conditioning: ["4", 0] }
    },
    "6": {
      class_type: "RandomNoise",
      inputs: { noise_seed: Math.max(0, seed) }
    },
    "8": {
      class_type: "KSamplerSelect",
      inputs: { sampler_name: "euler" }
    }
  };

  let positive: [string, number] = ["4", 0];
  let negative: [string, number] = ["5", 0];
  let outputWidth: number | [string, number] = width;
  let outputHeight: number | [string, number] = height;

  references.forEach((image, index) => {
    const loadId = String(FLUX_LOAD_NODE_BASE + index);
    const scaleId = String(FLUX_SCALE_NODE_BASE + index);
    const encodeId = String(FLUX_ENCODE_NODE_BASE + index);
    const positiveId = String(FLUX_POSITIVE_NODE_BASE + index);
    const negativeId = String(FLUX_NEGATIVE_NODE_BASE + index);
    graph[loadId] = { class_type: "LoadImage", inputs: { image } };
    graph[scaleId] = {
      class_type: "ImageScaleToTotalPixels",
      inputs: {
        image: [loadId, 0],
        upscale_method: "nearest-exact",
        megapixels: 1,
        resolution_steps: 1
      }
    };
    graph[encodeId] = {
      class_type: "VAEEncode",
      inputs: { pixels: [scaleId, 0], vae: ["3", 0] }
    };
    graph[positiveId] = {
      class_type: "ReferenceLatent",
      inputs: { conditioning: positive, latent: [encodeId, 0] }
    };
    graph[negativeId] = {
      class_type: "ReferenceLatent",
      inputs: { conditioning: negative, latent: [encodeId, 0] }
    };
    positive = [positiveId, 0];
    negative = [negativeId, 0];
    if (index === 0 && useReferenceSize) {
      graph["150"] = {
        class_type: "GetImageSize",
        inputs: { image: [scaleId, 0] }
      };
      outputWidth = ["150", 0];
      outputHeight = ["150", 1];
    }
  });

  Object.assign(graph, {
    "7": {
      class_type: "CFGGuider",
      inputs: { model: ["1", 0], positive, negative, cfg: 1 }
    },
    "9": {
      class_type: "Flux2Scheduler",
      inputs: { steps: 4, width: outputWidth, height: outputHeight }
    },
    "10": {
      class_type: "EmptyFlux2LatentImage",
      inputs: { width: outputWidth, height: outputHeight, batch_size: 1 }
    },
    "11": {
      class_type: "SamplerCustomAdvanced",
      inputs: {
        noise: ["6", 0],
        guider: ["7", 0],
        sampler: ["8", 0],
        sigmas: ["9", 0],
        latent_image: ["10", 0]
      }
    },
    "12": {
      class_type: "VAEDecode",
      inputs: { samples: ["11", 0], vae: ["3", 0] }
    },
    [FLUX2_KLEIN_OUTPUT_NODE_ID]: {
      class_type: "PreviewImage",
      inputs: { images: ["12", 0] }
    }
  });
  return graph;
};

export type ComfyPollResult =
  | { state: "queued" | "running" }
  | { state: "finished"; bytes: Buffer }
  | { state: "error"; message: string };

export class ComfyQwenClient {
  readonly endpoint: string;
  private readonly comfy: ComfyClient;

  constructor(
    endpoint: string,
    private readonly setup: QwenImageEditSetup = DEFAULT_QWEN_IMAGE_EDIT_SETUP,
    comfy?: ComfyClient
  ) {
    this.comfy = comfy ?? new ComfyClient(endpoint);
    this.endpoint = this.comfy.endpoint;
  }

  async validate(): Promise<void> {
    await this.comfy.checkAvailable();
  }

  async submit({
    imagePaths,
    prompt,
    negativePrompt,
    seed,
    outputSize
  }: {
    imagePaths: string[];
    prompt: string;
    negativePrompt?: string;
    seed?: number;
    outputSize?: [number, number];
  }): Promise<string> {
    const referencePaths = imagePaths.slice(0, MAX_QWEN_IMAGE_EDIT_REFERENCES);
    if (!referencePaths.length)
      throw new Error("Qwen Image Edit requires an input image");
    const uploadedImages = await Promise.all(
      referencePaths.map((imagePath) => this.comfy.uploadFile(imagePath))
    );
    return this.comfy.submitGraph(
      this.buildGraph({
        references: uploadedImages,
        prompt,
        negativePrompt: negativePrompt ?? "",
        outputSize,
        seed: Number.isSafeInteger(seed)
          ? seed!
          : Math.floor(Math.random() * 2 ** RANDOM_SEED_BITS)
      })
    );
  }

  async poll(promptId: string): Promise<ComfyPollResult> {
    const status = await this.comfy.readPromptStatus(promptId);
    if (status.state !== "finished") return status;
    const outputFile = findComfyOutputFile(status.outputs, this.outputNodeId());
    if (!outputFile)
      return {
        state: "error",
        message: "ComfyUI completed without an image output"
      };
    const bytes = await this.comfy.downloadBuffer(outputFile, {
      maxBytes: MAX_IMAGE_OUTPUT_BYTES,
      defaultType: "temp"
    });
    if (nativeImage.createFromBuffer(bytes).isEmpty())
      throw new Error("ComfyUI returned an invalid image");
    return { state: "finished", bytes };
  }

  async cancel(promptId: string): Promise<void> {
    await this.comfy.cancel(promptId);
  }

  private outputNodeId(): string {
    return qwenImageEditSetupConfig(this.setup).engine === "flux2"
      ? FLUX2_KLEIN_OUTPUT_NODE_ID
      : QWEN_IMAGE_EDIT_OUTPUT_NODE_ID;
  }

  private buildGraph({
    references,
    prompt,
    negativePrompt,
    seed,
    outputSize
  }: {
    references: string[];
    prompt: string;
    negativePrompt: string;
    seed: number;
    outputSize?: [number, number];
  }): ComfyGraph {
    const setup = qwenImageEditSetupConfig(this.setup);
    if (setup.engine === "flux2")
      return buildFlux2KleinGraph({
        setup: setup.setup,
        references,
        prompt,
        width: outputSize?.[0] ?? DEFAULT_FLUX_OUTPUT_SIZE,
        height: outputSize?.[1] ?? DEFAULT_FLUX_OUTPUT_SIZE,
        useReferenceSize: !outputSize,
        seed
      });
    return buildQwenImageEditGraph({
      modelSetup: setup,
      referenceImages: references,
      prompt,
      negativePrompt,
      seed,
      outputSize
    });
  }
}
