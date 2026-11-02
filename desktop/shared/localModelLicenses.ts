export type LocalModelLicense = {
  modelName: string;
  huggingFaceRepo: string;
  licenseName: string;
  licenseUrl: string;
  isPermissiveLicense: boolean;
};

const MINIMAX_H3_LICENSE_URL =
  "https://huggingface.co/MiniMaxAI/MiniMax-H3/blob/main/LICENSE";

const FLUX_KLEIN_9B_LICENSE_URL =
  "https://huggingface.co/black-forest-labs/FLUX.2-klein-9B/blob/main/LICENSE.md";

const huggingFaceRepoPage = (huggingFaceRepo: string) =>
  `https://huggingface.co/${huggingFaceRepo}`;

const apacheLicensedModel = (
  modelName: string,
  huggingFaceRepo: string
): LocalModelLicense => ({
  modelName,
  huggingFaceRepo,
  licenseName: "Apache 2.0",
  licenseUrl: huggingFaceRepoPage(huggingFaceRepo),
  isPermissiveLicense: true
});

export const LOCAL_MODEL_LICENSES: LocalModelLicense[] = [
  {
    modelName: "MiniMax H3",
    huggingFaceRepo: "Comfy-Org/MiniMax-H3",
    licenseName: "MiniMax H3 Community License",
    licenseUrl: MINIMAX_H3_LICENSE_URL,
    isPermissiveLicense: false
  },
  {
    modelName: "MiniMax H3 8-step LoRA",
    huggingFaceRepo: "alibaba-pai/MiniMax-H3-Acc-LoRAs",
    licenseName: "MiniMax H3 Community License",
    licenseUrl: MINIMAX_H3_LICENSE_URL,
    isPermissiveLicense: false
  },
  {
    modelName: "MiniMax H3 VFX edit, Head swap and Style transfer LoRAs",
    huggingFaceRepo: "Alissonerdx/Minimax-H3-ComfyUI",
    licenseName: "MiniMax H3 Community License",
    licenseUrl: MINIMAX_H3_LICENSE_URL,
    isPermissiveLicense: false
  },
  {
    modelName: "MiniMax H3 Character swap LoRA",
    huggingFaceRepo: "akatz-ai/MiniMax-H3-Character-Swap-LoRA",
    licenseName: "MiniMax H3 Community License",
    licenseUrl: MINIMAX_H3_LICENSE_URL,
    isPermissiveLicense: false
  },
  apacheLicensedModel(
    "Qwen3-VL 4B Heretic",
    "ethanfel/Qwen3-VL-4B-Heretic-ComfyUI-ConvRot-INT8"
  ),
  apacheLicensedModel(
    "Qwen3-VL 2B Instruct",
    "unsloth/Qwen3-VL-2B-Instruct-GGUF"
  ),
  apacheLicensedModel("Qwen Image 2512", "unsloth/Qwen-Image-2512-GGUF"),
  apacheLicensedModel(
    "Qwen Image VAE and Qwen 2.5 VL 7B text encoder",
    "Comfy-Org/Qwen-Image_ComfyUI"
  ),
  apacheLicensedModel(
    "Qwen Image 2512 Lightning",
    "lightx2v/Qwen-Image-2512-Lightning"
  ),
  apacheLicensedModel("Qwen3.8 27B", "unsloth/Qwen3.8-27B-GGUF"),
  apacheLicensedModel("Flux 2 Klein 4B", "unsloth/FLUX.2-klein-4B-GGUF"),
  apacheLicensedModel(
    "Flux 2 Klein 4B text encoder and Flux 2 VAE",
    "Comfy-Org/vae-text-encorder-for-flux-klein-4b"
  ),
  {
    modelName: "Flux 2 Klein 9B",
    huggingFaceRepo: "unsloth/FLUX.2-klein-9B-GGUF",
    licenseName: "FLUX Non-Commercial License",
    licenseUrl: FLUX_KLEIN_9B_LICENSE_URL,
    isPermissiveLicense: false
  },
  {
    modelName: "Flux 2 Klein 9B text encoder",
    huggingFaceRepo: "Comfy-Org/vae-text-encorder-for-flux-klein-9b",
    licenseName: "FLUX Non-Commercial License",
    licenseUrl: FLUX_KLEIN_9B_LICENSE_URL,
    isPermissiveLicense: false
  }
];
