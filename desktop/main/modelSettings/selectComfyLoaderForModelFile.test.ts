import { describe, expect, it } from "vitest";

import { selectComfyLoaderForModelFile } from "./selectComfyLoaderForModelFile";

const mainComponent = { role: "main", loader: "DefinitionLoader" } as const;

describe("selectComfyLoaderForModelFile", () => {
  it("loads a GGUF main model with the GGUF loader in ComfyUI", () => {
    expect(
      selectComfyLoaderForModelFile({
        component: mainComponent,
        filename: "Custom-Main.GGUF",
        runtime: "comfy"
      })
    ).toBe("UnetLoaderGGUF");
  });

  it("loads any other main model with the core UNET loader in ComfyUI", () => {
    expect(
      selectComfyLoaderForModelFile({
        component: mainComponent,
        filename: "custom-main.safetensors",
        runtime: "comfy"
      })
    ).toBe("UNETLoader");
  });

  it("keeps the definition loader outside ComfyUI and for non-main components", () => {
    expect(
      selectComfyLoaderForModelFile({
        component: mainComponent,
        filename: "text.gguf",
        runtime: "llama"
      })
    ).toBe("DefinitionLoader");
    expect(
      selectComfyLoaderForModelFile({
        component: { role: "vae", loader: "VAELoader" },
        filename: "vae.gguf",
        runtime: "comfy"
      })
    ).toBe("VAELoader");
  });
});
