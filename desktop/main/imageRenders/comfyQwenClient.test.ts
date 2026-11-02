import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildFlux2KleinGraph,
  ComfyQwenClient,
  FLUX2_KLEIN_MODEL_FILES,
  QWEN_MODEL_FILES,
  QWEN_Q5_4STEP_MODEL_FILES
} from "./comfyQwenClient";

type GraphBuilder = {
  buildGraph(input: {
    references: string[];
    prompt: string;
    negativePrompt: string;
    seed: number;
  }): Record<string, { class_type: string; inputs: Record<string, unknown> }>;
};

describe("ComfyQwenClient", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("treats a responding Comfy system endpoint as available", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ system: {} }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      new ComfyQwenClient("https://comfy.example").validate()
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://comfy.example/system_stats",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("reports a prompt lost by a ComfyUI restart instead of leaving it queued", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({}))
      .mockResolvedValueOnce(
        Response.json({ queue_running: [], queue_pending: [] })
      )
      .mockResolvedValueOnce(Response.json({}));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      new ComfyQwenClient("http://127.0.0.1:8188").poll("lost-prompt")
    ).resolves.toEqual({
      state: "error",
      message:
        "ComfyUI no longer has this render. ComfyUI may have restarted; start the render again."
    });
  });

  it("builds the native int8 Qwen 2511 workflow with source and references", () => {
    const client = new ComfyQwenClient(
      "http://127.0.0.1:8188",
      "native-int8-8step"
    );
    const graph = (client as unknown as GraphBuilder).buildGraph({
      references: ["source.png", "style.png"],
      prompt: "restyle the source",
      negativePrompt: "blur",
      seed: 123
    });

    expect(graph["161"].inputs).toEqual({
      unet_name: QWEN_MODEL_FILES.unet,
      weight_dtype: "default"
    });
    expect(graph["41"].inputs.image).toBe("source.png");
    expect(graph["83"].inputs.image).toBe("style.png");
    expect(graph["151"].inputs).toMatchObject({
      prompt: "restyle the source",
      image1: ["160", 0],
      image2: ["83", 0]
    });
    expect(graph["153"].inputs.lora_name).toBe(QWEN_MODEL_FILES.lora);
    expect(graph["169"].inputs).toMatchObject({ seed: 123, steps: 8 });
  });

  it("builds the GGUF Q5 workflow with the four-step Lightning LoRA", () => {
    const client = new ComfyQwenClient("http://127.0.0.1:8188");
    const graph = (client as unknown as GraphBuilder).buildGraph({
      references: ["source.png"],
      prompt: "edit the source",
      negativePrompt: "",
      seed: 456
    });

    expect(graph["161"]).toEqual({
      class_type: "UnetLoaderGGUF",
      inputs: { unet_name: QWEN_Q5_4STEP_MODEL_FILES.unet }
    });
    expect(graph["153"].inputs.lora_name).toBe(QWEN_Q5_4STEP_MODEL_FILES.lora);
    expect(graph["169"].inputs).toMatchObject({ steps: 4, seed: 456 });
  });

  it("builds a Flux 2 Klein text-to-image graph", () => {
    const graph = buildFlux2KleinGraph({
      setup: "flux2-klein-4b-q8",
      prompt: "a cinematic baker",
      width: 1280,
      height: 720,
      seed: 789
    });

    expect(graph["1"]).toEqual({
      class_type: "UnetLoaderGGUF",
      inputs: {
        unet_name: FLUX2_KLEIN_MODEL_FILES["flux2-klein-4b-q8"].unet
      }
    });
    expect(graph["2"].inputs).toMatchObject({
      clip_name: FLUX2_KLEIN_MODEL_FILES["flux2-klein-4b-q8"].clip,
      type: "flux2"
    });
    expect(graph["9"].inputs).toMatchObject({
      steps: 4,
      width: 1280,
      height: 720
    });
    expect(graph["10"].inputs).toMatchObject({ width: 1280, height: 720 });
  });

  it("builds a Flux 2 Klein edit graph with chained references", () => {
    const client = new ComfyQwenClient(
      "http://127.0.0.1:8188",
      "flux2-klein-9b-q8"
    );
    const graph = (client as unknown as GraphBuilder).buildGraph({
      references: ["source.png", "style.png"],
      prompt: "keep the subject; use the style",
      negativePrompt: "",
      seed: 321
    });

    expect(graph["1"].inputs.unet_name).toBe(
      FLUX2_KLEIN_MODEL_FILES["flux2-klein-9b-q8"].unet
    );
    expect(graph["130"].inputs).toMatchObject({
      conditioning: ["4", 0],
      latent: ["120", 0]
    });
    expect(graph["131"].inputs.conditioning).toEqual(["130", 0]);
    expect(graph["7"].inputs).toMatchObject({
      positive: ["131", 0],
      negative: ["141", 0]
    });
    expect(graph["9"].inputs).toMatchObject({
      width: ["150", 0],
      height: ["150", 1]
    });
  });
});

it("honours an explicit landscape output size when Flux edits a portrait reference", () => {
  const graph = buildFlux2KleinGraph({
    setup: "flux2-klein-4b-q8",
    references: ["portrait.png"],
    prompt: "appearance",
    width: 1024,
    height: 576,
    seed: 1,
    useReferenceSize: false
  });
  expect(graph["10"].inputs).toMatchObject({ width: 1024, height: 576 });
});
