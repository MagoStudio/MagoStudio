// Workflow graph adapted from Comfy Org's official Wan2.2 Animate template
// (MIT). See NOTICE.md.
import { ComfyClient } from "../comfy/ComfyClient";
import type { ComfyGraph } from "../comfy/comfyGraph";
import { findComfyOutputFile } from "../comfy/findComfyOutputFile";

import type { ComfyPollResult } from "./comfyQwenClient";
import { buildLocalVideoSaveInputs } from "./comfyVideoSave";
import { padToMultipleOf16 } from "./wanDimensions";

const MAX_VIDEO_BYTES = 536_870_912;
const OUTPUT_NODE_ID = "19";
const RANDOM_SEED_BITS = 32;
const TRIM_AMOUNT_OUTPUT_INDEX = 3;
const DECODED_START_INDEX = 4;

export const WAN_ANIMATE_MODEL_FILES = {
  unet: "Wan2_2-Animate-14B_fp8_e4m3fn_scaled_KJ.safetensors",
  clip: "umt5_xxl_fp8_e4m3fn_scaled.safetensors",
  clipVision: "clip_vision_h.safetensors",
  vae: "wan_2.1_vae.safetensors",
  lightningLora:
    "lightx2v_I2V_14B_480p_cfg_step_distill_rank64_bf16.safetensors",
  relightLora: "WanAnimate_relight_lora_fp16.safetensors"
} as const;

export const WAN_VACE_MODEL_FILES = {
  unet14bFp8: "wan2.1_vace_14B_fp8_e4m3fn.safetensors",
  unet1_3bFp16: "wan2.1_vace_1.3B_fp16.safetensors",
  clip: "umt5_xxl_fp8_e4m3fn_scaled.safetensors",
  vae: "wan_2.1_vae.safetensors"
} as const;

export type WanAnimateMode = "mix" | "move";
export type WanVaceVariant = "14b_fp8" | "1.3b_fp16";

export const VACE_DEPTH_CHECKPOINT = "depth_anything_v2_vitl.pth";
export const VACE_DEPTH_RESOLUTION = 512;
export const VACE_POSE_RESOLUTION = 640;

export const WAN_FUN_CONTROL_MODEL_FILES = {
  unetHighFp8: "wan2.2_fun_control_high_noise_14B_fp8_scaled.safetensors",
  unetLowFp8: "wan2.2_fun_control_low_noise_14B_fp8_scaled.safetensors",
  clip: "umt5_xxl_fp8_e4m3fn_scaled.safetensors",
  vae: "wan_2.1_vae.safetensors",
  speedupLoraHigh: "wan2.2_i2v_lightx2v_4steps_lora_v1_high_noise.safetensors",
  speedupLoraLow: "wan2.2_i2v_lightx2v_4steps_lora_v1_low_noise.safetensors"
} as const;

export const WAN_FUN_QUANTISATIONS = [
  "fp8_scaled",
  "Q8_0",
  "Q6_K",
  "Q5_K_M",
  "Q4_K_M"
] as const;

export type WanFunQuantisation = (typeof WAN_FUN_QUANTISATIONS)[number];

export const MAGO_ANIMATE_MODEL_FILES = {
  clip: "umt5_xxl_fp8_e4m3fn_scaled.safetensors",
  clipVision: "clip_vision_h.safetensors",
  vae: "Wan2_1_VAE_bf16.safetensors",
  unetModelType: "animate2"
} as const;

export const MAGO_ANIMATE_QUANTISATIONS = [
  "int8_convrot",
  "Q8_0",
  "Q6_K",
  "Q4_K_M"
] as const;

export type MagoAnimateQuantisation =
  (typeof MAGO_ANIMATE_QUANTISATIONS)[number];

export const isMagoAnimateQuantisation = (
  value: unknown
): value is MagoAnimateQuantisation =>
  MAGO_ANIMATE_QUANTISATIONS.some((candidate) => candidate === value);

export const magoAnimateUnetFile = (
  quantisation: MagoAnimateQuantisation
): string =>
  quantisation === "int8_convrot"
    ? "wan_animate_2_distill_int8_convrot.safetensors"
    : `Wan-Animate-2-14B-TURBO-${quantisation}.gguf`;

export const isWanFunQuantisation = (
  value: unknown
): value is WanFunQuantisation =>
  WAN_FUN_QUANTISATIONS.some((candidate) => candidate === value);

