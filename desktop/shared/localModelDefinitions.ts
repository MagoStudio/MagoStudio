import type {
  LocalModelDefinition,
  ModelComponentDefinition
} from "./modelSettings";

const ADDITIONAL_MODEL_SOURCES: Record<string, string> = {
  "Qwen-Image-Edit-2511-Q5_K_M.gguf":
    "https://huggingface.co/unsloth/Qwen-Image-Edit-2511-GGUF/resolve/main/qwen-image-edit-2511-Q5_K_M.gguf",
  "qwen_image_edit_2511_int8_convrot.safetensors":
    "https://huggingface.co/Comfy-Org/Qwen-Image-Edit_ComfyUI/resolve/main/split_files/diffusion_models/qwen_image_edit_2511_int8_convrot.safetensors",
  "Qwen-Image-Edit-2511-Lightning-4steps-V1.0-bf16.safetensors":
    "https://huggingface.co/lightx2v/Qwen-Image-Edit-2511-Lightning/resolve/main/Qwen-Image-Edit-2511-Lightning-4steps-V1.0-bf16.safetensors",
  "Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16.safetensors":
    "https://huggingface.co/lightx2v/Qwen-Image-Edit-2511-Lightning/resolve/main/Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16.safetensors",
  "flux-2-klein-9b-Q8_0.gguf":
    "https://huggingface.co/unsloth/FLUX.2-klein-9B-GGUF/resolve/main/flux-2-klein-9b-Q8_0.gguf",
  "qwen_3_8b_fp8mixed.safetensors":
    "https://huggingface.co/Comfy-Org/vae-text-encorder-for-flux-klein-9b/resolve/main/split_files/text_encoders/qwen_3_8b_fp8mixed.safetensors"
};

const component = (
  role: ModelComponentDefinition["role"],
  filename: string,
  category: string,
  loader: string,
  input: string,
  clipType?: string,
  workflowFilenames?: string[]
): ModelComponentDefinition => ({
  role,
  filename,
  category,
  loader,
  input,
  ...(ADDITIONAL_MODEL_SOURCES[filename]
    ? { downloadUrl: ADDITIONAL_MODEL_SOURCES[filename] }
    : {}),
  ...(clipType ? { clipType } : {}),
  ...(workflowFilenames ? { workflowFilenames } : {})
});
const qwenEncoder = component(
  "encoder",
  "qwen_2.5_vl_7b_fp8_scaled.safetensors",
  "text_encoders",
  "CLIPLoader",
  "clip_name",
  "qwen_image"
);
const qwenVae = component(
  "vae",
  "qwen_image_vae.safetensors",
  "vae",
  "VAELoader",
  "vae_name"
);

