import { afterEach, describe, expect, it, vi } from "vitest";

import { ComfyVlmClient } from "./comfyVlmClient";

type GraphNode = { class_type: string; inputs: Record<string, unknown> };

type Internals = {
  buildGraph(input: {
    gguf: string;
    mmproj: string;
    images: string[];
    systemPrompt: string;
    userPrompt: string;
    maxTokens: number;
    temperature: number;
    topP: number;
    nCtx: number;
    seed: number;
  }): Record<string, GraphNode>;
  buildNativeGraph(input: {
    safetensors: string;
    images: string[];
    systemPrompt: string;
    userPrompt: string;
    maxTokens: number;
    temperature: number;
    topP: number;
    seed: number;
  }): Record<string, GraphNode>;
};

const build = (images: string[], seed = 7) =>
  (
    new ComfyVlmClient("http://127.0.0.1:8188") as unknown as Internals
  ).buildGraph({
    gguf: "GGUF/model.gguf",
    mmproj: "GGUF/mmproj-BF16.gguf",
    images,
    systemPrompt: "be precise",
    userPrompt: "describe it",
    maxTokens: 512,
    temperature: 0.6,
    topP: 0.9,
    nCtx: 16_384,
    seed
  });

const json = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });

const buildNative = (images: string[], temperature = 0.6) =>
  (
    new ComfyVlmClient(
      "http://127.0.0.1:8188",
      "qwen3-vl-4b-heretic-int8"
    ) as unknown as Internals
  ).buildNativeGraph({
    safetensors: "qwen3-vl-4b-heretic_int8_dynamic_convrot.safetensors",
    images,
    systemPrompt: "be precise",
    userPrompt: "describe it",
    maxTokens: 512,
    temperature,
    topP: 0.9,
    seed: 7
  });

describe("ComfyVlmClient graph", () => {
  it("wires the loader into the caption node with no images", () => {
    const graph = build([]);
    expect(graph["1"]).toEqual({
      class_type: "MagoQwen3VLLoader",
      inputs: {
        gguf_name: "GGUF/model.gguf",
        mmproj_name: "GGUF/mmproj-BF16.gguf",
        n_ctx: 16_384,
        n_gpu_layers: -1
      }
    });
    expect(graph["2"].class_type).toBe("MagoQwen3VLCaption");
    expect(graph["2"].inputs).toMatchObject({
      vlm: ["1", 0],
      system_prompt: "be precise",
      user_prompt: "describe it",
      max_tokens: 512,
      temperature: 0.6,
      top_p: 0.9,
      seed: 7
    });
    expect(graph["2"].inputs.image1).toBeUndefined();
    expect(Object.keys(graph)).toEqual(["1", "2"]);
  });

  it("adds one LoadImage per image, in prompt order", () => {
    const graph = build(["a.png", "b.png"]);
    expect(graph["10"]).toEqual({
      class_type: "LoadImage",
      inputs: { image: "a.png" }
    });
    expect(graph["11"]).toEqual({
      class_type: "LoadImage",
      inputs: { image: "b.png" }
    });
    expect(graph["2"].inputs).toMatchObject({
      image1: ["10", 0],
      image2: ["11", 0]
    });
    expect(graph["2"].inputs.image3).toBeUndefined();
  });

  it("never sends a negative seed", () => {
    expect(build([], -5)["2"].inputs.seed).toBe(0);
  });
});

describe("ComfyVlmClient native graph", () => {
  it("loads the safetensors model and exposes generated text", () => {
    const graph = buildNative([]);
    expect(graph["1"]).toEqual({
      class_type: "CLIPLoader",
      inputs: {
        clip_name: "qwen3-vl-4b-heretic_int8_dynamic_convrot.safetensors",
        type: "stable_diffusion"
      }
    });
    expect(graph["2"].class_type).toBe("TextGenerate");
    expect(graph["2"].inputs).toMatchObject({
      clip: ["1", 0],
      max_length: 512,
      thinking: true,
      use_default_template: true
    });
    expect(graph["2"].inputs.prompt).toBe("be precise\n\ndescribe it");
    expect(graph["3"]).toEqual({
      class_type: "PreviewAny",
      inputs: { source: ["2", 0] }
    });
  });

  it("batches multiple images in prompt order", () => {
    const graph = buildNative(["a.png", "b.png", "c.png"]);
    expect(graph["20"].inputs).toEqual({
      image1: ["10", 0],
      image2: ["11", 0]
    });
    expect(graph["21"].inputs).toEqual({
      image1: ["20", 0],
      image2: ["12", 0]
    });
    expect(graph["2"].inputs.image).toEqual(["21", 0]);
  });

  it("turns sampling off for the deterministic JSON retry", () => {
    expect(buildNative([], 0)["2"].inputs.sampling_mode).toBe("off");
    expect(
      buildNative([], 0)["2"].inputs["sampling_mode.temperature"]
    ).toBeUndefined();
  });
});

