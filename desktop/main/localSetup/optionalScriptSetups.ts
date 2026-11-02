import type {
  ComfySettings,
  OptionalScriptSetupId
} from "../../shared/contracts";
import {
  hardwareVariantLabel,
  SCRIPT_TEXT_MODEL_GROUP_ID
} from "../../shared/localModelGroups";
import { FLUX2_KLEIN_MODEL_FILES } from "../imageRenders/comfyQwenClient";
import {
  LOCAL_SCRIPT_MODEL_FILES as files,
  LOCAL_SCRIPT_TEXT_MODEL_FILES
} from "../scriptProjects/comfyScriptProjectClient";
import {
  QWEN3_VL_MODEL_FILES,
  QWEN3_VL_MODEL_ALTERNATIVES,
  QWEN3_VL_MODEL_SOURCE,
  QWEN3_VL_HERETIC_MODEL_FILE,
  QWEN3_VL_HERETIC_MODEL_SOURCE
} from "../vlm/vlmModelFiles";

import type { ModelFile } from "./probeScriptSetup";

type OptionalSetup = {
  id: OptionalScriptSetupId;
  title: string;
  nodes: string[];
  files: ModelFile[];
};
const hf = (repo: string, path: string) =>
  `https://huggingface.co/${repo}/resolve/main/${path}`;

const FLUX_KLEIN_4B_SETUP_TITLE = "Flux 2 Klein 4B — sheet generation";
const FLUX_KLEIN_9B_SETUP_TITLE = "Flux 2 Klein 9B — sheet generation";

const FLUX_KLEIN_VAE_REPO = "Comfy-Org/vae-text-encorder-for-flux-klein-4b";

