import type { ComfyGraph } from "../comfy/comfyGraph";

import { buildLocalVideoSaveInputs } from "./comfyVideoSave";
import { ComfyWanAnimateClient } from "./comfyWanAnimateClient";

const RANDOM_SEED_BITS = 32;
const LTX_VAE_SPATIAL_DOWNSCALE = 32;
export const LTX_TILED_SAMPLER_CLASS = "LtxTiledSamplerPatch";
export const DEFAULT_LTX_TILE_SIZE = 1024;
export const MIN_LTX_TILE_SIZE = 512;
export const MAX_LTX_TILE_SIZE = 2048;
const MAX_LTX_TILES_PER_AXIS = 8;

export const normalizeLtxUpscaleDimension = (
  value: number,
  factor: LtxUpscaleFactor
): number => {
  const alignment = LTX_VAE_SPATIAL_DOWNSCALE * factor;
  return Math.max(alignment, Math.ceil(value / alignment) * alignment);
};

export const LTX_UPSCALE_MODEL_FILES = {
  unet: "ltx-2.3-22b-distilled-1.1-UD-Q5_K_M.gguf",
  textEncoder: "gemma_3_12B_it_fp4_mixed.safetensors",
  textConnector: "ltx-2.3-22b-dev_embeddings_connectors.safetensors",
  videoVae: "ltx-2.3-22b-distilled_video_vae.safetensors",
  audioVae: "ltx-2.3-22b-distilled_audio_vae.safetensors"
} as const;

export type LtxUpscaleFactor = 2 | 4;

export const ltxUpscaleLoraFile = (factor: LtxUpscaleFactor): string =>
  `ltx-2.3-22b-ic-lora-pixel-spatial-upscaler-x${factor}-0.9.safetensors`;

export const computeLtxTileGrid = (
  outputWidth: number,
  outputHeight: number,
  tileSize: number
): { tilesW: number; tilesH: number; bypassTiling: boolean } => {
  const safeTileSize = Math.min(
    MAX_LTX_TILE_SIZE,
    Math.max(MIN_LTX_TILE_SIZE, Math.round(tileSize))
  );
  const enableTiling =
    outputWidth > safeTileSize || outputHeight > safeTileSize;
  return {
    tilesW: enableTiling
      ? Math.min(
          MAX_LTX_TILES_PER_AXIS,
          Math.max(1, Math.ceil(outputWidth / safeTileSize))
        )
      : 1,
    tilesH: enableTiling
      ? Math.min(
          MAX_LTX_TILES_PER_AXIS,
          Math.max(1, Math.ceil(outputHeight / safeTileSize))
        )
      : 1,
    bypassTiling: !enableTiling
  };
};

export class ComfyLtxUpscaleClient extends ComfyWanAnimateClient {
  override async validate(): Promise<void> {
    await super.validate();
    const info = await this.comfy.getJson(
      `/object_info/${encodeURIComponent(LTX_TILED_SAMPLER_CLASS)}`
    );
    if (!info[LTX_TILED_SAMPLER_CLASS]) {
      throw new Error(
        `ComfyUI has no ${LTX_TILED_SAMPLER_CLASS} node — install ComfyUI-MagoNodes and restart ComfyUI`
      );
    }
  }

  async submitLtxUpscale(input: {
    videoPath: string;
    prompt: string;
    negativePrompt: string;
    width: number;
    height: number;
    factor: LtxUpscaleFactor;
    loraStrength: number;
    tileSize: number;
    seed?: number;
  }): Promise<string> {
    const video = await this.comfy.uploadFile(input.videoPath);
    return this.comfy.submitGraph(
      this.buildLtxGraph({
        ...input,
        video,
        seed: Number.isSafeInteger(input.seed)
          ? input.seed!
          : Math.floor(Math.random() * 2 ** RANDOM_SEED_BITS)
      })
    );
  }