export interface WanFunUnetFiles {
  high: string;
  low: string;
  isGguf: boolean;
}

export const resolveWanFunUnetFiles = (
  quantisation: WanFunQuantisation
): WanFunUnetFiles =>
  quantisation === "fp8_scaled"
    ? {
        high: WAN_FUN_CONTROL_MODEL_FILES.unetHighFp8,
        low: WAN_FUN_CONTROL_MODEL_FILES.unetLowFp8,
        isGguf: false
      }
    : {
        high: `Wan2.2-Fun-A14B-Control_HighNoise-${quantisation}.gguf`,
        low: `Wan2.2-Fun-A14B-Control_LowNoise-${quantisation}.gguf`,
        isGguf: true
      };

const PERCENT = 100;

export const resolveWanFunSplitStep = (
  steps: number,
  splitPercentage: number
): number => {
  const raw = Math.round((steps * splitPercentage) / PERCENT);
  return Math.max(1, Math.min(steps - 1, raw));
};
export type ComfyVideoPollResult =
  | Exclude<ComfyPollResult, { state: "finished" }>
  | { state: "finished"; videoPath: string };

export class ComfyWanAnimateClient {
  readonly endpoint: string;
  protected readonly comfy: ComfyClient;

  constructor(endpoint: string, comfy?: ComfyClient) {
    this.comfy = comfy ?? new ComfyClient(endpoint);
    this.endpoint = this.comfy.endpoint;
  }

  async validate(): Promise<void> {
    await this.comfy.checkAvailable();
  }

  async submit(input: {
    videoPath: string;
    referenceImagePath: string;
    prompt: string;
    mode: WanAnimateMode;
    frameCount: number;
    width: number;
    height: number;
    seed?: number;
  }): Promise<string> {
    const [video, referenceImage] = await Promise.all([
      this.comfy.uploadFile(input.videoPath),
      this.comfy.uploadFile(input.referenceImagePath)
    ]);
    return this.comfy.submitGraph(
      this.buildGraph({
        video,
        referenceImage,
        prompt: input.prompt,
        mode: input.mode,
        frameCount: input.frameCount,
        width: input.width,
        height: input.height,
        seed: Number.isSafeInteger(input.seed)
          ? input.seed!
          : Math.floor(Math.random() * 2 ** RANDOM_SEED_BITS)
      })
    );
  }

  async poll(
    promptId: string,
    outputVideoPath: string
  ): Promise<ComfyVideoPollResult> {
    const status = await this.comfy.readPromptStatus(promptId);
    if (status.state !== "finished") return status;
    const outputFile = findComfyOutputFile(status.outputs, OUTPUT_NODE_ID);
    if (!outputFile)
      return {
        state: "error",
        message: "ComfyUI completed without a video output"
      };
    await this.comfy.downloadToFile(outputFile, outputVideoPath, {
      maxBytes: MAX_VIDEO_BYTES,
      defaultType: "output"
    });
    return { state: "finished", videoPath: outputVideoPath };
  }

  async cancel(promptId: string): Promise<void> {
    await this.comfy.cancel(promptId);
  }

