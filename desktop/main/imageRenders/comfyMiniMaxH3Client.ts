import {
  type MiniMaxH3VfxLora,
  type MiniMaxH3VfxMode,
  resolveMiniMaxH3VfxLora
} from "../../shared/minimaxH3VfxModes";
import { buildMiniMaxH3VfxPrompt } from "../comfy/buildMiniMaxH3VfxPrompt";
import type { ComfyGraph } from "../comfy/comfyGraph";
import { mergeComfyGraphParts } from "../comfy/mergeComfyGraphParts";
import {
  clampMiniMaxH3Dimension,
  MINIMAX_H3_SHARED_MODEL_FILES,
  snapMiniMaxH3LengthFrames
} from "../comfy/minimaxH3Shared";
import { nameUnwiredSoundtrackInPrompt } from "../comfy/nameUnwiredSoundtrackInPrompt";

import { buildLocalVideoSaveInputs } from "./comfyVideoSave";
import { ComfyWanAnimateClient } from "./comfyWanAnimateClient";

export { clampMiniMaxH3Dimension, snapMiniMaxH3LengthFrames };

const RANDOM_SEED_BITS = 32;
const FIRST_REFERENCE_IMAGE_NODE_ID = 20;
const REFERENCE_VIDEO_NODE_ID = "40";
const REFERENCE_VIDEO_AUDIO_OUTPUT_INDEX = 2;
const VFX_LORA_NODE_ID = "17";
type ComfyNodeOutputLink = [nodeId: string, outputIndex: number];
const SOURCE_CLIP_GUIDE_NODE_ID = "18";
const MEDIUM_QUALITY_STEPS = 4;
const HIGH_QUALITY_PDD_STEPS = 8;

export const MINIMAX_H3_FPS = 24;
export const MINIMAX_H3_MAX_REFERENCE_IMAGES = 9;

export const MINIMAX_H3_LOCAL_MODEL_FILES = {
  unet: MINIMAX_H3_SHARED_MODEL_FILES.unet,
  textEncoder: MINIMAX_H3_SHARED_MODEL_FILES.textEncoderVanilla,
  videoVae: MINIMAX_H3_SHARED_MODEL_FILES.videoVae,
  audioVae: MINIMAX_H3_SHARED_MODEL_FILES.audioVae,
  pddAccelerator: "MiniMax-H3-Ref2VA-Acc-8Step.safetensors",
  fourStepLora: MINIMAX_H3_SHARED_MODEL_FILES.fourStepLora
} as const;

export const MINIMAX_H3_QUALITIES = ["high", "medium"] as const;

export type MiniMaxH3Quality = (typeof MINIMAX_H3_QUALITIES)[number];

export const resolveMiniMaxH3Quality = (value: unknown): MiniMaxH3Quality =>
  value === "medium" ? "medium" : "high";

export const isMiniMaxH3PddAcceleratorQuality = (
  quality: MiniMaxH3Quality
): boolean => quality === "high";

export type MiniMaxH3VfxLoraApplication = {
  lora: MiniMaxH3VfxLora;
  strength: number;
};

export type MiniMaxH3LocalGraphInput = {
  prompt: string;
  width: number;
  height: number;
  lengthFrames: number;
  quality: MiniMaxH3Quality;
  seed: number;
  referenceImages: string[];
  referenceVideo?: string;
  useReferenceVideoAudio: boolean;
  vfxLora?: MiniMaxH3VfxLoraApplication;
};

const isSourceClipGuidedInGraph = (input: MiniMaxH3LocalGraphInput): boolean =>
  !!input.referenceVideo && input.vfxLora?.lora.sourceClipPlacement === "guide";

const buildReferenceNodes = (
  input: MiniMaxH3LocalGraphInput
): { nodes: ComfyGraph; referenceInputs: Record<string, unknown> } => {
  const nodes: ComfyGraph = {};
  const referenceInputs: Record<string, unknown> = {};
  input.referenceImages.forEach((image, index) => {
    const nodeId = String(FIRST_REFERENCE_IMAGE_NODE_ID + index);
    nodes[nodeId] = { class_type: "LoadImage", inputs: { image } };
    referenceInputs[`ref_images.ref_image_${index}`] = [nodeId, 0];
  });
  if (input.referenceVideo) {
    nodes[REFERENCE_VIDEO_NODE_ID] = {
      class_type: "VHS_LoadVideo",
      inputs: {
        video: input.referenceVideo,
        force_rate: MINIMAX_H3_FPS,
        custom_width: 0,
        custom_height: 0,
        frame_load_cap: input.lengthFrames,
        skip_first_frames: 0,
        select_every_nth: 1
      }
    };
    if (isSourceClipGuidedInGraph(input)) return { nodes, referenceInputs };
    referenceInputs["ref_videos.ref_video_0"] = [REFERENCE_VIDEO_NODE_ID, 0];
    if (input.useReferenceVideoAudio)
      referenceInputs["ref_video_audios.ref_video_audio_0"] = [
        REFERENCE_VIDEO_NODE_ID,
        REFERENCE_VIDEO_AUDIO_OUTPUT_INDEX
      ];
  }
  return { nodes, referenceInputs };
};

