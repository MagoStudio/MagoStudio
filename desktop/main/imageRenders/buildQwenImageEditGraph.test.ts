import { describe, expect, it } from "vitest";

import {
  buildQwenImageEditGraph,
  QWEN_IMAGE_EDIT_OUTPUT_NODE_ID
} from "./buildQwenImageEditGraph";

const modelSetup = {
  unetLoader: "UNETLoader" as const,
  files: {
    unet: "unet.safetensors",
    clip: "clip.safetensors",
    vae: "vae.safetensors",
    lora: "lora.safetensors"
  },
  steps: 8
};

describe("buildQwenImageEditGraph", () => {
  it("scales the source image and feeds it to both encoders and the latent", () => {
    const graph = buildQwenImageEditGraph({
      modelSetup,
      referenceImages: ["source.png"],
      prompt: "edit",
      negativePrompt: "blur",
      seed: 5
    });

    expect(graph["41"].inputs.image).toBe("source.png");
    expect(graph["160"].inputs.image).toEqual(["41", 0]);
    expect(graph["156"].inputs.pixels).toEqual(["160", 0]);
    expect(graph["151"].inputs).toMatchObject({
      prompt: "edit",
      image1: ["160", 0]
    });
    expect(graph["151"].inputs).not.toHaveProperty("image2");
    expect(graph["149"].inputs).toMatchObject({ prompt: "blur" });
  });

  it("passes extra references unscaled as image2 and image3", () => {
    const graph = buildQwenImageEditGraph({
      modelSetup,
      referenceImages: ["source.png", "style.png", "third.png", "ignored.png"],
      prompt: "edit",
      negativePrompt: "",
      seed: 5
    });

    expect(graph["151"].inputs).toMatchObject({
      image1: ["160", 0],
      image2: ["83", 0],
      image3: ["84", 0]
    });
    expect(
      Object.values(graph).filter((node) => node.class_type === "LoadImage")
    ).toHaveLength(3);
  });

  it("samples through AuraFlow, CFGNorm and the Lightning LoRA", () => {
    const graph = buildQwenImageEditGraph({
      modelSetup,
      referenceImages: ["source.png"],
      prompt: "edit",
      negativePrompt: "",
      seed: -3
    });

    expect(graph["145"].inputs).toEqual({ model: ["161", 0], shift: 3.1 });
    expect(graph["153"].inputs).toMatchObject({
      model: ["152", 0],
      lora_name: "lora.safetensors"
    });
    expect(graph["169"].inputs).toMatchObject({
      model: ["153", 0],
      positive: ["148", 0],
      negative: ["147", 0],
      latent_image: ["156", 0],
      seed: 0,
      steps: 8,
      cfg: 1,
      sampler_name: "euler",
      scheduler: "simple"
    });
    expect(graph[QWEN_IMAGE_EDIT_OUTPUT_NODE_ID]).toEqual({
      class_type: "PreviewImage",
      inputs: { images: ["158", 0] }
    });
  });

  it("loads a GGUF unet without a weight dtype", () => {
    const graph = buildQwenImageEditGraph({
      modelSetup: { ...modelSetup, unetLoader: "UnetLoaderGGUF" },
      referenceImages: ["source.png"],
      prompt: "",
      negativePrompt: "",
      seed: 1
    });

    expect(graph["161"]).toEqual({
      class_type: "UnetLoaderGGUF",
      inputs: { unet_name: "unet.safetensors" }
    });
  });
});

it("uses explicit sheet dimensions without changing reference conditioning", () => {
  const graph = buildQwenImageEditGraph({
    modelSetup,
    referenceImages: ["portrait.png"],
    prompt: "appearance",
    negativePrompt: "",
    seed: 1,
    outputSize: [1024, 576]
  });
  expect(graph["170"]).toEqual({
    class_type: "EmptySD3LatentImage",
    inputs: { width: 1024, height: 576, batch_size: 1 }
  });
  expect(graph["169"].inputs.latent_image).toEqual(["170", 0]);
  expect(graph["151"].inputs.image1).toEqual(["160", 0]);
});