  private buildGraph(input: {
    video: string;
    referenceImage: string;
    prompt: string;
    mode: WanAnimateMode;
    frameCount: number;
    width: number;
    height: number;
    seed: number;
  }): ComfyGraph {
    const paddedWidth = padToMultipleOf16(input.width);
    const paddedHeight = padToMultipleOf16(input.height);
    const graph: Record<
      string,
      { class_type: string; inputs: Record<string, unknown> }
    > = {
      "1": {
        class_type: "CLIPTextEncode",
        inputs: {
          text: "blurry, low quality, distorted, deformed",
          clip: ["2", 0]
        }
      },
      "2": {
        class_type: "CLIPLoader",
        inputs: {
          clip_name: WAN_ANIMATE_MODEL_FILES.clip,
          type: "wan",
          device: "default"
        }
      },
      "3": {
        class_type: "VAELoader",
        inputs: { vae_name: WAN_ANIMATE_MODEL_FILES.vae }
      },
      "4": {
        class_type: "CLIPVisionLoader",
        inputs: { clip_name: WAN_ANIMATE_MODEL_FILES.clipVision }
      },
      "9": {
        class_type: "CLIPVisionEncode",
        inputs: { crop: "none", clip_vision: ["4", 0], image: ["10", 0] }
      },
      "10": {
        class_type: "LoadImage",
        inputs: { image: input.referenceImage }
      },
      "18": {
        class_type: "LoraLoaderModelOnly",
        inputs: {
          model: ["233", 0],
          lora_name: WAN_ANIMATE_MODEL_FILES.lightningLora,
          strength_model: 1
        }
      },
      "20": {
        class_type: "UNETLoader",
        inputs: {
          unet_name: WAN_ANIMATE_MODEL_FILES.unet,
          weight_dtype: "default"
        }
      },
      "233": {
        class_type: "WanChunkFeedForward",
        inputs: { model: ["20", 0], chunks: 4, dim_threshold: 4096 }
      },
      "21": {
        class_type: "CLIPTextEncode",
        inputs: { text: input.prompt, clip: ["2", 0] }
      },
      "23": { class_type: "GetVideoComponents", inputs: { video: ["145", 0] } },
      "60": {
        class_type: "ModelSamplingSD3",
        inputs: { shift: 8, model: ["99", 0] }
      },
      "99": {
        class_type: "LoraLoaderModelOnly",
        inputs: {
          model: ["18", 0],
          lora_name: WAN_ANIMATE_MODEL_FILES.relightLora,
          strength_model: 1
        }
      },
      "100": {
        class_type: "DWPreprocessor",
        inputs: {
          image: ["212", 0],
          detect_hand: "enable",
          detect_body: "enable",
          detect_face: "enable",
          resolution: 640,
          bbox_detector: "yolox_l.onnx",
          pose_estimator: "dw-ll_ucoco_384.onnx",
          scale_stick_for_xinsr_cn: "disable"
        }
      },
      "101": {
        class_type: "DWPreprocessor",
        inputs: {
          image: ["212", 0],
          detect_hand: "disable",
          detect_body: "disable",
          detect_face: "enable",
          resolution: 640,
          bbox_detector: "yolox_l.onnx",
          pose_estimator: "dw-ll_ucoco_384.onnx",
          scale_stick_for_xinsr_cn: "disable"
        }
      },
      "145": { class_type: "LoadVideo", inputs: { file: input.video } },
      "159": { class_type: "PrimitiveInt", inputs: { value: paddedWidth } },
      "160": { class_type: "PrimitiveInt", inputs: { value: paddedHeight } },
      "212": {
        class_type: "ImageScale",
        inputs: {
          upscale_method: "lanczos",
          width: ["159", 0],
          height: ["160", 0],
          crop: "center",
          image: ["23", 0]
        }
      },
      "232:57": {
        class_type: "TrimVideoLatent",
        inputs: {
          trim_amount: ["232:62", TRIM_AMOUNT_OUTPUT_INDEX],
          samples: ["232:63", 0]
        }
      },
      "232:58": {
        class_type: "VAEDecode",
        inputs: { samples: ["232:57", 0], vae: ["3", 0] }
      },
      "232:230": {
        class_type: "ImageFromBatch",
        inputs: {
          batch_index: ["232:62", DECODED_START_INDEX],
          length: 4096,
          image: ["232:58", 0]
        }
      },
      "232:15": {
        class_type: "CreateVideo",
        inputs: {
          fps: ["23", 2],
          bit_depth: 8,
          images: ["232:230", 0],
          audio: ["23", 1]
        }
      },
      "232:63": {
        class_type: "KSampler",
        inputs: {
          seed: Math.max(0, input.seed),
          steps: 6,
          cfg: 1,
          sampler_name: "euler",
          scheduler: "simple",
          denoise: 1,
          model: ["60", 0],
          positive: ["232:62", 0],
          negative: ["232:62", 1],
          latent_image: ["232:62", 2]
        }
      },
      "19": {
        class_type: "SaveVideo",
        inputs: buildLocalVideoSaveInputs({
          filenamePrefix: "video/Mago_Wan_Animate",
          videoNodeId: "232:15"
        })
      }
    };

    const animateInputs: Record<string, unknown> = {
      width: ["159", 0],
      height: ["160", 0],
      length: input.frameCount,
      batch_size: 1,
      continue_motion_max_frames: 5,
      video_frame_offset: 0,
      positive: ["21", 0],
      negative: ["1", 0],
      vae: ["3", 0],
      clip_vision_output: ["9", 0],
      reference_image: ["10", 0],
      face_video: ["101", 0],
      pose_video: ["100", 0]
    };
    if (input.mode === "mix") {
      Object.assign(graph, {
        "107": {
          class_type: "Sam2Segmentation",
          inputs: {
            sam2_model: ["108", 0],
            image: ["212", 0],
            keep_model_loaded: false,
            coordinates_positive: ["229", 0],
            individual_objects: false
          }
        },
        "108": {
          class_type: "DownloadAndLoadSAM2Model",
          inputs: {
            model: "sam2_hiera_base_plus.safetensors",
            segmentor: "video",
            device: "cuda",
            precision: "fp16"
          }
        },
        "229": {
          class_type: "PointsEditor",
          inputs: {
            points_store: {},
            coordinates: `[{"x":${input.width / 2},"y":${input.height / 2}}]`,
            neg_coordinates: "[]",
            bbox_store: {},
            bboxes: "[]",
            bbox_format: "xyxy",
            width: paddedWidth,
            height: paddedHeight,
            normalize: false,
            bg_image: ["212", 0]
          }
        },
        "274": {
          class_type: "GrowMask",
          inputs: { expand: 10, tapered_corners: true, mask: ["107", 0] }
        },
        "276": {
          class_type: "BlockifyMask",
          inputs: { block_size: 32, device: "cpu", masks: ["274", 0] }
        },
        "275": {
          class_type: "DrawMaskOnImage",
          inputs: {
            color: "0, 0, 0",
            device: "cpu",
            image: ["212", 0],
            mask: ["276", 0]
          }
        }
      });
      animateInputs.background_video = ["275", 0];
      animateInputs.character_mask = ["276", 0];
    }
    graph["232:62"] = {
      class_type: "WanAnimateToVideo",
      inputs: animateInputs
    };
    return graph;
  }
}