const buildAcceleratorNodes = (
  quality: MiniMaxH3Quality,
  shiftedModel: ComfyNodeOutputLink
): ComfyGraph => {
  if (isMiniMaxH3PddAcceleratorQuality(quality))
    return {
      "2": {
        class_type: "MiniMaxH3PDDAccApply",
        inputs: {
          model: shiftedModel,
          pdd_file: MINIMAX_H3_LOCAL_MODEL_FILES.pddAccelerator,
          nfe: String(HIGH_QUALITY_PDD_STEPS),
          lora_strength: 1,
          head_strength: 1,
          on_off_grid: "error",
          partition_check: "warn"
        }
      }
    };
  return {
    "2": {
      class_type: "LoraLoaderModelOnly",
      inputs: {
        model: ["1", 0],
        lora_name: MINIMAX_H3_LOCAL_MODEL_FILES.fourStepLora,
        strength_model: 1
      }
    },
    "12": {
      class_type: "BasicScheduler",
      inputs: {
        model: shiftedModel,
        scheduler: "simple",
        steps: MEDIUM_QUALITY_STEPS,
        denoise: 1
      }
    }
  };
};

const buildVfxLoraNodes = (
  vfxLora: MiniMaxH3VfxLoraApplication | undefined
): ComfyGraph =>
  vfxLora
    ? {
        [VFX_LORA_NODE_ID]: {
          class_type: "LoraLoaderModelOnly",
          inputs: {
            model: ["4", 0],
            lora_name: vfxLora.lora.loraFile,
            strength_model: vfxLora.strength
          }
        }
      }
    : {};

const buildSourceClipGuideNodes = (
  input: MiniMaxH3LocalGraphInput
): ComfyGraph => {
  if (!isSourceClipGuidedInGraph(input)) return {};
  const sourceAudioGuideInputs = input.useReferenceVideoAudio
    ? {
        audio: [REFERENCE_VIDEO_NODE_ID, REFERENCE_VIDEO_AUDIO_OUTPUT_INDEX],
        audio_vae: ["7", 0]
      }
    : {};
  return {
    [SOURCE_CLIP_GUIDE_NODE_ID]: {
      class_type: "MiniMaxH3AddGuide",
      inputs: {
        positive: ["8", 0],
        latent: ["8", 1],
        vae: ["6", 0],
        image: [REFERENCE_VIDEO_NODE_ID, 0],
        frame_idx: 0,
        ...sourceAudioGuideInputs
      }
    }
  };
};

export const buildMiniMaxH3LocalGraph = (
  input: MiniMaxH3LocalGraphInput
): ComfyGraph => {
  const usesPddAccelerator = isMiniMaxH3PddAcceleratorQuality(input.quality);
  const { nodes: referenceNodes, referenceInputs } = buildReferenceNodes(input);
  const shiftedModel: ComfyNodeOutputLink = input.vfxLora
    ? [VFX_LORA_NODE_ID, 0]
    : ["4", 0];
  const conditioning: ComfyNodeOutputLink = isSourceClipGuidedInGraph(input)
    ? [SOURCE_CLIP_GUIDE_NODE_ID, 0]
    : ["8", 0];
  return mergeComfyGraphParts([
    referenceNodes,
    buildVfxLoraNodes(input.vfxLora),
    buildSourceClipGuideNodes(input),
    buildAcceleratorNodes(input.quality, shiftedModel),
    {
      "1": {
        class_type: "UNETLoader",
        inputs: {
          unet_name: MINIMAX_H3_LOCAL_MODEL_FILES.unet,
          weight_dtype: "default"
        }
      },
      "3": {
        class_type: "MiniMaxChunkFeedForward",
        inputs: {
          model: usesPddAccelerator ? ["1", 0] : ["2", 0],
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
          clip_name: MINIMAX_H3_LOCAL_MODEL_FILES.textEncoder,
          type: "minimax",
          device: "default"
        }
      },
      "6": {
        class_type: "VAELoader",
        inputs: { vae_name: MINIMAX_H3_LOCAL_MODEL_FILES.videoVae }
      },
      "7": {
        class_type: "VAELoader",
        inputs: { vae_name: MINIMAX_H3_LOCAL_MODEL_FILES.audioVae }
      },
      "8": {
        class_type: "MiniMaxH3ReferenceToVideo",
        inputs: {
          clip: ["5", 0],
          vae: ["6", 0],
          audio_vae: ["7", 0],
          prompt: input.prompt,
          width: clampMiniMaxH3Dimension(input.width),
          height: clampMiniMaxH3Dimension(input.height),
          length: input.lengthFrames,
          ref_image_size: "match",
          ...referenceInputs
        }
      },
      "9": {
        class_type: "RandomNoise",
        inputs: { noise_seed: input.seed }
      },
      "10": {
        class_type: "BasicGuider",
        inputs: {
          model: usesPddAccelerator ? ["2", 0] : shiftedModel,
          conditioning
        }
      },
      "11": {
        class_type: "KSamplerSelect",
        inputs: { sampler_name: "euler" }
      },
      "13": {
        class_type: "SamplerCustomAdvanced",
        inputs: {
          noise: ["9", 0],
          guider: ["10", 0],
          sampler: ["11", 0],
          sigmas: usesPddAccelerator ? ["2", 1] : ["12", 0],
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
          fps: MINIMAX_H3_FPS,
          bit_depth: "auto",
          color_space: "sRGB"
        }
      },
      "19": {
        class_type: "SaveVideo",
        inputs: buildLocalVideoSaveInputs({
          filenamePrefix: "video/mago_minimax_h3",
          videoNodeId: "16"
        })
      }
    }
  ]);
};