export const LOCAL_MODEL_DEFINITIONS: LocalModelDefinition[] = [
  {
    id: "text",
    label: "Qwen3.8 27B",
    runtime: "llama",
    wizardGroup: "local-llm",
    defaultVariant: "auto",
    supportsTiledDecode: false,
    variants: [
      {
        id: "qwen38-27b-q3",
        label: "Q3",
        bundleIds: ["local-llm-q3"],
        components: [
          component(
            "main",
            "Qwen3.8-27B-UD-Q3_K_XL.gguf",
            "text_encoders",
            "SimpleQwenVLggufV2",
            "model_path"
          )
        ]
      },
      {
        id: "qwen38-27b-q5",
        label: "Q5",
        bundleIds: ["local-llm-q5"],
        components: [
          component(
            "main",
            "Qwen3.8-27B-UD-Q5_K_XL.gguf",
            "text_encoders",
            "SimpleQwenVLggufV2",
            "model_path"
          )
        ]
      }
    ]
  },
  {
    id: "minimax",
    label: "MiniMax H3",
    runtime: "comfy",
    wizardGroup: "minimal",
    defaultVariant: "int8",
    supportsTiledDecode: false,
    variants: [
      {
        id: "int8",
        label: "INT8",
        bundleIds: ["minimax-h3", "minimax-h3-high-quality"],
        components: [
          component(
            "main",
            "minimax_h3_ref2va_pruned_int8_convrot.safetensors",
            "diffusion_models",
            "UNETLoader",
            "unet_name",
            undefined,
            ["Minimax-h3_Singularity_ref2va_Pruned_v1.3_int8.safetensors"]
          ),
          component(
            "encoder",
            "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors",
            "text_encoders",
            "CLIPLoader",
            "clip_name",
            "minimax",
            ["qwen3vl_32b_h3_ultra_uncensored_heretic_int8_convrot.safetensors"]
          ),
          component(
            "videoVae",
            "minimax_h3_video_vae_fp16.safetensors",
            "vae",
            "VAELoader",
            "vae_name"
          ),
          component(
            "audioVae",
            "minimax_h3_audio_vae_fp32.safetensors",
            "vae",
            "VAELoader",
            "vae_name"
          ),
          component(
            "accelerator",
            "MiniMax-H3-Ref2VA-Acc-8Step.safetensors",
            "pdd_acc",
            "MiniMaxH3PDDAccApply",
            "pdd_file"
          ),
          component(
            "lora",
            "minimax_h3_ref2v_turbo_4step_v0.1_comfyui_bf16.safetensors",
            "loras",
            "LoraLoaderModelOnly",
            "lora_name",
            undefined,
            [
              "robert-taomate_h3_3step_comfy.safetensors",
              "minimax_h3_ref2v_turbo_8step_v1.0_768p_comfyui_bf16.safetensors"
            ]
          )
        ]
      }
    ]
  },
  {
    id: "qwen-image",
    label: "Qwen Image 2512",
    runtime: "comfy",
    wizardGroup: "qwen-image",
    defaultVariant: "q5",
    supportsTiledDecode: true,
    variants: [
      {
        id: "q5",
        label: "Q5 · 4 steps",
        steps: 4,
        bundleIds: ["qwen-image"],
        components: [
          component(
            "main",
            "qwen-image-2512-Q5_K_M.gguf",
            "unet",
            "UnetLoaderGGUF",
            "unet_name"
          ),
          qwenEncoder,
          qwenVae,
          component(
            "lora",
            "Qwen-Image-2512-Lightning-4steps-V1.0-fp32.safetensors",
            "loras",
            "LoraLoaderModelOnly",
            "lora_name"
          )
        ]
      }
    ]
  },
  {
    id: "qwen-edit",
    label: "Qwen Image Edit 2511",
    runtime: "comfy",
    wizardGroup: null,
    defaultVariant: "default",
    supportsTiledDecode: true,
    variants: [
      {
        id: "gguf-q5-4step",
        label: "GGUF Q5 · 4 steps",
        steps: 4,
        bundleIds: [],
        components: [
          component(
            "main",
            "Qwen-Image-Edit-2511-Q5_K_M.gguf",
            "unet",
            "UnetLoaderGGUF",
            "unet_name"
          ),
          qwenEncoder,
          qwenVae,
          component(
            "lora",
            "Qwen-Image-Edit-2511-Lightning-4steps-V1.0-bf16.safetensors",
            "loras",
            "LoraLoaderModelOnly",
            "lora_name"
          )
        ]
      },
      {
        id: "native-int8-8step",
        label: "INT8 · 8 steps",
        steps: 8,
        bundleIds: [],
        components: [
          component(
            "main",
            "qwen_image_edit_2511_int8_convrot.safetensors",
            "diffusion_models",
            "UNETLoader",
            "unet_name"
          ),
          qwenEncoder,
          qwenVae,
          component(
            "lora",
            "Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16.safetensors",
            "loras",
            "LoraLoaderModelOnly",
            "lora_name"
          )
        ]
      }
    ]
  },
  {
    id: "flux",
    label: "FLUX 2 Klein",
    runtime: "comfy",
    wizardGroup: "flux-image",
    defaultVariant: "default",
    supportsTiledDecode: true,
    variants: [
      {
        id: "flux2-klein-4b-q8",
        label: "4B · Q8",
        bundleIds: ["flux2-klein-4b"],
        components: [
          component(
            "main",
            "flux-2-klein-4b-Q8_0.gguf",
            "unet",
            "UnetLoaderGGUF",
            "unet_name"
          ),
          component(
            "encoder",
            "qwen_3_4b.safetensors",
            "text_encoders",
            "CLIPLoader",
            "clip_name",
            "flux2"
          ),
          component(
            "vae",
            "flux2-vae.safetensors",
            "vae",
            "VAELoader",
            "vae_name"
          )
        ]
      },
      {
        id: "flux2-klein-9b-q8",
        label: "9B · Q8",
        bundleIds: [],
        components: [
          component(
            "main",
            "flux-2-klein-9b-Q8_0.gguf",
            "unet",
            "UnetLoaderGGUF",
            "unet_name"
          ),
          component(
            "encoder",
            "qwen_3_8b_fp8mixed.safetensors",
            "text_encoders",
            "CLIPLoader",
            "clip_name",
            "flux2"
          ),
          component(
            "vae",
            "flux2-vae.safetensors",
            "vae",
            "VAELoader",
            "vae_name"
          )
        ]
      }
    ]
  }
];