  private buildLtxGraph(input: {
    video: string;
    prompt: string;
    negativePrompt: string;
    width: number;
    height: number;
    factor: LtxUpscaleFactor;
    loraStrength: number;
    tileSize: number;
    seed: number;
  }): ComfyGraph {
    const outputWidth = normalizeLtxUpscaleDimension(input.width, input.factor);
    const outputHeight = normalizeLtxUpscaleDimension(
      input.height,
      input.factor
    );
    const tileGrid = computeLtxTileGrid(
      outputWidth,
      outputHeight,
      input.tileSize
    );
    return {
      "1": { class_type: "LoadVideo", inputs: { file: input.video } },
      "2": {
        class_type: "GetVideoComponents",
        inputs: { video: ["1", 0] }
      },
      "3": {
        class_type: "UnetLoaderGGUF",
        inputs: { unet_name: LTX_UPSCALE_MODEL_FILES.unet }
      },
      "4": {
        class_type: "DualCLIPLoader",
        inputs: {
          clip_name1: LTX_UPSCALE_MODEL_FILES.textEncoder,
          clip_name2: LTX_UPSCALE_MODEL_FILES.textConnector,
          type: "ltxv",
          device: "default"
        }
      },
      "5": {
        class_type: "VAELoader",
        inputs: { vae_name: LTX_UPSCALE_MODEL_FILES.videoVae }
      },
      "6": {
        class_type: "VAELoader",
        inputs: { vae_name: LTX_UPSCALE_MODEL_FILES.audioVae }
      },
      "7": {
        class_type: "CLIPTextEncode",
        inputs: { text: input.prompt, clip: ["4", 0] }
      },
      "8": {
        class_type: "CLIPTextEncode",
        inputs: { text: input.negativePrompt, clip: ["4", 0] }
      },
      "9": {
        class_type: "LTXVConditioning",
        inputs: {
          positive: ["7", 0],
          negative: ["8", 0],
          frame_rate: ["2", 2]
        }
      },
      "10": {
        class_type: "LTXICLoRALoaderModelOnly",
        inputs: {
          model: ["3", 0],
          lora_name: ltxUpscaleLoraFile(input.factor),
          strength_model: input.loraStrength
        }
      },
      "11": {
        class_type: "ImageScale",
        inputs: {
          image: ["2", 0],
          upscale_method: "lanczos",
          width: outputWidth,
          height: outputHeight,
          crop: "disabled"
        }
      },
      "12": {
        class_type: "VAEEncode",
        inputs: { pixels: ["11", 0], vae: ["5", 0] }
      },
      "13": {
        class_type: "LTXAddVideoICLoRAGuide",
        inputs: {
          positive: ["9", 0],
          negative: ["9", 1],
          vae: ["5", 0],
          latent: ["12", 0],
          image: ["11", 0],
          frame_idx: 0,
          strength: 1,
          latent_downscale_factor: ["10", 1],
          crop: "disabled",
          use_tiled_encode: true,
          tile_size: 256,
          tile_overlap: 64
        }
      },
      "14": {
        class_type: "LTXVAudioVAEEncode",
        inputs: { audio: ["2", 1], audio_vae: ["6", 0] }
      },
      "15": {
        class_type: "LTXVSetAudioRefTokens",
        inputs: {
          positive: ["13", 0],
          negative: ["13", 1],
          audio_latent: ["14", 0]
        }
      },
      "16": {
        class_type: "CFGGuider",
        inputs: {
          model: ["28", 0],
          positive: ["13", 0],
          negative: ["13", 1],
          cfg: 1
        }
      },
      "28": {
        class_type: LTX_TILED_SAMPLER_CLASS,
        inputs: {
          model: ["10", 0],
          tiles_h: tileGrid.tilesH,
          tiles_w: tileGrid.tilesW,
          overlap_h: 6,
          overlap_w: 6,
          tiles_t: 1,
          overlap_t: 8,
          bypass_tiling: tileGrid.bypassTiling,
          debug: true
        }
      },
      "17": {
        class_type: "LTXVConcatAVLatent",
        inputs: { video_latent: ["13", 2], audio_latent: ["15", 2] }
      },
      "18": {
        class_type: "RandomNoise",
        inputs: { noise_seed: input.seed }
      },
      "20": {
        class_type: "KSamplerSelect",
        inputs: { sampler_name: "euler_cfg_pp" }
      },
      "21": {
        class_type: "ManualSigmas",
        inputs: {
          sigmas:
            "1.0, 0.99375, 0.9875, 0.98125, 0.975, 0.909375, 0.725, 0.421875, 0.0"
        }
      },
      "22": {
        class_type: "SamplerCustomAdvanced",
        inputs: {
          noise: ["18", 0],
          guider: ["16", 0],
          sampler: ["20", 0],
          sigmas: ["21", 0],
          latent_image: ["17", 0]
        }
      },
      "23": {
        class_type: "LTXVSeparateAVLatent",
        inputs: { av_latent: ["22", 0] }
      },
      "24": {
        class_type: "LTXVCropGuides",
        inputs: {
          positive: ["13", 0],
          negative: ["13", 1],
          latent: ["23", 0]
        }
      },
      "25": {
        class_type: "LTXVAudioVAEDecode",
        inputs: { samples: ["23", 1], audio_vae: ["6", 0] }
      },
      "26": {
        class_type: "LTXVTiledVAEDecode",
        inputs: {
          vae: ["5", 0],
          latents: ["24", 2],
          horizontal_tiles: 2,
          vertical_tiles: 2,
          overlap: 6,
          last_frame_fix: false,
          working_device: "auto",
          working_dtype: "auto"
        }
      },
      "27": {
        class_type: "CreateVideo",
        inputs: { images: ["26", 0], audio: ["25", 0], fps: ["2", 2] }
      },
      "19": {
        class_type: "SaveVideo",
        inputs: buildLocalVideoSaveInputs({
          filenamePrefix: "video/Mago_LTX_Spatial_Upscale",
          videoNodeId: "27"
        })
      }
    };
  }
}