/** Official ComfyUI Wan 2.1 VACE video-to-video graph (MIT workflow template). */
export class ComfyWanVaceClient extends ComfyWanAnimateClient {
  async submitVace(input: {
    videoPath: string;
    referenceImagePath: string;
    prompt: string;
    frameCount: number;
    variant: WanVaceVariant;
    width: number;
    height: number;
    depthStrength: number;
    poseStrength: number;
    seed?: number;
  }): Promise<string> {
    const [video, referenceImage] = await Promise.all([
      this.comfy.uploadFile(input.videoPath),
      this.comfy.uploadFile(input.referenceImagePath)
    ]);
    return this.comfy.submitGraph(
      this.buildVaceGraph({
        video,
        referenceImage,
        prompt: input.prompt,
        frameCount: input.frameCount,
        variant: input.variant,
        width: input.width,
        height: input.height,
        depthStrength: input.depthStrength,
        poseStrength: input.poseStrength,
        seed: Number.isSafeInteger(input.seed)
          ? input.seed!
          : Math.floor(Math.random() * 2 ** RANDOM_SEED_BITS)
      })
    );
  }

  private buildVaceGraph(input: {
    video: string;
    referenceImage: string;
    prompt: string;
    frameCount: number;
    variant: WanVaceVariant;
    width: number;
    height: number;
    depthStrength: number;
    poseStrength: number;
    seed: number;
  }): ComfyGraph {
    const paddedWidth = padToMultipleOf16(input.width);
    const paddedHeight = padToMultipleOf16(input.height);
    return {
      "1": { class_type: "LoadVideo", inputs: { file: input.video } },
      "2": {
        class_type: "GetVideoComponents",
        inputs: { video: ["1", 0] }
      },
      "3": {
        class_type: "LoadImage",
        inputs: { image: input.referenceImage }
      },
      "4": {
        class_type: "UNETLoader",
        inputs: {
          unet_name:
            input.variant === "1.3b_fp16"
              ? WAN_VACE_MODEL_FILES.unet1_3bFp16
              : WAN_VACE_MODEL_FILES.unet14bFp8,
          weight_dtype: "default"
        }
      },
      "5": {
        class_type: "CLIPLoader",
        inputs: {
          clip_name: WAN_VACE_MODEL_FILES.clip,
          type: "wan",
          device: "default"
        }
      },
      "6": {
        class_type: "VAELoader",
        inputs: { vae_name: WAN_VACE_MODEL_FILES.vae }
      },
      "7": {
        class_type: "CLIPTextEncode",
        inputs: { text: input.prompt, clip: ["5", 0] }
      },
      "8": {
        class_type: "CLIPTextEncode",
        inputs: {
          text: "blurry, low quality, distorted, deformed, flickering",
          clip: ["5", 0]
        }
      },
      "9": {
        class_type: "ModelSamplingSD3",
        inputs: { shift: 8, model: ["18", 0] }
      },
      "18": {
        class_type: "WanChunkFeedForward",
        inputs: { model: ["4", 0], chunks: 4, dim_threshold: 4096 }
      },
      "15": {
        class_type: "DepthAnythingV2Preprocessor",
        inputs: {
          image: ["2", 0],
          ckpt_name: VACE_DEPTH_CHECKPOINT,
          resolution: VACE_DEPTH_RESOLUTION
        }
      },
      "16": {
        class_type: "DWPreprocessor",
        inputs: {
          image: ["2", 0],
          detect_hand: "enable",
          detect_body: "enable",
          detect_face: "enable",
          resolution: VACE_POSE_RESOLUTION,
          bbox_detector: "yolox_l.onnx",
          pose_estimator: "dw-ll_ucoco_384.onnx",
          scale_stick_for_xinsr_cn: "disable"
        }
      },
      "10": {
        class_type: "WanVaceToVideo",
        inputs: {
          width: paddedWidth,
          height: paddedHeight,
          length: input.frameCount,
          batch_size: 1,
          strength: input.depthStrength,
          positive: ["7", 0],
          negative: ["8", 0],
          vae: ["6", 0],
          control_video: ["15", 0],
          reference_image: ["3", 0]
        }
      },
      "17": {
        class_type: "WanVaceToVideo",
        inputs: {
          width: paddedWidth,
          height: paddedHeight,
          length: input.frameCount,
          batch_size: 1,
          strength: input.poseStrength,
          positive: ["10", 0],
          negative: ["10", 1],
          vae: ["6", 0],
          control_video: ["16", 0],
          reference_image: ["3", 0]
        }
      },
      "11": {
        class_type: "KSampler",
        inputs: {
          seed: Math.max(0, input.seed),
          steps: 20,
          cfg: 6,
          sampler_name: "uni_pc",
          scheduler: "simple",
          denoise: 1,
          model: ["9", 0],
          positive: ["17", 0],
          negative: ["17", 1],
          latent_image: ["17", 2]
        }
      },
      "12": {
        class_type: "TrimVideoLatent",
        inputs: {
          trim_amount: ["17", TRIM_AMOUNT_OUTPUT_INDEX],
          samples: ["11", 0]
        }
      },
      "13": {
        class_type: "VAEDecode",
        inputs: { samples: ["12", 0], vae: ["6", 0] }
      },
      "14": {
        class_type: "CreateVideo",
        inputs: {
          fps: ["2", 2],
          bit_depth: 8,
          images: ["13", 0],
          audio: ["2", 1]
        }
      },
      "19": {
        class_type: "SaveVideo",
        inputs: buildLocalVideoSaveInputs({
          filenamePrefix: "video/Mago_Wan_VACE",
          videoNodeId: "14"
        })
      }
    };
  }
}