const fluxKleinSetup = ({
  id,
  title,
  files: fluxFiles,
  unetRepo,
  textEncoderRepo
}: {
  id: OptionalScriptSetupId;
  title: string;
  files: { unet: string; clip: string; vae: string };
  unetRepo: string;
  textEncoderRepo: string;
}): OptionalSetup => ({
  id,
  title,
  nodes: [
    "UnetLoaderGGUF",
    "CLIPLoader",
    "VAELoader",
    "EmptyFlux2LatentImage",
    "Flux2Scheduler",
    "CFGGuider",
    "SamplerCustomAdvanced"
  ],
  files: [
    {
      name: fluxFiles.unet,
      node: "UnetLoaderGGUF",
      input: "unet_name",
      folder: "unet",
      url: hf(unetRepo, fluxFiles.unet)
    },
    {
      name: fluxFiles.clip,
      node: "CLIPLoader",
      input: "clip_name",
      folder: "text_encoders",
      url: hf(textEncoderRepo, `split_files/text_encoders/${fluxFiles.clip}`)
    },
    {
      name: fluxFiles.vae,
      node: "VAELoader",
      input: "vae_name",
      folder: "vae",
      url: hf(FLUX_KLEIN_VAE_REPO, `split_files/vae/${fluxFiles.vae}`)
    }
  ]
});
export const optionalScriptSetups = (
  settings: Pick<ComfySettings, "vlmBackend" | "scriptTextModel">
): OptionalSetup[] => [
  {
    id: "qwen-image-sheet",
    title: "Qwen Image 2512 — sheet generation",
    nodes: [
      "UnetLoaderGGUF",
      "CLIPLoader",
      "VAELoader",
      "LoraLoaderModelOnly",
      "ModelSamplingAuraFlow",
      "CLIPTextEncode",
      "EmptySD3LatentImage",
      "KSampler",
      "VAEDecode",
      "PreviewImage"
    ],
    files: [
      {
        name: files.imageUnet,
        node: "UnetLoaderGGUF",
        input: "unet_name",
        folder: "unet",
        url: hf("unsloth/Qwen-Image-2512-GGUF", files.imageUnet)
      },
      {
        name: files.imageClip,
        node: "CLIPLoader",
        input: "clip_name",
        folder: "text_encoders",
        url: hf(
          "Comfy-Org/Qwen-Image_ComfyUI",
          `split_files/text_encoders/${files.imageClip}`
        )
      },
      {
        name: files.imageVae,
        node: "VAELoader",
        input: "vae_name",
        folder: "vae",
        url: hf(
          "Comfy-Org/Qwen-Image_ComfyUI",
          `split_files/vae/${files.imageVae}`
        )
      },
      {
        name: files.imageLora,
        node: "LoraLoaderModelOnly",
        input: "lora_name",
        folder: "loras",
        url: hf("lightx2v/Qwen-Image-2512-Lightning", files.imageLora)
      }
    ]
  },
  settings.vlmBackend === "qwen3-vl-4b-heretic-int8"
    ? {
        id: "vlm-captioning",
        title: "Qwen3-VL 4B Heretic — captioning (selected in Settings)",
        nodes: [
          "CLIPLoader",
          "TextGenerate",
          "PreviewAny",
          "LoadImage",
          "ImageBatch"
        ],
        files: [
          {
            name: QWEN3_VL_HERETIC_MODEL_FILE,
            node: "CLIPLoader",
            input: "clip_name",
            folder: "text_encoders",
            url: QWEN3_VL_HERETIC_MODEL_SOURCE
          }
        ]
      }
    : {
        id: "vlm-captioning",
        title: "Qwen3-VL 2B — captioning (selected in Settings)",
        nodes: ["MagoQwen3VLLoader", "MagoQwen3VLCaption", "LoadImage"],
        files: [
          {
            name: QWEN3_VL_MODEL_FILES.gguf,
            alternatives: QWEN3_VL_MODEL_ALTERNATIVES.gguf,
            node: "MagoQwen3VLLoader",
            input: "gguf_name",
            folder: "LLM/GGUF",
            url: QWEN3_VL_MODEL_SOURCE
          },
          {
            name: QWEN3_VL_MODEL_FILES.mmproj,
            alternatives: QWEN3_VL_MODEL_ALTERNATIVES.mmproj,
            node: "MagoQwen3VLLoader",
            input: "mmproj_name",
            folder: "LLM/GGUF",
            url: QWEN3_VL_MODEL_SOURCE
          }
        ]
      },
  {
    id: "script-text",
    title: `Qwen3.8 27B ${hardwareVariantLabel(SCRIPT_TEXT_MODEL_GROUP_ID, settings.scriptTextModel)} — text generation (selected in Settings)`,
    nodes: ["PrimitiveStringMultiline", "SimpleQwenVLggufV2", "PreviewAny"],
    files: [
      {
        name: LOCAL_SCRIPT_TEXT_MODEL_FILES[settings.scriptTextModel],
        node: "scriptTextInventory",
        input: "model",
        folder: "text_encoders",
        url: hf(
          "unsloth/Qwen3.8-27B-GGUF",
          LOCAL_SCRIPT_TEXT_MODEL_FILES[settings.scriptTextModel]
        )
      }
    ]
  },
  fluxKleinSetup({
    id: "flux-klein-4b-sheet",
    title: FLUX_KLEIN_4B_SETUP_TITLE,
    files: FLUX2_KLEIN_MODEL_FILES["flux2-klein-4b-q8"],
    unetRepo: "unsloth/FLUX.2-klein-4B-GGUF",
    textEncoderRepo: "Comfy-Org/vae-text-encorder-for-flux-klein-4b"
  }),
  fluxKleinSetup({
    id: "flux-klein-9b-sheet",
    title: FLUX_KLEIN_9B_SETUP_TITLE,
    files: FLUX2_KLEIN_MODEL_FILES["flux2-klein-9b-q8"],
    unetRepo: "unsloth/FLUX.2-klein-9B-GGUF",
    textEncoderRepo: "Comfy-Org/vae-text-encorder-for-flux-klein-9b"
  })
];
