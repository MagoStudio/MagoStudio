import type {
  LocalImageModelName,
  LocalVideoModelName
} from "../../shared/contracts";
import {
  isMiniMaxH3VfxEditedFrameProvided,
  resolveMiniMaxH3VfxLora,
  resolveMiniMaxH3VfxMode
} from "../../shared/minimaxH3VfxModes";
import { normalizeComfyEndpoint } from "../comfy/normalizeComfyEndpoint";
import { prepareModelRequirements } from "../modelSettings/prepareModelRequirements";

import {
  LTX_TILED_SAMPLER_CLASS,
  LTX_UPSCALE_MODEL_FILES,
  ltxUpscaleLoraFile,
  type LtxUpscaleFactor
} from "./comfyLtxUpscaleClient";
import {
  isMiniMaxH3PddAcceleratorQuality,
  MINIMAX_H3_LOCAL_MODEL_FILES,
  resolveMiniMaxH3Quality
} from "./comfyMiniMaxH3Client";
import { qwenImageEditSetupConfig } from "./comfyQwenClient";
import {
  MAGO_ANIMATE_MODEL_FILES,
  MAGO_ANIMATE_QUANTISATIONS,
  WAN_ANIMATE_MODEL_FILES,
  WAN_FUN_CONTROL_MODEL_FILES,
  WAN_FUN_QUANTISATIONS,
  WAN_VACE_MODEL_FILES,
  magoAnimateUnetFile,
  resolveWanFunUnetFiles
} from "./comfyWanAnimateClient";

export const COMFY_RENDER_MODEL_NAMES = [
  "qwen",
  "wan_animate_2_2",
  "wan_vace_2_1",
  "mago_style_transfer_local",
  "mago_animate",
  "ltx_2_3_spatial_upscaler",
  "minimax_h3_local"
] as const satisfies readonly (LocalImageModelName | LocalVideoModelName)[];

export type ComfyRenderModelName = (typeof COMFY_RENDER_MODEL_NAMES)[number];

const COMFY_RENDER_MODEL_NAME_SET = new Set<string>(COMFY_RENDER_MODEL_NAMES);

export const isComfyRenderModel = (
  model: string
): model is ComfyRenderModelName => COMFY_RENDER_MODEL_NAME_SET.has(model);

export interface ComfyModelStatus {
  model: ComfyRenderModelName;
  ready: boolean;
  missingNodes: string[];
  missingModels: string[];
  message: string | null;
}

type FileRequirement = {
  node: string;
  input: string;
  filename: string;
};

type Requirements = {
  nodes: string[];
  files: FileRequirement[];
};

const REQUEST_TIMEOUT_MS = 10_000;
const LTX_UPSCALE_FACTOR_2: LtxUpscaleFactor = 2;
const LTX_UPSCALE_FACTOR_4: LtxUpscaleFactor = 4;

const loaderFile = (
  node: string,
  input: string,
  filename: string
): FileRequirement => ({ node, input, filename });

const selectedValue = <T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T =>
  typeof value === "string" && allowed.some((item) => item === value)
    ? (value as T)
    : fallback;