export class ComfyWanFunControlClient extends ComfyWanAnimateClient {
  async submitFunControl(input: {
    videoPath: string;
    startImagePath: string;
    prompt: string;
    negativePrompt: string;
    frameCount: number;
    quantisation: WanFunQuantisation;
    width: number;
    height: number;
    steps: number;
    splitPercentage: number;
    cfg: number;
    shift: number;
    speedupLoraStrength: number;
    colorMatchStrength: number;
    seed?: number;
  }): Promise<string> {
    const [video, startImage] = await Promise.all([
      this.comfy.uploadFile(input.videoPath),
      this.comfy.uploadFile(input.startImagePath)
    ]);
    return this.comfy.submitGraph(
      this.buildFunControlGraph({
        video,
        startImage,
        prompt: input.prompt,
        negativePrompt: input.negativePrompt,
        frameCount: input.frameCount,
        quantisation: input.quantisation,
        width: input.width,
        height: input.height,
        steps: input.steps,
        splitPercentage: input.splitPercentage,
        cfg: input.cfg,
        shift: input.shift,
        speedupLoraStrength: input.speedupLoraStrength,
        colorMatchStrength: input.colorMatchStrength,
        seed: Number.isSafeInteger(input.seed)
          ? input.seed!
          : Math.floor(Math.random() * 2 ** RANDOM_SEED_BITS)
      })
    );
  }