export type MiniMaxH3RenderRequest = {
  prompt: string;
  width: number;
  height: number;
  durationSeconds: number;
  quality: MiniMaxH3Quality;
  referenceImagePaths: string[];
  referenceVideoPath?: string;
  useReferenceVideoAudio: boolean;
  seed?: number;
  vfxMode: MiniMaxH3VfxMode;
  isEditedFrameProvided: boolean;
  vfxLoraStrength: number;
};

export type MiniMaxH3RenderPlan = {
  prompt: string;
  seed: number;
  lengthFrames: number;
  referenceImagePaths: string[];
  referenceVideoPath?: string;
  vfxLora?: MiniMaxH3VfxLoraApplication;
};

export const planMiniMaxH3Render = (
  request: MiniMaxH3RenderRequest
): MiniMaxH3RenderPlan => {
  const hasAnyReference =
    request.referenceImagePaths.length > 0 || !!request.referenceVideoPath;
  if (!hasAnyReference)
    throw new Error("MiniMax H3 needs a source video or a reference image");
  const vfxLora = resolveMiniMaxH3VfxLora(
    request.vfxMode,
    request.isEditedFrameProvided
  );
  if (vfxLora && !request.referenceVideoPath)
    throw new Error("MiniMax H3 VFX modes need the source video");
  const isRequiredReferenceImageMissing =
    vfxLora?.referenceImageRule === "required" &&
    request.referenceImagePaths.length === 0;
  const isEditedFrameLora =
    request.vfxMode === "vfx_edit" && request.isEditedFrameProvided;
  if (isRequiredReferenceImageMissing && isEditedFrameLora)
    throw new Error(
      "The edited frame image is missing. Add the edited frame again"
    );
  if (isRequiredReferenceImageMissing)
    throw new Error("This VFX mode needs a reference image");
  const usableReferenceImagePaths =
    vfxLora?.referenceImageRule === "none" ? [] : request.referenceImagePaths;
  const isSourceSoundtrackWired =
    !!request.referenceVideoPath && request.useReferenceVideoAudio;
  const promptWithVfxRules = vfxLora
    ? buildMiniMaxH3VfxPrompt({
        prompt: request.prompt,
        lora: vfxLora,
        isSourceAudioGuided:
          vfxLora.sourceClipPlacement === "guide" && isSourceSoundtrackWired
      })
    : request.prompt;
  return {
    prompt: isSourceSoundtrackWired
      ? promptWithVfxRules
      : nameUnwiredSoundtrackInPrompt(promptWithVfxRules),
    seed: Number.isSafeInteger(request.seed)
      ? request.seed!
      : Math.floor(Math.random() * 2 ** RANDOM_SEED_BITS),
    lengthFrames: snapMiniMaxH3LengthFrames(request.durationSeconds),
    referenceImagePaths: usableReferenceImagePaths.slice(
      0,
      MINIMAX_H3_MAX_REFERENCE_IMAGES
    ),
    referenceVideoPath: request.referenceVideoPath,
    vfxLora: vfxLora
      ? { lora: vfxLora, strength: request.vfxLoraStrength }
      : undefined
  };
};

export const buildMiniMaxH3GraphFromPlan = ({
  request,
  plan,
  referenceImages,
  referenceVideo
}: {
  request: MiniMaxH3RenderRequest;
  plan: MiniMaxH3RenderPlan;
  referenceImages: string[];
  referenceVideo?: string;
}): ComfyGraph =>
  buildMiniMaxH3LocalGraph({
    prompt: plan.prompt,
    width: request.width,
    height: request.height,
    lengthFrames: plan.lengthFrames,
    quality: request.quality,
    seed: plan.seed,
    referenceImages,
    referenceVideo,
    useReferenceVideoAudio: request.useReferenceVideoAudio,
    vfxLora: plan.vfxLora
  });

export class ComfyMiniMaxH3Client extends ComfyWanAnimateClient {
  async submitMiniMaxH3(request: MiniMaxH3RenderRequest): Promise<string> {
    const plan = planMiniMaxH3Render(request);
    const [referenceImages, referenceVideo] = await Promise.all([
      Promise.all(
        plan.referenceImagePaths.map((imagePath) =>
          this.comfy.uploadFile(imagePath)
        )
      ),
      plan.referenceVideoPath
        ? this.comfy.uploadFile(plan.referenceVideoPath)
        : Promise.resolve(undefined)
    ]);
    return this.comfy.submitGraph(
      buildMiniMaxH3GraphFromPlan({
        request,
        plan,
        referenceImages,
        referenceVideo
      })
    );
  }
}