const requirementsFor = (
  model: ComfyRenderModelName,
  settings: Record<string, unknown>
): Requirements => {
  if (model === "qwen") {
    const setup = qwenImageEditSetupConfig(settings.qwen_image_edit_setup);
    if (setup.engine === "flux2") {
      return {
        nodes: [
          "CLIPTextEncode",
          "ConditioningZeroOut",
          "ReferenceLatent",
          "ImageScaleToTotalPixels",
          "GetImageSize",
          "VAEEncode",
          "EmptyFlux2LatentImage",
          "Flux2Scheduler",
          "RandomNoise",
          "CFGGuider",
          "KSamplerSelect",
          "SamplerCustomAdvanced",
          "VAEDecode"
        ],
        files: [
          loaderFile(setup.unetLoader, "unet_name", setup.files.unet),
          loaderFile("CLIPLoader", "clip_name", setup.files.clip),
          loaderFile("VAELoader", "vae_name", setup.files.vae)
        ]
      };
    }
    return {
      nodes: [
        "TextEncodeQwenImageEditPlus",
        "FluxKontextImageScale",
        "FluxKontextMultiReferenceLatentMethod",
        "CFGNorm"
      ],
      files: [
        loaderFile(setup.unetLoader, "unet_name", setup.files.unet),
        loaderFile("CLIPLoader", "clip_name", setup.files.clip),
        loaderFile("VAELoader", "vae_name", setup.files.vae),
        loaderFile("LoraLoaderModelOnly", "lora_name", setup.files.lora)
      ]
    };
  }

  if (model === "wan_animate_2_2") {
    return {
      nodes: [
        "WanAnimateToVideo",
        "WanAnimate2Cache",
        "WanChunkFeedForward",
        "DWPreprocessor"
      ],
      files: [
        loaderFile("UNETLoader", "unet_name", WAN_ANIMATE_MODEL_FILES.unet),
        loaderFile("CLIPLoader", "clip_name", WAN_ANIMATE_MODEL_FILES.clip),
        loaderFile(
          "CLIPVisionLoader",
          "clip_name",
          WAN_ANIMATE_MODEL_FILES.clipVision
        ),
        loaderFile("VAELoader", "vae_name", WAN_ANIMATE_MODEL_FILES.vae),
        loaderFile(
          "LoraLoaderModelOnly",
          "lora_name",
          WAN_ANIMATE_MODEL_FILES.lightningLora
        ),
        loaderFile(
          "LoraLoaderModelOnly",
          "lora_name",
          WAN_ANIMATE_MODEL_FILES.relightLora
        )
      ]
    };
  }

  if (model === "wan_vace_2_1") {
    const unet =
      settings.vace_model_size === "1.3b_fp16"
        ? WAN_VACE_MODEL_FILES.unet1_3bFp16
        : WAN_VACE_MODEL_FILES.unet14bFp8;
    return {
      nodes: [
        "WanVaceToVideo",
        "DepthAnythingV2Preprocessor",
        "DWPreprocessor"
      ],
      files: [
        loaderFile("UNETLoader", "unet_name", unet),
        loaderFile("CLIPLoader", "clip_name", WAN_VACE_MODEL_FILES.clip),
        loaderFile("VAELoader", "vae_name", WAN_VACE_MODEL_FILES.vae)
      ]
    };
  }

  if (model === "mago_style_transfer_local") {
    const quantisation = selectedValue(
      settings.fun_model_size,
      WAN_FUN_QUANTISATIONS,
      "fp8_scaled"
    );
    const unets = resolveWanFunUnetFiles(quantisation);
    const loader = unets.isGguf ? "UnetLoaderGGUF" : "UNETLoader";
    return {
      nodes: ["Wan22FunControlToVideo", "WanChunkFeedForward"],
      files: [
        loaderFile(loader, "unet_name", unets.high),
        loaderFile(loader, "unet_name", unets.low),
        loaderFile("CLIPLoader", "clip_name", WAN_FUN_CONTROL_MODEL_FILES.clip),
        loaderFile("VAELoader", "vae_name", WAN_FUN_CONTROL_MODEL_FILES.vae),
        loaderFile(
          "LoraLoaderModelOnly",
          "lora_name",
          WAN_FUN_CONTROL_MODEL_FILES.speedupLoraHigh
        ),
        loaderFile(
          "LoraLoaderModelOnly",
          "lora_name",
          WAN_FUN_CONTROL_MODEL_FILES.speedupLoraLow
        )
      ]
    };
  }

  if (model === "mago_animate") {
    const quantisation = selectedValue(
      settings.animate_model_size,
      MAGO_ANIMATE_QUANTISATIONS,
      "Q4_K_M"
    );
    const loader =
      quantisation === "int8_convrot"
        ? "UNETLoader"
        : "RebelsGGUFUnetLoaderMeta";
    return {
      nodes: ["WanAnimate2ToVideo", "WanAnimate2Cache", "WanChunkFeedForward"],
      files: [
        loaderFile(loader, "unet_name", magoAnimateUnetFile(quantisation)),
        loaderFile("CLIPLoader", "clip_name", MAGO_ANIMATE_MODEL_FILES.clip),
        loaderFile(
          "CLIPVisionLoader",
          "clip_name",
          MAGO_ANIMATE_MODEL_FILES.clipVision
        ),
        loaderFile("VAELoader", "vae_name", MAGO_ANIMATE_MODEL_FILES.vae)
      ]
    };
  }

  if (model === "minimax_h3_local") {
    const usesPddAccelerator = isMiniMaxH3PddAcceleratorQuality(
      resolveMiniMaxH3Quality(settings.h3_quality)
    );
    const vfxLora = resolveMiniMaxH3VfxLora(
      resolveMiniMaxH3VfxMode(settings.vfx_mode),
      isMiniMaxH3VfxEditedFrameProvided(settings)
    );
    const isSourceClipGuided = vfxLora?.sourceClipPlacement === "guide";
    return {
      nodes: [
        "MiniMaxChunkFeedForward",
        "MiniMaxH3SigmaShift",
        "MiniMaxH3ReferenceToVideo",
        "RandomNoise",
        "BasicGuider",
        "KSamplerSelect",
        "SamplerCustomAdvanced",
        "VAEDecode",
        "VAEDecodeAudio",
        "CreateVideo",
        "SaveVideo",
        "LoadImage",
        "VHS_LoadVideo",
        ...(usesPddAccelerator ? [] : ["BasicScheduler"]),
        ...(vfxLora ? ["LoraLoaderModelOnly"] : []),
        ...(isSourceClipGuided ? ["MiniMaxH3AddGuide"] : [])
      ],
      files: [
        loaderFile(
          "UNETLoader",
          "unet_name",
          MINIMAX_H3_LOCAL_MODEL_FILES.unet
        ),
        loaderFile(
          "CLIPLoader",
          "clip_name",
          MINIMAX_H3_LOCAL_MODEL_FILES.textEncoder
        ),
        loaderFile(
          "VAELoader",
          "vae_name",
          MINIMAX_H3_LOCAL_MODEL_FILES.videoVae
        ),
        loaderFile(
          "VAELoader",
          "vae_name",
          MINIMAX_H3_LOCAL_MODEL_FILES.audioVae
        ),
        usesPddAccelerator
          ? loaderFile(
              "MiniMaxH3PDDAccApply",
              "pdd_file",
              MINIMAX_H3_LOCAL_MODEL_FILES.pddAccelerator
            )
          : loaderFile(
              "LoraLoaderModelOnly",
              "lora_name",
              MINIMAX_H3_LOCAL_MODEL_FILES.fourStepLora
            ),
        ...(vfxLora
          ? [loaderFile("LoraLoaderModelOnly", "lora_name", vfxLora.loraFile)]
          : [])
      ]
    };
  }

  const factor: LtxUpscaleFactor =
    Number(settings.ltx_upscale_factor) === LTX_UPSCALE_FACTOR_2
      ? LTX_UPSCALE_FACTOR_2
      : LTX_UPSCALE_FACTOR_4;
  return {
    nodes: [
      LTX_TILED_SAMPLER_CLASS,
      "LTXICLoRALoaderModelOnly",
      "LTXAddVideoICLoRAGuide",
      "LTXVAudioVAEEncode",
      "LTXVAudioVAEDecode",
      "LTXVTiledVAEDecode"
    ],
    files: [
      loaderFile("UnetLoaderGGUF", "unet_name", LTX_UPSCALE_MODEL_FILES.unet),
      loaderFile(
        "DualCLIPLoader",
        "clip_name1",
        LTX_UPSCALE_MODEL_FILES.textEncoder
      ),
      loaderFile(
        "DualCLIPLoader",
        "clip_name2",
        LTX_UPSCALE_MODEL_FILES.textConnector
      ),
      loaderFile("VAELoader", "vae_name", LTX_UPSCALE_MODEL_FILES.videoVae),
      loaderFile("VAELoader", "vae_name", LTX_UPSCALE_MODEL_FILES.audioVae),
      loaderFile(
        "LTXICLoRALoaderModelOnly",
        "lora_name",
        ltxUpscaleLoraFile(factor)
      )
    ]
  };
};

