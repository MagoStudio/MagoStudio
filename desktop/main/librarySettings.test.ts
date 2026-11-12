import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const electronState = vi.hoisted(() => ({ userDataPath: "" }));
const detectPriorSetup = vi.hoisted(() => vi.fn());
vi.mock("./localSetup/detectPriorSetup", () => ({ detectPriorSetup }));

vi.mock("electron", () => ({
  app: {
    getPath: () => electronState.userDataPath
  }
}));

import {
  CorruptLibrarySettingsError,
  LibrarySettings
} from "./librarySettings";

describe("LibrarySettings", () => {
  it("applies overlapping saves one after another without losing any", async () => {
    const settings = new LibrarySettings();
    await Promise.all([
      settings.setComfyEndpoint("http://127.0.0.1:8188"),
      settings.setVlmBackend("qwen3-vl-4b-heretic-int8"),
      settings.setScriptTextModel("qwen38-27b-q3"),
      settings.setTextModelProvider("local"),
      settings.markLocalSetupCompleted(),
      settings.setInferredComfyInstall(
        "http://127.0.0.1:8188",
        path.join(electronState.userDataPath, "ComfyUI")
      ),
      settings.setComfyEndpoint("http://127.0.0.1:8189")
    ]);
    const stored = JSON.parse(
      await readFile(
        path.join(electronState.userDataPath, "settings.json"),
        "utf8"
      )
    );
    expect(stored).toMatchObject({
      comfyEndpoint: "http://127.0.0.1:8189",
      vlmBackend: "qwen3-vl-4b-heretic-int8",
      selectedModelGroupVariants: { "local-llm": "qwen38-27b-q3" },
      textModelProvider: "local",
      localSetupCompleted: true,
      inferredComfyInstall: { endpoint: "http://127.0.0.1:8188" }
    });
  });

  it("preserves NUL-filled settings until explicit recovery, then backs them up", async () => {
    const settingsPath = path.join(electronState.userDataPath, "settings.json");
    const damaged = Buffer.alloc(32);
    await writeFile(settingsPath, damaged);
    const settings = new LibrarySettings();
    await expect(settings.getLibraryRoot()).rejects.toBeInstanceOf(
      CorruptLibrarySettingsError
    );
    expect(await readFile(settingsPath)).toEqual(damaged);
    const chosenRoot = path.join(
      electronState.userDataPath,
      "existing-library"
    );
    const backupPath = await settings.recoverCorruptSettings(chosenRoot);
    expect(backupPath).toBeTruthy();
    expect(await readFile(backupPath!)).toEqual(damaged);
    expect(await new LibrarySettings().getLibraryRoot()).toBe(
      path.resolve(chosenRoot)
    );
    expect(
      (await readdir(electronState.userDataPath)).filter((name) =>
        name.endsWith(".tmp")
      )
    ).toEqual([]);
  });
  it.each(["null", "[]", '"text"'])(
    "reports invalid settings content %s as damaged",
    async (contents) => {
      await writeFile(
        path.join(electronState.userDataPath, "settings.json"),
        contents
      );
      await expect(
        new LibrarySettings().getLibraryRoot()
      ).rejects.toBeInstanceOf(CorruptLibrarySettingsError);
    }
  );
  it("keeps valid preferences if settings are repaired before recovery finishes", async () => {
    const settings = new LibrarySettings();
    await settings.setComfyEndpoint("http://localhost:1234");
    await expect(
      settings.recoverCorruptSettings(
        path.join(electronState.userDataPath, "library")
      )
    ).resolves.toBeNull();
    await expect(settings.getComfyEndpoint()).resolves.toBe(
      "http://localhost:1234"
    );
  });
  it.each([true, false])(
    "backfills a missing completion flag once with %s",
    async (detected) => {
      detectPriorSetup.mockResolvedValue(detected);
      const settings = new LibrarySettings();
      await settings.setComfyEndpoint("http://127.0.0.1:8188");
      await expect(
        Promise.all([
          settings.hasCompletedLocalSetup(),
          settings.hasCompletedLocalSetup()
        ])
      ).resolves.toEqual([detected, detected]);
      expect(detectPriorSetup).toHaveBeenCalledTimes(1);
      await expect(
        new LibrarySettings().hasCompletedLocalSetup()
      ).resolves.toBe(detected);
      expect(detectPriorSetup).toHaveBeenCalledTimes(1);
      await settings.markLocalSetupCompleted();
      await expect(settings.hasCompletedLocalSetup()).resolves.toBe(true);
    }
  );
  it("remembers a completed install across settings instances", async () => {
    const settings = new LibrarySettings();
    await expect(settings.hasCompletedLocalSetup()).resolves.toBe(false);
    await settings.markLocalSetupCompleted();
    await expect(new LibrarySettings().hasCompletedLocalSetup()).resolves.toBe(
      true
    );
    await settings.setComfyEndpoint("http://127.0.0.1:9000");
    await expect(new LibrarySettings().hasCompletedLocalSetup()).resolves.toBe(
      true
    );
  });
  beforeEach(async () => {
    detectPriorSetup.mockReset().mockResolvedValue(false);
    electronState.userDataPath = await mkdtemp(
      path.join(os.tmpdir(), "mago-library-settings-test-")
    );
  });

  afterEach(async () => {
    await rm(electronState.userDataPath, { recursive: true, force: true });
  });

  it("uses a MagoStudio folder inside Electron userData by default", async () => {
    await expect(new LibrarySettings().getLibraryRoot()).resolves.toBe(
      path.join(electronState.userDataPath, "MagoStudio")
    );
  });

  it("keeps an existing explicitly selected library", async () => {
    const settings = new LibrarySettings();
    const selectedRoot = path.join(electronState.userDataPath, "elsewhere");

    await settings.setLibraryRoot(selectedRoot);

    await expect(settings.getLibraryRoot()).resolves.toBe(
      path.resolve(selectedRoot)
    );
  });

  it("has no models root until the setup wizard picks one", async () => {
    const settings = new LibrarySettings();

    await expect(settings.getLocalModelsRoot()).resolves.toBeNull();

    const chosen = path.join(electronState.userDataPath, "engine");
    await settings.setLocalModelsRoot(chosen);

    await expect(settings.getLocalModelsRoot()).resolves.toBe(
      path.resolve(chosen)
    );
  });

  it("selects only the required bundles until the user says otherwise", async () => {
    await expect(
      new LibrarySettings().getSelectedModelBundleIds()
    ).resolves.toEqual([
      "qwen-vl",
      "minimax-h3",
      "minimax-h3-high-quality",
      "minimax-h3-vfx-loras"
    ]);
  });

  it("uses 4B captioning for new settings and legacy 2B selections", async () => {
    const settings = new LibrarySettings();
    await expect(settings.getVlmBackend()).resolves.toBe(
      "qwen3-vl-4b-heretic-int8"
    );
    await settings.setVlmBackend("qwen3-vl-2b-gguf");
    await expect(settings.getVlmBackend()).resolves.toBe(
      "qwen3-vl-4b-heretic-int8"
    );
  });

  it("persists a chosen bundle set and drops ids it does not know", async () => {
    const settings = new LibrarySettings();

    await settings.setSelectedModelBundleIds([
      "minimax-h3",
      "minimax-h3-high-quality",
      "invented-bundle"
    ]);

    await expect(settings.getSelectedModelBundleIds()).resolves.toEqual([
      "minimax-h3",
      "minimax-h3-high-quality"
    ]);
  });

  it("accepts no model licenses until the user accepts", async () => {
    await expect(
      new LibrarySettings().getAcceptedModelLicenseRepos()
    ).resolves.toEqual([]);
  });

  it("remembers accepted model licenses across settings instances", async () => {
    await new LibrarySettings().acceptModelLicenses(["Comfy-Org/MiniMax-H3"]);

    await expect(
      new LibrarySettings().getAcceptedModelLicenseRepos()
    ).resolves.toEqual(["Comfy-Org/MiniMax-H3"]);
  });

  it("adds to earlier acceptances without duplicating them, and drops repos it does not know", async () => {
    const settings = new LibrarySettings();
    await settings.acceptModelLicenses(["Comfy-Org/MiniMax-H3"]);

    await settings.acceptModelLicenses([
      "Comfy-Org/MiniMax-H3",
      "alibaba-pai/MiniMax-H3-Acc-LoRAs",
      "invented/repo"
    ]);

    await expect(settings.getAcceptedModelLicenseRepos()).resolves.toEqual([
      "Comfy-Org/MiniMax-H3",
      "alibaba-pai/MiniMax-H3-Acc-LoRAs"
    ]);
  });

  it("records installed model groups without losing a group recorded at the same time", async () => {
    const settings = new LibrarySettings();

    await Promise.all([
      settings.recordInstalledModelGroup("minimal", ["a", "b", "a"]),
      settings.recordInstalledModelGroup("qwen-image", ["c"])
    ]);

    await expect(
      new LibrarySettings().getInstalledModelGroups()
    ).resolves.toEqual({ minimal: ["a", "b"], "qwen-image": ["c"] });
  });

  it("ignores unknown or malformed installed model group records", async () => {
    await writeFile(
      path.join(electronState.userDataPath, "settings.json"),
      JSON.stringify({
        installedModelGroups: {
          minimal: ["a"],
          "invented-group": ["b"],
          "flux-image": "not-a-list"
        }
      })
    );

    await expect(
      new LibrarySettings().getInstalledModelGroups()
    ).resolves.toEqual({ minimal: ["a"] });
  });

  it("keeps the models root when another setting is written", async () => {
    const settings = new LibrarySettings();
    const chosen = path.join(electronState.userDataPath, "engine");

    await settings.setLocalModelsRoot(chosen);
    await settings.setComfyEndpoint("http://127.0.0.1:9000");

    await expect(settings.getLocalModelsRoot()).resolves.toBe(
      path.resolve(chosen)
    );
  });

  it("defaults the script-shot text model to Q5 and persists Q3", async () => {
    const settings = new LibrarySettings();

    await expect(settings.getScriptTextModel()).resolves.toBe("qwen38-27b-q5");

    await settings.setScriptTextModel("qwen38-27b-q3");

    await expect(settings.getScriptTextModel()).resolves.toBe("qwen38-27b-q3");
    await expect(settings.getSelectedModelGroupVariants()).resolves.toEqual({
      "local-llm": "qwen38-27b-q3"
    });
  });

  it("keeps the automatic setup recommendation separate from endpoint-specific user variants", async () => {
    const settings = new LibrarySettings();
    await settings.setScriptTextModel("qwen38-27b-q3");
    await writeFile(
      path.join(electronState.userDataPath, "model-settings.json"),
      JSON.stringify({
        endpoints: {
          "http://127.0.0.1:8188": {
            settings: {
              models: { text: { variant: "qwen38-27b-q5" } },
              memoryPolicy: "auto"
            }
          }
        }
      })
    );
    await expect(settings.getScriptTextModel()).resolves.toBe("qwen38-27b-q5");
    await expect(settings.getSetupScriptTextModel()).resolves.toBe(
      "qwen38-27b-q3"
    );
    await settings.setComfyEndpoint("http://other:8188");
    await expect(settings.getScriptTextModel()).resolves.toBe("qwen38-27b-q3");
  });

  it("reads a script text model saved before per-group variants, and moves it on the next variant write", async () => {
    const settingsPath = path.join(electronState.userDataPath, "settings.json");
    await writeFile(
      settingsPath,
      JSON.stringify({ scriptTextModel: "qwen38-27b-q3" })
    );
    const settings = new LibrarySettings();

    await expect(settings.getScriptTextModel()).resolves.toBe("qwen38-27b-q3");
    await expect(settings.getSelectedModelGroupVariants()).resolves.toEqual({
      "local-llm": "qwen38-27b-q3"
    });

    await settings.setSelectedModelGroupVariant("local-llm", "qwen38-27b-q5");

    const stored = JSON.parse(await readFile(settingsPath, "utf8"));
    expect(stored.scriptTextModel).toBeUndefined();
    expect(stored.selectedModelGroupVariants).toEqual({
      "local-llm": "qwen38-27b-q5"
    });
  });

  it("ignores variants a group does not declare, and groups without variants", async () => {
    await writeFile(
      path.join(electronState.userDataPath, "settings.json"),
      JSON.stringify({
        selectedModelGroupVariants: {
          "local-llm": "qwen38-27b-q9",
          "qwen-image": "anything",
          "invented-group": "q4"
        }
      })
    );
    const settings = new LibrarySettings();

    await expect(settings.getSelectedModelGroupVariants()).resolves.toEqual({});
    await expect(settings.getScriptTextModel()).resolves.toBe("qwen38-27b-q5");
  });
});