  private buildFunControlGraph(input: {
    video: string;
    startImage: string;
    prompt: string;
    negativePrompt: string;
    frameCount: number;
    quantisation: WanFunQuantisation;
    width: number;
    height: number;
    steps: number;
    splitPercentage: number;
    cfg: number;
    shift: number;
    speedupLoraStrength: number;
    colorMatchStrength: number;
    seed: number;
  }): ComfyGraph {
    const paddedWidth = padToMultipleOf16(input.width);
    const paddedHeight = padToMultipleOf16(input.height);
    const unets = resolveWanFunUnetFiles(input.quantisation);
    const splitStep = resolveWanFunSplitStep(
      input.steps,
      input.splitPercentage
    );
    const loaderClass = unets.isGguf ? "UnetLoaderGGUF" : "UNETLoader";
    const loaderInputs = (unetName: string) =>
      unets.isGguf
        ? { unet_name: unetName }
        : { unet_name: unetName, weight_dtype: "default" };
    const usesColorMatch = input.colorMatchStrength > 0;

    const graph: ComfyGraph = {
      "1": { class_type: "LoadVideo", inputs: { file: input.video } },
      "2": { class_type: "GetVideoComponents", inputs: { video: ["1", 0] } },
      "3": { class_type: "LoadImage", inputs: { image: input.startImage } },
      "4": {
        class_type: loaderClass,
        inputs: loaderInputs(unets.high)
      },
      "5": {
        class_type: loaderClass,
        inputs: loaderInputs(unets.low)
      },
      "6": {
        class_type: "CLIPLoader",
        inputs: {
          clip_name: WAN_FUN_CONTROL_MODEL_FILES.clip,
          type: "wan",
          device: "default"
        }
      },
      "7": {
        class_type: "VAELoader",
        inputs: { vae_name: WAN_FUN_CONTROL_MODEL_FILES.vae }
      },
      "8": {
        class_type: "CLIPTextEncode",
        inputs: { text: input.prompt, clip: ["6", 0] }
      },
      "9": {
        class_type: "CLIPTextEncode",
        inputs: { text: input.negativePrompt, clip: ["6", 0] }
      },
      "10": {
        class_type: "LoraLoaderModelOnly",
        inputs: {
          lora_name: WAN_FUN_CONTROL_MODEL_FILES.speedupLoraHigh,
          strength_model: input.speedupLoraStrength,
          model: ["21", 0]
        }
      },
      "11": {
        class_type: "LoraLoaderModelOnly",
        inputs: {
          lora_name: WAN_FUN_CONTROL_MODEL_FILES.speedupLoraLow,
          strength_model: input.speedupLoraStrength,
          model: ["22", 0]
        }
      },
      "21": {
        class_type: "WanChunkFeedForward",
        inputs: { model: ["4", 0], chunks: 4, dim_threshold: 4096 }
      },
      "22": {
        class_type: "WanChunkFeedForward",
        inputs: { model: ["5", 0], chunks: 4, dim_threshold: 4096 }
      },
      "12": {
        class_type: "ModelSamplingSD3",
        inputs: { shift: input.shift, model: ["10", 0] }
      },
      "13": {
        class_type: "ModelSamplingSD3",
        inputs: { shift: input.shift, model: ["11", 0] }
      },
      "14": {
        class_type: "Wan22FunControlToVideo",
        inputs: {
          width: paddedWidth,
          height: paddedHeight,
          length: input.frameCount,
          batch_size: 1,
          positive: ["8", 0],
          negative: ["9", 0],
          vae: ["7", 0],
          ref_image: ["3", 0],
          control_video: ["2", 0]
        }
      },
      "15": {
        class_type: "KSamplerAdvanced",
        inputs: {
          add_noise: "enable",
          noise_seed: Math.max(0, input.seed),
          steps: input.steps,
          cfg: input.cfg,
          sampler_name: "uni_pc",
          scheduler: "simple",
          start_at_step: 0,
          end_at_step: splitStep,
          return_with_leftover_noise: "enable",
          model: ["12", 0],
          positive: ["14", 0],
          negative: ["14", 1],
          latent_image: ["14", 2]
        }
      },
      "16": {
        class_type: "KSamplerAdvanced",
        inputs: {
          add_noise: "disable",
          noise_seed: Math.max(0, input.seed),
          steps: input.steps,
          cfg: input.cfg,
          sampler_name: "uni_pc",
          scheduler: "simple",
          start_at_step: splitStep,
          end_at_step: input.steps,
          return_with_leftover_noise: "disable",
          model: ["13", 0],
          positive: ["14", 0],
          negative: ["14", 1],
          latent_image: ["15", 0]
        }
      },
      "17": {
        class_type: "VAEDecode",
        inputs: { samples: ["16", 0], vae: ["7", 0] }
      },
      "18": {
        class_type: "CreateVideo",
        inputs: {
          fps: ["2", 2],
          bit_depth: 8,
          images: usesColorMatch ? ["20", 0] : ["17", 0],
          audio: ["2", 1]
        }
      },
      "19": {
        class_type: "SaveVideo",
        inputs: buildLocalVideoSaveInputs({
          filenamePrefix: "video/Mago_Style_Transfer",
          videoNodeId: "18"
        })
      }
    };

    if (usesColorMatch) {
      graph["20"] = {
        class_type: "ColorMatch",
        inputs: {
          image_ref: ["3", 0],
          image_target: ["17", 0],
          method: "mkl",
          strength: input.colorMatchStrength
        }
      };
    }

    return graph;
  }
}