const record = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;

export const listComfyRenderModelNodes = (
  model: ComfyRenderModelName,
  settings: Record<string, unknown> = {}
): string[] => {
  const requirements = requirementsFor(model, settings);
  return [
    ...new Set([
      ...requirements.nodes,
      ...requirements.files.map((requirement) => requirement.node)
    ])
  ];
};

const comboValues = (
  node: Record<string, unknown>,
  inputName: string
): string[] => {
  const input = record(node.input);
  for (const groupName of ["required", "optional"]) {
    const group = record(input?.[groupName]);
    const definition = group?.[inputName];
    if (!Array.isArray(definition)) continue;
    if (Array.isArray(definition[0]))
      return definition[0].filter(
        (candidate): candidate is string => typeof candidate === "string"
      );
    if (definition[0] === "COMBO") {
      const options = record(definition[1])?.options;
      if (Array.isArray(options))
        return options.filter(
          (candidate): candidate is string => typeof candidate === "string"
        );
    }
  }
  return [];
};

const basename = (value: string): string =>
  value.split(/[\\/]/).at(-1)?.toLowerCase() ?? value.toLowerCase();

export const isComfyRenderModelName = (
  value: unknown
): value is ComfyRenderModelName =>
  typeof value === "string" &&
  COMFY_RENDER_MODEL_NAMES.some((candidate) => candidate === value);

