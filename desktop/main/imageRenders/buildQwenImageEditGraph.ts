// Workflow graph adapted from Comfy Org's official Qwen Image Edit 2511
// template (MIT). See NOTICE.md.
import type { ComfyGraph } from "../comfy/comfyGraph";

export const QWEN_IMAGE_EDIT_OUTPUT_NODE_ID = "9";

const REFERENCE_IMAGE_NODE_IDS = ["41", "83", "84"] as const;
export const MAX_QWEN_IMAGE_EDIT_REFERENCES = REFERENCE_IMAGE_NODE_IDS.length;

export type QwenImageEditModelSetup = {
  unetLoader: "UNETLoader" | "UnetLoaderGGUF";
  files: { unet: string; clip: string; vae: string; lora: string };
  steps: number;
};

export const buildQwenImageEditGraph = ({
  modelSetup,
  referenceImages,
  prompt,
  negativePrompt,
  seed,
  outputSize
}: {
  modelSetup: QwenImageEditModelSetup;
  referenceImages: string[];
  prompt: string;
  negativePrompt: string;
  seed: number;
  outputSize?: [number, number];
}): ComfyGraph => {
  const usedReferenceImages = referenceImages.slice(
    0,
    MAX_QWEN_IMAGE_EDIT_REFERENCES
  );
  const graph: ComfyGraph = {
    "161": {
      class_type: modelSetup.unetLoader,
      inputs:
        modelSetup.unetLoader === "UnetLoaderGGUF"
          ? { unet_name: modelSetup.files.unet }
          : { unet_name: modelSetup.files.unet, weight_dtype: "default" }
    },
    "162": {
      class_type: "CLIPLoader",
      inputs: {
        clip_name: modelSetup.files.clip,
        type: "qwen_image",
        device: "default"
      }
    },
    "146": {
      class_type: "VAELoader",
      inputs: { vae_name: modelSetup.files.vae }
    }
  };
  usedReferenceImages.forEach((image, index) => {
    graph[REFERENCE_IMAGE_NODE_IDS[index]] = {
      class_type: "LoadImage",
      inputs: { image }
    };
  });
  const encoderImages: Record<string, [string, number]> = {
    image1: ["160", 0]
  };
  usedReferenceImages.slice(1).forEach((_image, index) => {
    encoderImages[`image${index + 2}`] = [
      REFERENCE_IMAGE_NODE_IDS[index + 1],
      0
    ];
  });
  const textEncoder = (text: string) => ({
    class_type: "TextEncodeQwenImageEditPlus",
    inputs: {
      clip: ["162", 0],
      vae: ["146", 0],
      prompt: text,
      ...encoderImages
    }
  });
  Object.assign(graph, {
    "160": {
      class_type: "FluxKontextImageScale",
      inputs: { image: [REFERENCE_IMAGE_NODE_IDS[0], 0] }
    },
    "156": {
      class_type: "VAEEncode",
      inputs: { pixels: ["160", 0], vae: ["146", 0] }
    },
    "151": textEncoder(prompt),
    "149": textEncoder(negativePrompt),
    "148": {
      class_type: "FluxKontextMultiReferenceLatentMethod",
      inputs: {
        conditioning: ["151", 0],
        reference_latents_method: "index_timestep_zero"
      }
    },
    "147": {
      class_type: "FluxKontextMultiReferenceLatentMethod",
      inputs: {
        conditioning: ["149", 0],
        reference_latents_method: "index_timestep_zero"
      }
    },
    "145": {
      class_type: "ModelSamplingAuraFlow",
      inputs: { model: ["161", 0], shift: 3.1 }
    },
    "152": {
      class_type: "CFGNorm",
      inputs: { model: ["145", 0], strength: 1, pre_cfg: false }
    },
    "153": {
      class_type: "LoraLoaderModelOnly",
      inputs: {
        model: ["152", 0],
        lora_name: modelSetup.files.lora,
        strength_model: 1
      }
    },
    "169": {
      class_type: "KSampler",
      inputs: {
        model: ["153", 0],
        positive: ["148", 0],
        negative: ["147", 0],
        latent_image: ["156", 0],
        seed: Math.max(0, seed),
        steps: modelSetup.steps,
        cfg: 1,
        sampler_name: "euler",
        scheduler: "simple",
        denoise: 1
      }
    },
    "158": {
      class_type: "VAEDecode",
      inputs: { samples: ["169", 0], vae: ["146", 0] }
    },
    [QWEN_IMAGE_EDIT_OUTPUT_NODE_ID]: {
      class_type: "PreviewImage",
      inputs: { images: ["158", 0] }
    }
  });
  if (outputSize) {
    graph["170"] = {
      class_type: "EmptySD3LatentImage",
      inputs: { width: outputSize[0], height: outputSize[1], batch_size: 1 }
    };
    graph["169"].inputs.latent_image = ["170", 0];
  }
  return graph;
};
