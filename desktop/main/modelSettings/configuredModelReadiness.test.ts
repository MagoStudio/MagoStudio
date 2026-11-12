import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defaultModelPreferences } from "../../shared/defaultModelPreferences";
import { LOCAL_MODEL_DEFINITIONS } from "../../shared/localModelDefinitions";
import type { EndpointModelSettings } from "../../shared/modelSettings";
import { probeComfyRenderModel } from "../imageRenders/comfyModelValidation";
import { listModelGroupItems } from "../localSetup/listModelGroupItems";
import { probeScriptSetup } from "../localSetup/probeScriptSetup";
import { readRunningComfyAvailability } from "../localSetup/readRunningComfyAvailability";

import { applyModelGraphSettings } from "./applyModelGraphSettings";
import { configureModelRuntimeHooks } from "./modelRuntimeHooks";

describe("configured model readiness", () => {
  let settings: EndpointModelSettings;
  let files: string[];
  let customText: string | null;
  const endpoint = "http://127.0.0.1:8188";
  beforeEach(() => {
    settings = { models: {}, memoryPolicy: "auto" };
    customText = null;
    files = LOCAL_MODEL_DEFINITIONS.flatMap((definition) =>
      definition.variants.flatMap((variant) =>
        variant.components.map((component) => component.filename)
      )
    );
    configureModelRuntimeHooks({
      prepare: async (_endpoint, graph) =>
        applyModelGraphSettings(
          graph,
          settings,
          "qwen38-27b-q3",
          0,
          undefined,
          { encoderCpu: true, tiledDecode: true }
        ),
      observe: async () => {},
      memoryPolicy: async () => "auto",
      textModelPath: async () => customText,
      allowsCpuTextInstall: async () => false,
      failed: async () => {}
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (value: string) => {
        const route = new URL(value).pathname;
        if (route === "/system_stats")
          return Response.json({
            system: {
              comfyui_version: "99.0.0",
              argv: [path.resolve("ComfyUI/main.py")]
            }
          });
        if (route === "/experiment/models" || route.startsWith("/models/"))
          return Response.json([]);
        const name = decodeURIComponent(route.split("/").at(-1)!);
        if (name === "UnetLoaderGGUF") return Response.json({});
        return Response.json({
          [name]: {
            input: {
              required: Object.fromEntries(
                [
                  "unet_name",
                  "clip_name",
                  "vae_name",
                  "lora_name",
                  "pdd_file"
                ].map((input) => [input, [files]])
              )
            }
          }
        });
      })
    );
  });
  afterEach(() => {
    configureModelRuntimeHooks(null);
    vi.unstubAllGlobals();
  });
  it("validates the actual custom image loader and file instead of requiring the original GGUF download", async () => {
    const preferences = defaultModelPreferences("gguf-q5-4step");
    preferences.bindings["gguf-q5-4step:main"] = "my-edit.safetensors";
    settings.models["qwen-edit"] = preferences;
    files = files.filter((name) => name !== "Qwen-Image-Edit-2511-Q5_K_M.gguf");
    files.push("my-edit.safetensors");
    const status = await probeComfyRenderModel(endpoint, "qwen");
    expect(status.ready).toBe(true);
    expect(
      vi
        .mocked(fetch)
        .mock.calls.some(
          ([url]) => typeof url === "string" && url.endsWith("/UNETLoader")
        )
    ).toBe(true);
    expect(
      vi
        .mocked(fetch)
        .mock.calls.some(
          ([url]) => typeof url === "string" && url.endsWith("/UnetLoaderGGUF")
        )
    ).toBe(false);
  });
  it("uses custom files in Script Project image/text readiness without inventing download links", async () => {
    const preferences = defaultModelPreferences("q5");
    preferences.bindings["q5:main"] = "my-image.safetensors";
    settings.models["qwen-image"] = preferences;
    files = files.filter((name) => name !== "qwen-image-2512-Q5_K_M.gguf");
    files.push("my-image.safetensors");
    customText = path.resolve("custom-models/my-text.gguf");
    const status = await probeScriptSetup(endpoint);
    const image = status.optional.find(
      (group) => group.id === "qwen-image-sheet"
    )!;
    expect(
      image.requirements.every((item) => item.status === "installed")
    ).toBe(true);
    expect(
      image.requirements.find((item) => item.name === "my-image.safetensors")
    ).toMatchObject({ url: "", downloadUrl: undefined });
    const text = status.optional.find((group) => group.id === "script-text")!;
    expect(
      text.requirements.find((item) => item.name === "my-text.gguf")
    ).toMatchObject({
      status: "installed",
      folder: path.dirname(customText),
      downloadUrl: undefined
    });
  });
  it("counts the configured native image model as available without requiring a GGUF node pack", async () => {
    const preferences = defaultModelPreferences("q5");
    preferences.bindings["q5:main"] = "my-image.safetensors";
    settings.models["qwen-image"] = preferences;
    files = files.filter((name) => name !== "qwen-image-2512-Q5_K_M.gguf");
    files.push("my-image.safetensors");
    const available = await readRunningComfyAvailability(endpoint);
    const items = listModelGroupItems({
      groupId: "qwen-image",
      selectedModelGroupVariants: {},
      localModelsRoot: path.resolve("install")
    });
    expect(available).not.toBeNull();
    expect(items.every((item) => available!(item, "qwen-image"))).toBe(true);
  });
});
