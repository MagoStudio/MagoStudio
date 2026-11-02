import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const filesOnDisk = vi.hoisted(
  () => new Map<string, { isDirectory: boolean; size: number }>()
);
vi.mock("node:fs/promises", () => ({
  stat: async (absolutePath: string) => {
    const entry = filesOnDisk.get(absolutePath);
    if (!entry) throw Object.assign(new Error("missing"), { code: "ENOENT" });
    return {
      isFile: () => !entry.isDirectory,
      isDirectory: () => entry.isDirectory,
      size: entry.size
    };
  }
}));

import type { LocalModelGroupId } from "../../shared/localModelGroups";

import { inspectLocalModelGroups } from "./inspectLocalModelGroups";
import { listModelGroupItems } from "./listModelGroupItems";
import { resolveStarterEnginePaths } from "./resolveStarterEnginePaths";

const LOCAL_MODELS_ROOT = path.resolve("/models-root");

const putGroupOnDisk = (groupId: LocalModelGroupId) => {
  for (const item of listModelGroupItems({
    groupId,
    selectedModelGroupVariants: { "local-llm": "qwen38-27b-q3" },
    localModelsRoot: LOCAL_MODELS_ROOT
  }))
    filesOnDisk.set(item.absolutePath, {
      isDirectory: item.kind === "node-pack",
      size: item.kind === "model-file" ? item.bytes : 0
    });
};

const settingsWith = (
  installedModelGroups: Partial<Record<LocalModelGroupId, string[]>>
) => ({
  getLocalModelsRoot: async () => LOCAL_MODELS_ROOT,
  getSelectedModelGroupVariants: async () => ({
    "local-llm": "qwen38-27b-q3"
  }),
  getInstalledModelGroups: async () => installedModelGroups,
  recordInstalledModelGroup: vi.fn(async () => {})
});

describe("inspectLocalModelGroups", () => {
  afterEach(() => vi.unstubAllGlobals());
  beforeEach(() => {
    filesOnDisk.clear();
    filesOnDisk.set(resolveStarterEnginePaths(LOCAL_MODELS_ROOT).engineMarker, {
      isDirectory: false,
      size: 1
    });
  });

  it("records a complete install made before group records existed", async () => {
    putGroupOnDisk("minimal");
    const settings = settingsWith({});

    const { isGetStartedInstall, groups } =
      await inspectLocalModelGroups(settings);

    expect(isGetStartedInstall).toBe(true);
    expect(groups.find((group) => group.groupId === "minimal")?.state).toBe(
      "installed"
    );
    expect(settings.recordInstalledModelGroup).toHaveBeenCalledTimes(1);
    expect(settings.recordInstalledModelGroup).toHaveBeenCalledWith(
      "minimal",
      expect.arrayContaining([expect.stringMatching(/^[a-f0-9]{64}$/)])
    );
  });

  it("checks only the Local LLM variant saved in Settings", async () => {
    putGroupOnDisk("local-llm");

    const { groups } = await inspectLocalModelGroups(settingsWith({}));

    expect(groups.find((group) => group.groupId === "local-llm")?.state).toBe(
      "installed"
    );
  });

  it("treats every group as not installed when there is no Get started engine", async () => {
    filesOnDisk.clear();
    putGroupOnDisk("minimal");

    const { isGetStartedInstall, groups } = await inspectLocalModelGroups(
      settingsWith({})
    );

    expect(isGetStartedInstall).toBe(false);
    expect(groups.map((group) => group.state)).toEqual([
      "not-installed",
      "not-installed",
      "not-installed",
      "not-installed"
    ]);
  });

  const serveRunningComfy = (missingFilename?: string) => {
    const items = listModelGroupItems({
      groupId: "minimal",
      selectedModelGroupVariants: {},
      localModelsRoot: LOCAL_MODELS_ROOT
    });
    const filenames = items
      .filter(
        (item) => item.kind === "model-file" && item.name !== missingFilename
      )
      .map((item) => `shared\\${item.name}`);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.endsWith("/models/clip_gguf")) return Response.json([]);
        const node = decodeURIComponent(url.split("/").at(-1)!);
        return Response.json({
          [node]: {
            input: {
              required: Object.fromEntries(
                [
                  "clip_name",
                  "unet_name",
                  "vae_name",
                  "lora_name",
                  "pdd_file"
                ].map((input) => [input, ["COMBO", { options: filenames }]])
              )
            }
          }
        });
      })
    );
    return items;
  };

  it("uses the running server even when the managed folder has no models or records", async () => {
    serveRunningComfy();
    const settings = {
      ...settingsWith({}),
      getComfyEndpoint: async () => "http://127.0.0.1:8188"
    };
    const { groups } = await inspectLocalModelGroups(settings);
    expect(groups.find((group) => group.groupId === "minimal")).toMatchObject({
      state: "installed",
      missingItems: []
    });
    expect(settings.recordInstalledModelGroup).not.toHaveBeenCalled();
  });

  it("plans only files absent from the running server and keeps the selected destination", async () => {
    const missingFilename = "minimax_h3_audio_vae_fp32.safetensors";
    const items = serveRunningComfy(missingFilename);
    const { groups } = await inspectLocalModelGroups({
      ...settingsWith({ minimal: items.map((item) => item.sha256) }),
      getComfyEndpoint: async () => "http://custom-comfy:8188"
    });
    const group = groups.find((item) => item.groupId === "minimal")!;
    expect(group.state).toBe("partial");
    expect(group.missingItems).toEqual([
      items.find((item) => item.name === missingFilename)
    ]);
    expect(group.missingItems[0].absolutePath).toContain(LOCAL_MODELS_ROOT);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("http://custom-comfy:8188/"),
      expect.anything()
    );
  });

  it("does not let managed files override missing models on the active server", async () => {
    putGroupOnDisk("minimal");
    serveRunningComfy("minimax_h3_audio_vae_fp32.safetensors");
    const { groups } = await inspectLocalModelGroups({
      ...settingsWith({}),
      getComfyEndpoint: async () => "http://127.0.0.1:8188"
    });
    expect(groups.find((group) => group.groupId === "minimal")?.state).toBe(
      "partial"
    );
  });

  it("uses running availability without a managed engine marker", async () => {
    filesOnDisk.clear();
    serveRunningComfy();
    const { isGetStartedInstall, groups } = await inspectLocalModelGroups({
      ...settingsWith({}),
      getComfyEndpoint: async () => "http://127.0.0.1:8188"
    });
    expect(isGetStartedInstall).toBe(false);
    expect(groups.find((group) => group.groupId === "minimal")?.state).toBe(
      "installed"
    );
  });

  it("falls back to the selected install when ComfyUI is offline", async () => {
    putGroupOnDisk("minimal");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Offline")));
    const { groups } = await inspectLocalModelGroups({
      ...settingsWith({}),
      getComfyEndpoint: async () => "http://127.0.0.1:8188"
    });
    expect(groups.find((group) => group.groupId === "minimal")?.state).toBe(
      "installed"
    );
  });
});