export const probeComfyRenderModel = async (
  endpoint: string,
  model: ComfyRenderModelName,
  settings: Record<string, unknown> = {}
): Promise<ComfyModelStatus> => {
  const normalized = normalizeComfyEndpoint(endpoint);
  try {
    const requirements = await prepareModelRequirements(
      normalized,
      requirementsFor(model, settings)
    );
    const nodeNames = [
      ...new Set([
        ...requirements.nodes,
        ...requirements.files.map((requirement) => requirement.node)
      ])
    ];

    const entries = await Promise.all(
      nodeNames.map(async (nodeName) => {
        const response = await fetch(
          `${normalized}/object_info/${encodeURIComponent(nodeName)}`,
          {
            method: "GET",
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
          }
        );
        if (!response.ok)
          throw new Error(
            `ComfyUI request failed (${response.status}): ${response.statusText}`
          );
        const payload = record(await response.json());
        return [nodeName, record(payload?.[nodeName])] as const;
      })
    );
    const nodes = new Map(entries);
    const missingNodes = nodeNames.filter((nodeName) => !nodes.get(nodeName));
    const missingModels = requirements.files
      .filter((requirement) => {
        const node = nodes.get(requirement.node);
        if (!node) return false;
        const wanted = basename(requirement.filename);
        return !comboValues(node, requirement.input).some(
          (available) => basename(available) === wanted
        );
      })
      .map((requirement) => requirement.filename)
      .filter((filename, index, files) => files.indexOf(filename) === index);
    const ready = missingNodes.length === 0 && missingModels.length === 0;
    const details = [
      missingNodes.length ? `missing nodes: ${missingNodes.join(", ")}` : "",
      missingModels.length
        ? `missing model files: ${missingModels.join(", ")}`
        : ""
    ].filter(Boolean);
    return {
      model,
      ready,
      missingNodes,
      missingModels,
      message: ready
        ? null
        : `ComfyUI setup is incomplete (${details.join("; ")})`
    };
  } catch (error) {
    return {
      model,
      ready: false,
      missingNodes: [],
      missingModels: [],
      message: `Cannot validate the selected ComfyUI model: ${
        error instanceof Error ? error.message : "unknown error"
      }`
    };
  }
};

export const assertComfyRenderModelReady = async (
  endpoint: string,
  model: ComfyRenderModelName,
  settings: Record<string, unknown> = {}
): Promise<void> => {
  const status = await probeComfyRenderModel(endpoint, model, settings);
  if (!status.ready)
    throw new Error(status.message ?? "ComfyUI model is not ready");
};