export class ComfyMagoAnimateClient extends ComfyWanAnimateClient {
  async submitMagoAnimate(input: {
    videoPath: string;
    referenceImagePath: string;
    prompt: string;
    posePrompt: string;
    negativePrompt: string;
    frameCount: number;
    quantisation: MagoAnimateQuantisation;
    width: number;
    height: number;
    steps: number;
    cfg: number;
    shift: number;
    referenceImageStrength: number;
    poseStrength: number;
    poseStartPercent: number;
    poseEndPercent: number;
    cacheDevice: string;
    cacheDtype: string;
    trimDuplicatedFrame: boolean;
    seed?: number;
  }): Promise<string> {
    const [video, referenceImage] = await Promise.all([
      this.comfy.uploadFile(input.videoPath),
      this.comfy.uploadFile(input.referenceImagePath)
    ]);
    return this.comfy.submitGraph(
      this.buildMagoAnimateGraph({
        ...input,
        video,
        referenceImage,
        seed: Number.isSafeInteger(input.seed)
          ? input.seed!
          : Math.floor(Math.random() * 2 ** RANDOM_SEED_BITS)
      })
    );
  }

  private buildMagoAnimateGraph(input: {
    video: string;
    referenceImage: string;
    prompt: string;
    posePrompt: string;
    negativePrompt: string;
    frameCount: number;
    quantisation: MagoAnimateQuantisation;
    width: number;
    height: number;
    steps: number;
    cfg: number;
    shift: number;
    referenceImageStrength: number;
    poseStrength: number;
    poseStartPercent: number;
    poseEndPercent: number;
    cacheDevice: string;
    cacheDtype: string;
    trimDuplicatedFrame: boolean;
    seed: number;
  }): ComfyGraph {
    const paddedWidth = padToMultipleOf16(input.width);
    const paddedHeight = padToMultipleOf16(input.height);
    const decodedImages = input.trimDuplicatedFrame ? ["26", 0] : ["25", 0];

    const graph: ComfyGraph = {
      "1": { class_type: "LoadVideo", inputs: { file: input.video } },
      "2": { class_type: "GetVideoComponents", inputs: { video: ["1", 0] } },
      "3": { class_type: "LoadImage", inputs: { image: input.referenceImage } },
      "4":
        input.quantisation === "int8_convrot"
          ? {
              class_type: "UNETLoader",
              inputs: {
                unet_name: magoAnimateUnetFile(input.quantisation),
                weight_dtype: "default"
              }
            }
          : {
              class_type: "RebelsGGUFUnetLoaderMeta",
              inputs: {
                unet_name: magoAnimateUnetFile(input.quantisation),
                model_type: MAGO_ANIMATE_MODEL_FILES.unetModelType
              }
            },
      "5": {
        class_type: "WanChunkFeedForward",
        inputs: { model: ["4", 0], chunks: 4, dim_threshold: 4096 }
      },
      "6": {
        class_type: "WanAnimate2Cache",
        inputs: {
          device: input.cacheDevice,
          dtype: input.cacheDtype,
          model: ["5", 0]
        }
      },
      "7": {
        class_type: "ModelSamplingSD3",
        inputs: { shift: input.shift, model: ["6", 0] }
      },
      "8": {
        class_type: "BasicScheduler",
        inputs: {
          scheduler: "simple",
          steps: input.steps,
          denoise: 1,
          model: ["6", 0]
        }
      },
      "9": {
        class_type: "KSamplerSelect",
        inputs: { sampler_name: "lcm" }
      },
      "10": {
        class_type: "CLIPLoader",
        inputs: {
          clip_name: MAGO_ANIMATE_MODEL_FILES.clip,
          type: "wan",
          device: "default"
        }
      },
      "11": {
        class_type: "CLIPTextEncode",
        inputs: { text: input.prompt, clip: ["10", 0] }
      },
      "12": {
        class_type: "CLIPTextEncode",
        inputs: { text: input.negativePrompt, clip: ["10", 0] }
      },
      "13": {
        class_type: "CLIPTextEncode",
        inputs: { text: input.posePrompt, clip: ["10", 0] }
      },
      "14": {
        class_type: "CLIPVisionLoader",
        inputs: { clip_name: MAGO_ANIMATE_MODEL_FILES.clipVision }
      },
      "15": {
        class_type: "VAELoader",
        inputs: { vae_name: MAGO_ANIMATE_MODEL_FILES.vae }
      },
      "16": {
        class_type: "ImageScale",
        inputs: {
          upscale_method: "lanczos",
          width: paddedWidth,
          height: paddedHeight,
          crop: "center",
          image: ["2", 0]
        }
      },
      "17": {
        class_type: "ImageScale",
        inputs: {
          upscale_method: "lanczos",
          width: paddedWidth,
          height: paddedHeight,
          crop: "center",
          image: ["3", 0]
        }
      },
      "18": {
        class_type: "ImageFromBatch",
        inputs: { batch_index: 0, length: 1, image: ["16", 0] }
      },
      "20": {
        class_type: "CLIPVisionEncode",
        inputs: { crop: "none", clip_vision: ["14", 0], image: ["17", 0] }
      },
      "21": {
        class_type: "CLIPVisionEncode",
        inputs: { crop: "none", clip_vision: ["14", 0], image: ["18", 0] }
      },
      "22": {
        class_type: "WanAnimate2ToVideo",
        inputs: {
          width: paddedWidth,
          height: paddedHeight,
          length: input.frameCount,
          batch_size: 1,
          video_frame_offset: 0,
          pose_strength: input.poseStrength,
          pose_start_percent: input.poseStartPercent,
          pose_end_percent: input.poseEndPercent,
          reference_image_strength: input.referenceImageStrength,
          positive: ["11", 0],
          negative: ["12", 0],
          vae: ["15", 0],
          reference_image: ["17", 0],
          pose_video: ["16", 0],
          clip_vision_output: ["20", 0],
          positive_pose: ["13", 0],
          clip_vision_output_pose: ["21", 0]
        }
      },
      "23": {
        class_type: "SamplerCustom",
        inputs: {
          add_noise: true,
          noise_seed: Math.max(0, input.seed),
          cfg: input.cfg,
          model: ["7", 0],
          positive: ["22", 0],
          negative: ["22", 1],
          sampler: ["9", 0],
          sigmas: ["8", 0],
          latent_image: ["22", 2]
        }
      },
      "24": {
        class_type: "TrimVideoLatent",
        inputs: {
          samples: ["23", 0],
          trim_amount: ["22", TRIM_AMOUNT_OUTPUT_INDEX]
        }
      },
      "25": {
        class_type: "VAEDecode",
        inputs: { samples: ["24", 0], vae: ["15", 0] }
      },
      "27": {
        class_type: "CreateVideo",
        inputs: {
          fps: ["2", 2],
          bit_depth: 8,
          images: decodedImages,
          audio: ["2", 1]
        }
      },
      "19": {
        class_type: "SaveVideo",
        inputs: buildLocalVideoSaveInputs({
          filenamePrefix: "video/Mago_Animate",
          videoNodeId: "27"
        })
      }
    };

    if (input.trimDuplicatedFrame) {
      graph["26"] = {
        class_type: "ImageFromBatch",
        inputs: { batch_index: 1, length: 4096, image: ["25", 0] }
      };
    }

    return graph;
  }
}
