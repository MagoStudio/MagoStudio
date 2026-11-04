/* oxlint-disable eslint/no-magic-numbers -- pinned release sizes in bytes */
export interface LocalModelFile {
  targetPath: string;
  url: string;
  bytes: number;
  sha256?: string;
}

export interface LocalModelBundle {
  id: string;
  name: string;
  isOptional: boolean;
  files: LocalModelFile[];
}

// Unsloth replaced this file on main on 2026-10-29. Keep the download tied
// to the revision matching the trusted SHA-256 and byte count below.
export const QWEN_IMAGE_2512_UNET_URL =
  "https://huggingface.co/unsloth/Qwen-Image-2512-GGUF/resolve/1626d7531f84b4d2ea1cd6d2e69f41ec027dd354/qwen-image-2512-Q5_K_M.gguf";

export const LOCAL_MODEL_BUNDLES: LocalModelBundle[] = [
  {
    id: "qwen-vl",
    name: "Qwen3-VL 4B captioning",
    isOptional: false,
    files: [
      {
        targetPath:
          "models/text_encoders/qwen3-vl-4b-heretic_int8_dynamic_convrot.safetensors",
        url: "https://huggingface.co/ethanfel/Qwen3-VL-4B-Heretic-ComfyUI-ConvRot-INT8/resolve/main/qwen3-vl-4b-heretic_int8_dynamic_convrot.safetensors",
        bytes: 4836924472,
        sha256:
          "c766f6f078bbfe7474699faaceb9484251b0c7c8dd4bf2d5730b320feca54778"
      }
    ]
  },
  {
    id: "minimax-h3",
    name: "MiniMax H3",
    isOptional: false,
    files: [
      {
        targetPath:
          "models/diffusion_models/minimax_h3_ref2va_pruned_int8_convrot.safetensors",
        url: "https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/diffusion_models/minimax_h3_ref2va_pruned_int8_convrot.safetensors",
        bytes: 20970379616,
        sha256:
          "9255f52b6677845ad238f20dfaafa94727053694127ab7f255c048f0f9365779"
      },
      {
        targetPath:
          "models/text_encoders/qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors",
        url: "https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/text_encoders/qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors",
        bytes: 15687142551,
        sha256:
          "35a88d51044231fe332301d7a62aa81e3f2cba62febeb446e2c1e3e0ef76f2c6"
      },
      {
        targetPath: "models/vae/minimax_h3_video_vae_fp16.safetensors",
        url: "https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_video_vae_fp16.safetensors",
        bytes: 5207808496,
        sha256:
          "7c1f131492e7eddacaac9069a61b81bdd39de5cc96561e677c5eab1cdce5e522"
      },
      {
        targetPath: "models/vae/minimax_h3_audio_vae_fp32.safetensors",
        url: "https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_audio_vae_fp32.safetensors",
        bytes: 605254808,
        sha256:
          "8e505d95dd1561d47abd43d4238fd40d9bb1ae9e147ed0a4cba778d76ae4db48"
      },
      {
        targetPath:
          "models/loras/minimax_h3_ref2v_turbo_4step_v0.1_comfyui_bf16.safetensors",
        url: "https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/loras/minimax_h3_ref2v_turbo_4step_v0.1_comfyui_bf16.safetensors",
        bytes: 1956193000,
        sha256:
          "5b9ab5ade15d0775676d01a907268a69a1468dc6033b3b0d3ded5502f3ebb84c"
      }
    ]
  },
  {
    id: "minimax-h3-high-quality",
    name: "MiniMax H3 — high quality timeline",
    isOptional: false,
    files: [
      {
        targetPath: "models/pdd_acc/MiniMax-H3-Ref2VA-Acc-8Step.safetensors",
        url: "https://huggingface.co/alibaba-pai/MiniMax-H3-Acc-LoRAs/resolve/main/MiniMax-H3-Ref2VA-Acc-8Step.safetensors",
        bytes: 1372450680,
        sha256:
          "111c82e669f6e20e628228172edf39395f1a9fc3ad049793895e542c0f55b18c"
      }
    ]
  },
  {
    id: "minimax-h3-vfx-loras",
    name: "MiniMax H3 — VFX tasks",
    isOptional: false,
    files: [
      {
        targetPath: "models/loras/minimax_h3_vfx_edit_v1.0_r128.safetensors",
        url: "https://huggingface.co/Alissonerdx/Minimax-H3-ComfyUI/resolve/main/loras/minimax_h3_vfx_edit_v1.0_r128.safetensors",
        bytes: 1240518744,
        sha256:
          "9053607b28f271a22cf3f70d7fa534b35eb88d2259dcbec03d63a97d8929c210"
      },
      {
        targetPath:
          "models/loras/minimax_h3_vfx_edit_v1.0_r128_ffp.safetensors",
        url: "https://huggingface.co/Alissonerdx/Minimax-H3-ComfyUI/resolve/main/loras/minimax_h3_vfx_edit_v1.0_r128_ffp.safetensors",
        bytes: 1240518720,
        sha256:
          "995fabeafa3626477092c3f9baf30dededbf18649b2a53e6fe26ee28f07396c8"
      },
      {
        targetPath: "models/loras/minimax_h3_head_swap_v1.0_r32.safetensors",
        url: "https://huggingface.co/Alissonerdx/Minimax-H3-ComfyUI/resolve/main/loras/minimax_h3_head_swap_v1.0_r32.safetensors",
        bytes: 310177072,
        sha256:
          "ea97bd1a8178460661055784d63b4cb560732196fd15d5d7f33bfd214b65ab00"
      },
      {
        targetPath: "models/loras/h3_character_swap_pro4500_1000.safetensors",
        url: "https://huggingface.co/akatz-ai/MiniMax-H3-Character-Swap-LoRA/resolve/main/h3_character_swap_pro4500_1000.safetensors",
        bytes: 155110320,
        sha256:
          "4b2a3f420ae804c0aa3422761ff84dbd1bf52eef6900ffab6d2e66df63cb4e79"
      },
      {
        targetPath:
          "models/loras/minimax_h3_style_transfer_v1.0_r64.safetensors",
        url: "https://huggingface.co/Alissonerdx/Minimax-H3-ComfyUI/resolve/main/loras/minimax_h3_style_transfer_v1.0_r64.safetensors",
        bytes: 620306000,
        sha256:
          "3be2d89ca3476ed952251463499896a4a323cce9d82af6d0e83609ceb4e1e25e"
      }
    ]
  },
  {
    id: "local-llm-q5",
    name: "Qwen3.8 27B Q5 — text generation",
    isOptional: true,
    files: [
      {
        targetPath: "models/text_encoders/Qwen3.8-27B-UD-Q5_K_XL.gguf",
        url: "https://huggingface.co/unsloth/Qwen3.8-27B-GGUF/resolve/main/Qwen3.8-27B-UD-Q5_K_XL.gguf",
        bytes: 20876938144,
        sha256:
          "8601193d3d5760c37fb8ce1b43afebc69df5fb24e1fbc5a547c32e2200305276"
      }
    ]
  },
  {
    id: "local-llm-q3",
    name: "Qwen3.8 27B Q3 — text generation",
    isOptional: true,
    files: [
      {
        targetPath: "models/text_encoders/Qwen3.8-27B-UD-Q3_K_XL.gguf",
        url: "https://huggingface.co/unsloth/Qwen3.8-27B-GGUF/resolve/main/Qwen3.8-27B-UD-Q3_K_XL.gguf",
        bytes: 13146393504,
        sha256:
          "8c2a45ff85e7674ca185ec8eb6cdeab0e617ed9d8018caed0b64380eb2a67a5e"
      }
    ]
  },
  {
    id: "qwen-image",
    name: "Qwen Image 2512",
    isOptional: true,
    files: [
      {
        targetPath: "models/unet/qwen-image-2512-Q5_K_M.gguf",
        url: QWEN_IMAGE_2512_UNET_URL,
        bytes: 15000074784,
        sha256:
          "e9ea2c513cf25645829fcccbd0882e821b858f4fabfb48ae1b5f103da68ecd0f"
      },
      {
        targetPath:
          "models/text_encoders/qwen_2.5_vl_7b_fp8_scaled.safetensors",
        url: "https://huggingface.co/Comfy-Org/Qwen-Image_ComfyUI/resolve/main/split_files/text_encoders/qwen_2.5_vl_7b_fp8_scaled.safetensors",
        bytes: 9384670680,
        sha256:
          "cb5636d852a0ea6a9075ab1bef496c0db7aef13c02350571e388aea959c5c0b4"
      },
      {
        targetPath: "models/vae/qwen_image_vae.safetensors",
        url: "https://huggingface.co/Comfy-Org/Qwen-Image_ComfyUI/resolve/main/split_files/vae/qwen_image_vae.safetensors",
        bytes: 253806246,
        sha256:
          "a70580f0213e67967ee9c95f05bb400e8fb08307e017a924bf3441223e023d1f"
      },
      {
        targetPath:
          "models/loras/Qwen-Image-2512-Lightning-4steps-V1.0-fp32.safetensors",
        url: "https://huggingface.co/lightx2v/Qwen-Image-2512-Lightning/resolve/main/Qwen-Image-2512-Lightning-4steps-V1.0-fp32.safetensors",
        bytes: 1698951104,
        sha256:
          "ad12117461cb41e2ea637fec8df6392ce8e8550c47fbe2b829ed3deb98262066"
      }
    ]
  },
  {
    id: "flux2-klein-4b",
    name: "Flux 2 Klein 4B",
    isOptional: true,
    files: [
      {
        targetPath: "models/unet/flux-2-klein-4b-Q8_0.gguf",
        url: "https://huggingface.co/unsloth/FLUX.2-klein-4B-GGUF/resolve/main/flux-2-klein-4b-Q8_0.gguf",
        bytes: 4300644928,
        sha256:
          "24a812e8f9b640e21c784164ea48571d8017ca22873696f4badeeabb006d509c"
      },
      {
        targetPath: "models/text_encoders/qwen_3_4b.safetensors",
        url: "https://huggingface.co/Comfy-Org/vae-text-encorder-for-flux-klein-4b/resolve/main/split_files/text_encoders/qwen_3_4b.safetensors",
        bytes: 8044982048,
        sha256:
          "6c671498573ac2f7a5501502ccce8d2b08ea6ca2f661c458e708f36b36edfc5a"
      },
      {
        targetPath: "models/vae/flux2-vae.safetensors",
        url: "https://huggingface.co/Comfy-Org/vae-text-encorder-for-flux-klein-4b/resolve/main/split_files/vae/flux2-vae.safetensors",
        bytes: 336211292,
        sha256:
          "868fe7b343cc8f3a19dbcfcafbc3d5f888802be3f89bd81b65b3621a066ce8f3"
      }
    ]
  }
];

