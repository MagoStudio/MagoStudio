import { happyHorse1Model } from "@models/video/happyHorse1Model";
import { act, renderHook } from "@testing-library/react";
import { useAtomValue, useSetAtom } from "jotai";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

vi.mock("@platform/identity", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@platform/identity")>()),
  useUser: () => ({ user: { id: "local-user" } })
}));
vi.mock("@domains/project/useSelectedProjectId", () => ({
  useSelectedProjectId: () => "local-project"
}));
vi.mock("@domains/shot/useSelectedShotId", () => ({
  useSelectedShotId: () => ({ selectedShotId: "local-shot" })
}));
vi.mock("@hooks/tool/useTool", () => ({
  useTool: () => ({ tool: "render-video" })
}));

// The store is imported inside the test, after `window.mago` is set, so it
// evaluates the whole model registry cold. Under the full suite's parallel load
// that alone can outlast the default timeout.
const COLD_STORE_IMPORT_TIMEOUT_MS = 60_000;

describe("renderSettingsStore local model migration", () => {
  beforeAll(() => {
    Object.defineProperty(window, "mago", {
      value: { account: { mode: "offline" } },
      configurable: true,
      writable: true
    });
  });

  afterAll(() => {
    Object.defineProperty(window, "mago", {
      value: undefined,
      configurable: true,
      writable: true
    });
  });

  test(
    "migrates an old model to the local default and keeps the first uploaded reference image",
    async () => {
      const storageKey =
        "render-settings-local-user-local-project-local-shot-render";
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          selectedModelName: "v3.4.0",
          values: { mago_engine: "v3.4.0", prompt: "old prompt" },
          sources: []
        })
      );

      const { useRenderSettingsAtoms } = await import("./renderSettingsStore");
      const { result } = renderHook(() => {
        const atoms = useRenderSettingsAtoms();
        return {
          values: useAtomValue(atoms.renderSettingsValuesAtom),
          selectedModel: useAtomValue(atoms.selectedModelAtom),
          setSelectedModel: useSetAtom(atoms.selectedModelAtom),
          updateValue: useSetAtom(atoms.updateValueAtom)
        };
      });

      act(() => {
        result.current.updateValue({
          key: "image_ids",
          value: ["uploaded-image-id"]
        });
      });

      expect(result.current.values.image_ids).toEqual(["uploaded-image-id"]);
      expect(result.current.values.mago_engine).toBe("minimax_h3_local");
      expect(JSON.parse(localStorage.getItem(storageKey) ?? "{}")).toEqual(
        expect.objectContaining({ selectedModelName: "minimax_h3_local" })
      );

      act(() => {
        result.current.setSelectedModel(happyHorse1Model);
      });

      expect(result.current.selectedModel.name).toBe("minimax_h3_local");
      expect(result.current.values.mago_engine).toBe("minimax_h3_local");
      expect(JSON.parse(localStorage.getItem(storageKey) ?? "{}")).toEqual(
        expect.objectContaining({ selectedModelName: "minimax_h3_local" })
      );
    },
    COLD_STORE_IMPORT_TIMEOUT_MS
  );

  test(
    "keeps the saved local model despite the retired provider switch",
    async () => {
      vi.resetModules();
      window.mago.account.mode = "cloud";
      localStorage.clear();
      localStorage.setItem(
        "mago.providerPreferences",
        JSON.stringify({
          "local-comfy": false,
          "mago-cloud": true
        })
      );
      localStorage.setItem(
        "render-settings-local-user-local-project-local-shot-render",
        JSON.stringify({
          selectedModelName: "minimax_h3_local",
          values: { mago_engine: "minimax_h3_local" },
          sources: []
        })
      );

      const { useRenderSettingsAtoms } = await import("./renderSettingsStore");
      const { result } = renderHook(() =>
        useAtomValue(useRenderSettingsAtoms().selectedModelAtom)
      );

      expect(result.current.name).toBe("minimax_h3_local");
    },
    COLD_STORE_IMPORT_TIMEOUT_MS
  );
});
