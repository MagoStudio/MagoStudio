import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defaultModelPreferences } from "../../shared/defaultModelPreferences";
import type { LibrarySettings } from "../librarySettings";

const probe = vi.hoisted(() => vi.fn());
const readLlamaCppPackageInstalled = vi.hoisted(() => vi.fn());
vi.mock("./readLlamaCppPackageInstalled", () => ({
  readLlamaCppPackageInstalled
}));
vi.mock("./runModelProbe", () => ({ runModelProbe: probe }));
vi.mock("../localSetup/findComfyPython", () => ({
  findComfyPython: async () => "python"
}));
vi.mock("../localSetup/probeHardware", () => ({
  probeHardware: async () => ({
    graphicsCardName: "Test GPU",
    videoMemoryLabel: "8 GB",
    systemMemoryLabel: "64 GB",
    verdict: "limited"
  })
}));

import { ModelSettingsService } from "./ModelSettingsService";
import { ModelSettingsStore } from "./ModelSettingsStore";

describe("ModelSettingsService", () => {
  let directory: string,
    root: string,
    store: ModelSettingsStore,
    service: ModelSettingsService;
  let offline = false;
  let isTextLoaderNodeInstalled = true;
  let isPreviewAnyNodeInstalled = true;
  const endpoint = "http://127.0.0.1:8188";
  beforeEach(async () => {
    directory = await mkdtemp(path.join(os.tmpdir(), "model-service-"));
    root = path.join(directory, "ComfyUI");
    await mkdir(path.join(root, "models", "text_encoders"), {
      recursive: true
    });
    await writeFile(path.join(root, "main.py"), "");
    await writeFile(
      path.join(root, "models", "text_encoders", "custom.gguf"),
      "model bytes"
    );
    store = new ModelSettingsStore(path.join(directory, "models.json"));
    const settings = {
      getComfyEndpoint: async () => endpoint,
      getScriptTextModel: async () => "qwen38-27b-q3",
      getSetupScriptTextModel: async () => "qwen38-27b-q3",
      getInferredComfyInstall: async () => null,
      getLocalModelsRoot: async () => null,
      getLibraryRoot: async () => directory,
      hasCompletedLocalSetup: async () => false
    } as unknown as LibrarySettings;
    service = new ModelSettingsService(store, settings, {
      version: "0.19.3",
      commit: "abc123",
      development: true
    });
    offline = false;
    isTextLoaderNodeInstalled = true;
    isPreviewAnyNodeInstalled = true;
    readLlamaCppPackageInstalled.mockReset().mockResolvedValue(true);
    probe.mockReset().mockResolvedValue({
      status: "success",
      message: "Matched shapes",
      details: { comparedTensors: 42 }
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (value: string) => {
        if (offline) throw Error("Offline");
        const route = new URL(value).pathname;
        const body =
          route === "/system_stats"
            ? {
                system: {
                  comfyui_version: "0.3.75",
                  python_version: "3.12.0",
                  argv: [path.join(root, "main.py")]
                },
                devices: [
                  {
                    name: "Test GPU",
                    vram_total: 32 * 1024 ** 3,
                    vram_free: 1024 ** 3
                  }
                ]
              }
            : route === "/experiment/models"
              ? [
                  {
                    name: "text_encoders",
                    folders: [path.join(root, "models", "text_encoders")]
                  }
                ]
              : route === "/object_info"
                ? {
                    ...(isTextLoaderNodeInstalled
                      ? { SimpleQwenVLggufV2: { input: { required: {} } } }
                      : {}),
                    PrimitiveStringMultiline: {},
                    ...(isPreviewAnyNodeInstalled ? { PreviewAny: {} } : {}),
                    CLIPLoader: {
                      input: { optional: { device: [["default", "cpu"]] } }
                    },
                    VAEDecodeTiled: {}
                  }
                : route === "/queue"
                  ? { queue_running: [], queue_pending: [] }
                  : [];
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      })
    );
  });
  afterEach(async () => {
    vi.unstubAllGlobals();
    await rm(directory, { recursive: true, force: true });
  });
  it("resolves a validated custom text file even when the recommended file is absent", async () => {
    const snapshot = await service.inspect({ model: "text" });
    expect(snapshot.components[0].status).toBe("missing");
    expect(
      (
        await service.check({
          model: "text",
          action: "compatibility",
          filename: "custom.gguf"
        })
      ).status
    ).toBe("success");
    const preferences = defaultModelPreferences("qwen38-27b-q3");
    preferences.bindings = { "qwen38-27b-q3:main": "custom.gguf" };
    await service.save({ model: "text", preferences, memoryPolicy: "auto" });
    expect(await service.textModelPath(endpoint)).toBe(
      path.join(root, "models", "text_encoders", "custom.gguf")
    );
    const graph = {
      a: {
        class_type: "PrimitiveStringMultiline",
        inputs: { value: '{"max_tokens":16000}' }
      },
      b: {
        class_type: "SimpleQwenVLggufV2",
        inputs: { config_override: ["a", 0] }
      }
    };
    const prepared = await service.prepare(endpoint, graph);
    expect(JSON.parse(String(prepared.a.inputs.value)).model_path).toContain(
      "custom.gguf"
    );
  });
  it("does not accept a file hash as proof of tensor compatibility", async () => {
    await service.check({
      model: "text",
      action: "hash",
      filename: "custom.gguf"
    });
    const preferences = defaultModelPreferences("qwen38-27b-q3");
    preferences.bindings = { "qwen38-27b-q3:main": "custom.gguf" };
    await expect(
      service.save({ model: "text", preferences, memoryPolicy: "auto" })
    ).rejects.toThrow("Check the candidate");
  });
  it("requires a new compatibility check after a candidate changes", async () => {
    await service.check({
      model: "text",
      action: "compatibility",
      filename: "custom.gguf"
    });
    await writeFile(
      path.join(root, "models", "text_encoders", "custom.gguf"),
      "different model contents"
    );
    const preferences = defaultModelPreferences("qwen38-27b-q3");
    preferences.bindings = { "qwen38-27b-q3:main": "custom.gguf" };
    await expect(
      service.save({ model: "text", preferences, memoryPolicy: "auto" })
    ).rejects.toThrow("changed after");
  });
  it("retains the successful version for an offline endpoint without copying it to another URL", async () => {
    await service.inspect({ model: "text" });
    offline = true;
    const snapshot = await service.inspect({ model: "text" });
    expect(snapshot.available).toBe(false);
    expect((await store.endpoint(endpoint)).host).toMatchObject({
      version: "0.3.75"
    });
    await service.inspect({
      model: "text",
      endpoint: "http://other-host:8188"
    });
    expect(
      (await store.endpoint("http://other-host:8188")).host
    ).toBeUndefined();
  });
  it("records actual workflow GPU failures without classifying generic failures as OOM", async () => {
    await service.recordFailure(endpoint, "Failed to load model from file", {
      a: { class_type: "SimpleQwenVLggufV2", inputs: {} }
    });
    expect((await store.endpoint(endpoint)).problems?.text.details?.kind).toBe(
      "load-failure"
    );
    await service.recordFailure(endpoint, "CUDA out of memory", {
      a: {
        class_type: "UNETLoader",
        inputs: {
          unet_name: "minimax_h3_ref2va_pruned_int8_convrot.safetensors"
        }
      }
    });
    expect(
      (await store.endpoint(endpoint)).problems?.minimax.details?.kind
    ).toBe("gpu-memory");
  });
  it("surfaces a newer render failure after a successful component check", async () => {
    const key = "text:qwen38-27b-q3:main:Qwen3.8-27B-UD-Q3_K_XL.gguf";
    await store.recordProblem(endpoint, key, {
      status: "success",
      message: "Loaded"
    });
    await service.recordFailure(endpoint, "CUDA out of memory", {
      text: { class_type: "SimpleQwenVLggufV2", inputs: {} }
    });
    expect(
      (await service.inspect({ model: "text" })).components[0].problem
    ).toMatchObject({ status: "error", message: "CUDA out of memory" });
    await store.recordProblem(endpoint, key, {
      status: "success",
      message: "Checked again"
    });
    expect(
      (await service.inspect({ model: "text" })).components[0].problem
    ).toMatchObject({ status: "success", message: "Checked again" });
  });
  it("does not let a successful runtime check clear an unresolved component error", async () => {
    const key = "text:qwen38-27b-q3:main:Qwen3.8-27B-UD-Q3_K_XL.gguf";
    await store.recordProblem(endpoint, key, {
      status: "mismatch",
      message: "Wrong model"
    });
    await store.recordProblem(endpoint, "text", {
      status: "success",
      message: "Runtime ready"
    });
    expect(
      (await service.inspect({ model: "text" })).components[0].problem?.status
    ).toBe("mismatch");
  });
  it("keeps a failed load test visible after a later compatibility pass", async () => {
    probe.mockImplementation(
      async (_python: string, request: { action: string }) =>
        request.action === "load"
          ? { status: "error", message: "Model probe exited 1" }
          : { status: "success", message: "Matched shapes" }
    );
    await service.check({
      model: "text",
      action: "load",
      filename: "custom.gguf"
    });
    await service.check({
      model: "text",
      action: "compatibility",
      filename: "custom.gguf"
    });
    const custom = (
      await service.inspect({ model: "text" })
    ).components[0].choices.find((choice) => choice.filename === "custom.gguf");
    expect(custom).toMatchObject({
      hasPassedModelCheck: false,
      loadTestOutcome: "failed"
    });
    const preferences = defaultModelPreferences("qwen38-27b-q3");
    preferences.bindings = { "qwen38-27b-q3:main": "custom.gguf" };
    await expect(
      service.save({ model: "text", preferences, memoryPolicy: "auto" })
    ).rejects.toThrow("failed its last load test");
  });
  it("accepts a file whose load test passed when the header check is inconclusive", async () => {
    probe.mockImplementation(
      async (_python: string, request: { action: string }) =>
        request.action === "load"
          ? { status: "success", message: "Loaded" }
          : { status: "unknown", message: "No comparable reference" }
    );
    await service.check({
      model: "text",
      action: "load",
      filename: "custom.gguf"
    });
    await service.check({
      model: "text",
      action: "compatibility",
      filename: "custom.gguf"
    });
    const custom = (
      await service.inspect({ model: "text" })
    ).components[0].choices.find((choice) => choice.filename === "custom.gguf");
    expect(custom).toMatchObject({
      hasPassedModelCheck: true,
      loadTestOutcome: "passed"
    });
    const preferences = defaultModelPreferences("qwen38-27b-q3");
    preferences.bindings = { "qwen38-27b-q3:main": "custom.gguf" };
    await service.save({ model: "text", preferences, memoryPolicy: "auto" });
    expect(
      (await service.inspect({ model: "text" })).components[0].selectedFile
    ).toBe("custom.gguf");
  });
  it("replaces a passed load test with a load test that throws", async () => {
    probe.mockResolvedValue({ status: "success", message: "Loaded" });
    await service.check({
      model: "text",
      action: "load",
      filename: "custom.gguf"
    });
    probe.mockRejectedValue(new Error("Model probe timed out"));
    const failedLoadTest = await service.check({
      model: "text",
      action: "load",
      filename: "custom.gguf"
    });
    expect(failedLoadTest.message).toBe("Model probe timed out");
    const custom = (
      await service.inspect({ model: "text" })
    ).components[0].choices.find((choice) => choice.filename === "custom.gguf");
    expect(custom).toMatchObject({
      hasPassedModelCheck: false,
      loadTestOutcome: "failed"
    });
  });
  it("keeps a candidate's header mismatch off the model in use", async () => {
    probe.mockResolvedValue({
      status: "mismatch",
      message: "Tensor shape mismatch"
    });
    await service.check({
      model: "text",
      action: "load",
      filename: "custom.gguf"
    });
    const snapshot = await service.inspect({ model: "text" });
    expect(snapshot.components[0].problem).toBeNull();
    expect(
      snapshot.components[0].choices.find(
        (choice) => choice.filename === "custom.gguf"
      )?.loadTestOutcome
    ).toBe("failed");
  });
  it("keeps a passed compatibility check after the file is hashed", async () => {
    await service.check({
      model: "text",
      action: "compatibility",
      filename: "custom.gguf"
    });
    const preferences = defaultModelPreferences("qwen38-27b-q3");
    preferences.bindings = { "qwen38-27b-q3:main": "custom.gguf" };
    await service.save({ model: "text", preferences, memoryPolicy: "auto" });
    await service.check({
      model: "text",
      action: "hash",
      filename: "custom.gguf"
    });
    const custom = (
      await service.inspect({ model: "text" })
    ).components[0].choices.find((choice) => choice.filename === "custom.gguf");
    expect(custom?.hasPassedModelCheck).toBe(true);
    expect(custom?.latestFileCheck).toMatchObject({
      kind: "hash",
      outcome: "passed"
    });
  });
  it("budgets automatic text GPU layers from total VRAM, because ComfyUI frees its own models before loading", async () => {
    await service.check({
      model: "text",
      action: "compatibility",
      filename: "custom.gguf"
    });
    const preferences = defaultModelPreferences("qwen38-27b-q3");
    preferences.bindings = { "qwen38-27b-q3:main": "custom.gguf" };
    await service.save({ model: "text", preferences, memoryPolicy: "auto" });
    const prepared = await service.prepare(endpoint, {
      "1": {
        class_type: "PrimitiveStringMultiline",
        inputs: { value: JSON.stringify({ n_gpu_layers: -1 }) }
      },
      "2": {
        class_type: "SimpleQwenVLggufV2",
        inputs: { config_override: ["1", 0] }
      }
    });
    const config = JSON.parse(String(prepared["1"].inputs.value));
    expect(config.n_gpu_layers).toBe(-1);
    expect(config.offload_kqv).toBe(true);
  });
  it("lists only GGUF files for the llama.cpp text model", async () => {
    await writeFile(
      path.join(root, "models", "text_encoders", "image_encoder.safetensors"),
      "encoder bytes"
    );
    const filenames = (
      await service.inspect({ model: "text" })
    ).components[0].choices.map((choice) => choice.filename);
    expect(filenames).toContain("custom.gguf");
    expect(filenames).not.toContain("image_encoder.safetensors");
  });
  it("lists the node pack a file needs when its loader is missing on the host", async () => {
    isTextLoaderNodeInstalled = false;
    const custom = (
      await service.inspect({ model: "text" })
    ).components[0].choices.find((choice) => choice.filename === "custom.gguf");
    expect(custom?.missingNodes).toEqual([
      expect.objectContaining({
        name: "SimpleQwenVLggufV2",
        installKind: "node",
        url: "https://github.com/KLL535/ComfyUI_Simple_Qwen3-VL-gguf"
      })
    ]);
    isTextLoaderNodeInstalled = true;
    const customWithNodes = (
      await service.inspect({ model: "text" })
    ).components[0].choices.find((choice) => choice.filename === "custom.gguf");
    expect(customWithNodes?.missingNodes).toEqual([]);
  });
  it("reports a workflow node the text model needs besides its loader", async () => {
    isPreviewAnyNodeInstalled = false;
    const snapshot = await service.inspect({ model: "text" });
    expect(snapshot.loadersAvailable).toBe(true);
    expect(snapshot.missingWorkflowNodes).toEqual([
      expect.objectContaining({ name: "PreviewAny", installKind: "core" })
    ]);
    const runtimeCheck = await service.check({
      model: "text",
      action: "runtime"
    });
    expect(runtimeCheck.status).toBe("error");
    expect(runtimeCheck.message).toContain("PreviewAny");
  });
  it("reports llama.cpp missing from ComfyUI's Python even though the Qwen node is installed", async () => {
    readLlamaCppPackageInstalled.mockResolvedValue(false);
    const snapshot = await service.inspect({ model: "text" });
    expect(snapshot.loadersAvailable).toBe(true);
    expect(snapshot.isLlamaCppPackageInstalled).toBe(false);
    expect(readLlamaCppPackageInstalled).toHaveBeenCalledWith("python");
    expect(
      (await service.inspect({ model: "qwen-image" }))
        .isLlamaCppPackageInstalled
    ).toBeNull();
    expect(
      (await service.check({ model: "text", action: "runtime" })).message
    ).toContain("llama-cpp-python is not installed");
  });
});