export const totalBytesForBundles = (bundles: LocalModelBundle[]): number =>
  bundles.reduce(
    (runningTotal, bundle) =>
      runningTotal +
      bundle.files.reduce((bundleTotal, file) => bundleTotal + file.bytes, 0),
    0
  );

export const requiredBundles = (bundles: LocalModelBundle[]) =>
  bundles.filter((bundle) => !bundle.isOptional);

export const huggingFaceRepoOfUrl = (url: string): string | null =>
  /^https:\/\/huggingface\.co\/([^/]+\/[^/]+)\/resolve\//.exec(url)?.[1] ??
  null;

/** A complete ZIP, or raw byte chunks concatenated in order when split. */
export const COMFY_STARTER_BUNDLE = {
  partUrls: [
    "https://downloads.app.mago.studio/ComfyUI_windows_portable_mago-5-10-2026.zip"
  ],
  partBytes: [3389774162],
  archiveBytes: 3389774162,
  extractedBytes: 5436932477,
  sha256: "4319814af3bfe8b446b02bc69db9bd5531cb13dc16db79f3455f6ea8f54b22da"
};
export const STARTER_DOWNLOAD_BYTES =
  totalBytesForBundles(requiredBundles(LOCAL_MODEL_BUNDLES)) +
  COMFY_STARTER_BUNDLE.archiveBytes;
// Split downloads also need space for a joined ZIP; a single ZIP is used directly.
export const starterEngineRequiredBytes = () =>
  COMFY_STARTER_BUNDLE.archiveBytes *
    (COMFY_STARTER_BUNDLE.partUrls.length > 1 ? 2 : 1) +
  COMFY_STARTER_BUNDLE.extractedBytes;
export const STARTER_REQUIRED_BYTES =
  totalBytesForBundles(requiredBundles(LOCAL_MODEL_BUNDLES)) +
  starterEngineRequiredBytes();