describe("ComfyVlmClient.probeModels", () => {
  afterEach(() => vi.unstubAllGlobals());

  const objectInfo = (gguf: string[], mmproj: string[]) => ({
    MagoQwen3VLLoader: {
      input: {
        required: {
          gguf_name: [gguf, {}],
          mmproj_name: [mmproj, {}]
        }
      }
    }
  });

  it("resolves both files when present", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          json(
            objectInfo(
              ["GGUF/Qwen3-VL-2B-Instruct-UD-Q8_K_XL.gguf"],
              ["GGUF/mmproj-BF16.gguf"]
            )
          )
        )
    );
    await expect(
      new ComfyVlmClient("http://127.0.0.1:8188").probeModels()
    ).resolves.toEqual({
      installed: true,
      gguf: "GGUF/Qwen3-VL-2B-Instruct-UD-Q8_K_XL.gguf",
      mmproj: "GGUF/mmproj-BF16.gguf",
      safetensors: null,
      missing: []
    });
  });

  it("reports each missing file by basename", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(objectInfo([], []))));
    const status = await new ComfyVlmClient(
      "http://127.0.0.1:8188"
    ).probeModels();
    expect(status.installed).toBe(false);
    expect(status.missing).toEqual([
      "Qwen3-VL-2B-Instruct-UD-Q8_K_XL.gguf",
      "mmproj-BF16.gguf"
    ]);
  });

  it("explains an absent node rather than reporting missing weights", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({})));
    await expect(
      new ComfyVlmClient("http://127.0.0.1:8188").probeModels()
    ).rejects.toThrow("install ComfyUI-MagoNodes");
  });
});

describe("ComfyVlmClient.probeModels native", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("finds the selected model through CLIPLoader", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        json({
          CLIPLoader: {
            input: {
              required: {
                clip_name: [
                  ["vlm/qwen3-vl-4b-heretic_int8_dynamic_convrot.safetensors"],
                  {}
                ]
              }
            }
          }
        })
      )
      .mockResolvedValueOnce(json({ TextGenerate: { input: {} } }))
      .mockResolvedValueOnce(json({ PreviewAny: { input: {} } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      new ComfyVlmClient(
        "http://127.0.0.1:8188",
        "qwen3-vl-4b-heretic-int8"
      ).probeModels()
    ).resolves.toEqual({
      installed: true,
      gguf: null,
      mmproj: null,
      safetensors: "vlm/qwen3-vl-4b-heretic_int8_dynamic_convrot.safetensors",
      missing: []
    });
  });
});

describe("ComfyVlmClient.poll", () => {
  afterEach(() => vi.unstubAllGlobals());

  const client = () => new ComfyVlmClient("http://127.0.0.1:8188");

  it("returns the caption node's text when finished", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        json({
          abc: {
            status: { status_str: "success", completed: true },
            outputs: { "2": { text: ["  a cat, oil painting  "] } }
          }
        })
      )
    );
    await expect(client().poll("abc")).resolves.toEqual({
      state: "finished",
      text: "a cat, oil painting"
    });
  });

  it("surfaces an execution error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        json({
          abc: {
            status: { status_str: "error", messages: ["mmproj missing"] }
          }
        })
      )
    );
    const result = await client().poll("abc");
    expect(result.state).toBe("error");
    expect(result).toMatchObject({
      message: expect.stringContaining("mmproj missing")
    });
  });

  it("treats a completed run with no text as an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          json({ abc: { status: { completed: true }, outputs: {} } })
        )
    );
    await expect(client().poll("abc")).resolves.toEqual({
      state: "error",
      message: "ComfyUI completed without any generated text"
    });
  });

  it("reports running while the prompt is still executing", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          json({ abc: { status: { completed: false }, outputs: {} } })
        )
    );
    await expect(client().poll("abc")).resolves.toEqual({ state: "running" });
  });

  it("falls back to the queue when history has no entry yet", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({}))
      .mockResolvedValueOnce(
        json({ queue_running: [[0, "abc"]], queue_pending: [] })
      );
    vi.stubGlobal("fetch", fetchMock);
    await expect(client().poll("abc")).resolves.toEqual({ state: "running" });
  });

  it("reads native output and removes a reasoning block", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        json({
          abc: {
            status: { status_str: "success", completed: true },
            outputs: {
              "3": { text: ["<think>checking details</think>\nfinal answer"] }
            }
          }
        })
      )
    );
    const native = new ComfyVlmClient(
      "http://127.0.0.1:8188",
      "qwen3-vl-4b-heretic-int8"
    );
    await expect(native.poll("abc")).resolves.toEqual({
      state: "finished",
      text: "final answer"
    });
  });
});

describe("ComfyVlmClient.cancel", () => {
  afterEach(() => vi.unstubAllGlobals());

  const client = () => new ComfyVlmClient("http://127.0.0.1:8188");

  it("removes a prompt that hasn't started yet", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        json({ queue_pending: [[0, "abc"]], queue_running: [] })
      )
      .mockResolvedValueOnce(json({}));
    vi.stubGlobal("fetch", fetchMock);
    await client().cancel("abc");
    expect(fetchMock).toHaveBeenLastCalledWith(
      "http://127.0.0.1:8188/queue",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ delete: ["abc"] })
      })
    );
  });

  // /interrupt aborts whatever ComfyUI is executing and ignores prompt_id, so
  // cancelling a running caption would kill the user's in-progress render.
  it("never interrupts an already-running prompt", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        json({ queue_pending: [], queue_running: [[0, "abc"]] })
      );
    vi.stubGlobal("fetch", fetchMock);
    await client().cancel("abc");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalledWith(
      "http://127.0.0.1:8188/interrupt",
      expect.anything()
    );
  });
});
