import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { listModelGroupItems } from "./listModelGroupItems";
import { readRunningComfyAvailability } from "./readRunningComfyAvailability";

describe("running ComfyUI availability", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("recognizes a nested GGUF text model from the runtime inventory", async () => {
    const items = listModelGroupItems({
      groupId: "local-llm",
      selectedModelGroupVariants: { "local-llm": "qwen38-27b-q5" },
      localModelsRoot: path.resolve("selected-install")
    });
    const model = items.find((item) => item.kind === "model-file")!;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.endsWith("/models/clip_gguf"))
          return Response.json([`shared\\${model.name}`]);
        const node = url.split("/").at(-1)!;
        return Response.json({ [node]: { input: {} } });
      })
    );
    const isModelGroupItemAvailable = await readRunningComfyAvailability(
      "http://running-comfy:8188"
    );
    expect(isModelGroupItemAvailable).not.toBeNull();
    expect(items.every(isModelGroupItemAvailable!)).toBe(true);
  });

  it.each([
    ["legacy", true],
    ["legacy", false],
    ["combo", true],
    ["combo", false]
  ] as const)(
    "checks latent upscaler inventory (%s, installed=%s)",
    async (format, isInstalled) => {
      const model = {
        kind: "model-file" as const,
        name: "spatial-upscaler.safetensors",
        absolutePath: path.resolve(
          "selected-install/models/latent_upscale_models/spatial-upscaler.safetensors"
        ),
        bytes: 1,
        sha256: "unused-by-runtime-check",
        downloadUrl: "https://example.test/spatial-upscaler.safetensors"
      };
      const choices = isInstalled ? [`shared\\${model.name}`] : [];
      const fetch = vi.fn(async (url: string) => {
        if (url.endsWith("/models/clip_gguf")) return Response.json([]);
        const node = url.split("/").at(-1)!;
        return Response.json(
          node === "LatentUpscaleModelLoader"
            ? {
                [node]: {
                  input: {
                    required: {
                      model_name:
                        format === "combo"
                          ? ["COMBO", { options: choices }]
                          : [choices]
                    }
                  }
                }
              }
            : {}
        );
      });
      vi.stubGlobal("fetch", fetch);
      const available = await readRunningComfyAvailability(
        "http://running-comfy:8188"
      );
      expect(available).not.toBeNull();
      expect(available!(model)).toBe(isInstalled);
      expect(fetch).toHaveBeenCalledWith(
        "http://running-comfy:8188/object_info/LatentUpscaleModelLoader",
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
    }
  );

  it("requires node packs to expose their required runtime nodes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        Response.json(url.endsWith("/models/clip_gguf") ? [] : {})
      )
    );
    const isModelGroupItemAvailable = await readRunningComfyAvailability(
      "http://running-comfy:8188"
    );
    expect(isModelGroupItemAvailable).not.toBeNull();
    const items = listModelGroupItems({
      groupId: "minimal",
      selectedModelGroupVariants: {},
      localModelsRoot: path.resolve("selected-install")
    });
    for (const item of items.filter((item) => item.kind === "node-pack"))
      expect(isModelGroupItemAvailable!(item)).toBe(false);
  });

  it("returns no runtime snapshot when the server cannot be queried", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("Unavailable", { status: 503 }))
    );
    expect(
      await readRunningComfyAvailability("http://running-comfy:8188")
    ).toBeNull();
  });
});
