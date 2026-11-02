import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { replaceMultipleCharactersPreset } from "@models/preset/presets/replaceMultipleCharacters";
import { RENDER_MODELS } from "@models/video/constants";
import { extractDefaultVideoSettings } from "@models/video/extractDefaultVideoSettings";
import {
  VideoEngine,
  VideoModelDefinition,
  VideoSettings
} from "@models/video/types";
import { getAlwaysVisibleSettingKeys } from "@store/utils/isAlwaysVisibleSetting";
import { renderHook, act } from "@testing-library/react";
import { baseUser } from "@tests/factories/user";
import { Provider, createStore, useAtomValue, useSetAtom } from "jotai";
import { createElement, type ReactNode } from "react";
import { describe, test, expect, beforeEach, vi } from "vitest";

import { getCropStorageAtom } from "./cropStore";
import { useRenderSettingsAtoms } from "./renderSettingsStore";

vi.mock("@platform/identity", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@platform/identity")>()),
  useUser: () => ({
    user: baseUser
  })
}));

vi.mock("@domains/project/useSelectedProjectId");
vi.mock("@domains/shot/useSelectedShotId", () => ({
  useSelectedShotId: () => ({
    selectedShotId: "test-shot-id",
    setSelectedShotId: vi.fn()
  })
}));

const TEST_PROJECT_ID = "test-project-id";
const TEST_USER_ID = baseUser.id!;

const TEST_SHOT_ID = "test-shot-id";
const getStorageKey = (
  userId: string,
  projectId: string,
  mode: "render" | "upscale" = "render"
) => {
  return `render-settings-${userId}-${projectId}-${TEST_SHOT_ID}-${mode}`;
};

const getStoredSettings = (
  userId: string,
  projectId: string,
  mode: "render" | "upscale" = "render"
) => {
  const key = getStorageKey(userId, projectId, mode);
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : null;
};

describe("renderSettingsStore - Preset Feature", () => {
  beforeEach(() => {
    localStorage.clear();

    vi.mocked(useSelectedProjectId).mockReturnValue(TEST_PROJECT_ID);
  });

  describe("Preset Selection", () => {
    test("Selecting preset applies settings and changes model", () => {
      const { result } = renderHook(() => {
        const atoms = useRenderSettingsAtoms();
        return {
          applyPreset: useSetAtom(atoms.applyPresetAtom),
          selectedModel: useAtomValue(atoms.selectedModelAtom),
          values: useAtomValue(atoms.renderSettingsValuesAtom),
          selectedPreset: useAtomValue(atoms.selectedPresetAtom)
        };
      });

      act(() => {
        result.current.applyPreset({
          presetId: replaceMultipleCharactersPreset.id,
          modelName: replaceMultipleCharactersPreset.model as VideoEngine,
          settingsOverrides: replaceMultipleCharactersPreset.settingsOverrides
        });
      });

      expect(result.current.selectedModel.name).toBe(VideoEngine.V3_4_0);

      expect(result.current.values.control_type).toBe("pose");

      expect(result.current.selectedPreset?.presetId).toBe(
        replaceMultipleCharactersPreset.id
      );
      expect(result.current.selectedPreset?.isPristine).toBe(true);
    });

    test("Selecting preset preserves basic settings", () => {
      const { result } = renderHook(() => {
        const atoms = useRenderSettingsAtoms();
        return {
          updateValue: useSetAtom(atoms.updateValueAtom),
          applyPreset: useSetAtom(atoms.applyPresetAtom),
          values: useAtomValue(atoms.renderSettingsValuesAtom)
        };
      });

      act(() => {
        result.current.updateValue({ key: "prompt", value: "test prompt" });
        result.current.updateValue({
          key: "negative_prompt",
          value: "test negative"
        });
      });

      expect(result.current.values.prompt).toBe("test prompt");
      expect(result.current.values.negative_prompt).toBe("test negative");

      act(() => {
        result.current.applyPreset({
          presetId: replaceMultipleCharactersPreset.id,
          modelName: replaceMultipleCharactersPreset.model as VideoEngine,
          settingsOverrides: replaceMultipleCharactersPreset.settingsOverrides
        });
      });

      expect(result.current.values.prompt).toBe("test prompt");
      expect(result.current.values.negative_prompt).toBe("test negative");

      expect(result.current.values.control_type).toBe("pose");
    });

    test("Selecting preset marks isPristine = true", () => {
      const { result } = renderHook(() => {
        const atoms = useRenderSettingsAtoms();
        return {
          applyPreset: useSetAtom(atoms.applyPresetAtom),
          selectedPreset: useAtomValue(atoms.selectedPresetAtom)
        };
      });

      act(() => {
        result.current.applyPreset({
          presetId: replaceMultipleCharactersPreset.id,
          modelName: replaceMultipleCharactersPreset.model as VideoEngine,
          settingsOverrides: replaceMultipleCharactersPreset.settingsOverrides
        });
      });

      expect(result.current.selectedPreset?.isPristine).toBe(true);
    });
  });

  describe("Prompt seeding on model switch", () => {
    const renderModelSwitchHook = () =>
      renderHook(() => {
        const atoms = useRenderSettingsAtoms();
        return {
          selectedModel: useAtomValue(atoms.selectedModelAtom),
          setSelectedModel: useSetAtom(atoms.selectedModelAtom),
          updateValue: useSetAtom(atoms.updateValueAtom),
          values: useAtomValue(atoms.renderSettingsValuesAtom)
        };
      });

    const klingO1 = () =>
      RENDER_MODELS.find((model) => model.name === VideoEngine.kling_o1)!;

    const klingO1DefaultPrompt = () =>
      extractDefaultVideoSettings(klingO1()).prompt;

    test("An empty prompt adopts the new model's default prompt", () => {
      const { result } = renderModelSwitchHook();

      act(() => {
        result.current.updateValue({ key: "prompt", value: "" });
      });

      act(() => {
        result.current.setSelectedModel(klingO1());
      });

      expect(result.current.values.prompt).toBe(klingO1DefaultPrompt());
    });

    test("A whitespace-only prompt adopts the new model's default prompt", () => {
      const { result } = renderModelSwitchHook();

      act(() => {
        result.current.updateValue({ key: "prompt", value: "   " });
      });

      act(() => {
        result.current.setSelectedModel(klingO1());
      });

      expect(result.current.values.prompt).toBe(klingO1DefaultPrompt());
    });

    test("A non-empty prompt is still preserved across a model switch", () => {
      const { result } = renderModelSwitchHook();

      act(() => {
        result.current.updateValue({
          key: "prompt",
          value: "a cat riding a bike"
        });
      });

      act(() => {
        result.current.setSelectedModel(klingO1());
      });

      expect(result.current.values.prompt).toBe("a cat riding a bike");
    });

    test("An empty negative prompt adopts the new model's default", () => {
      const { result } = renderModelSwitchHook();

      act(() => {
        result.current.updateValue({ key: "negative_prompt", value: "" });
      });

      act(() => {
        result.current.setSelectedModel(klingO1());
      });

      expect(result.current.values.negative_prompt).toBe(
        extractDefaultVideoSettings(klingO1()).negative_prompt
      );
    });
  });

  describe("overwritesPromptOnSelect capability", () => {
    const renderModelSwitchHook = () =>
      renderHook(() => {
        const atoms = useRenderSettingsAtoms();
        return {
          setSelectedModel: useSetAtom(atoms.selectedModelAtom),
          updateValue: useSetAtom(atoms.updateValueAtom),
          values: useAtomValue(atoms.renderSettingsValuesAtom)
        };
      });

    const buildModel = (
      overwritesPromptOnSelect: boolean | undefined,
      defaultPrompt: string
    ): VideoModelDefinition =>
      ({
        name: "fake_model_for_prompt_reset_test" as VideoEngine,
        displayName: "Fake model",
        description: "Fake model for prompt reset test",
        type: "render",
        status: "active",
        capabilities: { overwritesPromptOnSelect },
        calcEstimatedRenderTime: () => ({ impactToShow: 0 }),
        renderDurationLimits: {
          defaultFrameRange: { defaultRender: 1, testRender: 1 },
          modelLimits: { minFrames: 1, maxFrames: 1 }
        },
        settingsGroups: [
          {
            name: "Basic",
            level: "main",
            sections: [
              {
                name: undefined,
                settings: [
                  {
                    key: "prompt",
                    type: "string",
                    label: "Prompt",
                    ui: "Prompt",
                    defaultValue: defaultPrompt,
                    nullable: false
                  },
                  {
                    key: "negative_prompt",
                    type: "string",
                    label: "Negative prompt",
                    ui: "Prompt",
                    defaultValue: "",
                    nullable: true
                  }
                ]
              }
            ]
          }
        ]
      }) as unknown as VideoModelDefinition;

    test("Selecting a declaring model replaces a non-empty prompt", () => {
      const { result } = renderModelSwitchHook();

      act(() => {
        result.current.updateValue({
          key: "prompt",
          value: "a cat riding a bike"
        });
      });

      act(() => {
        result.current.setSelectedModel(
          buildModel(true, "the declaring model's default prompt")
        );
      });

      expect(result.current.values.prompt).toBe(
        "the declaring model's default prompt"
      );
    });

    test("Selecting a non-declaring model still preserves the prompt", () => {
      const { result } = renderModelSwitchHook();

      act(() => {
        result.current.updateValue({
          key: "prompt",
          value: "a cat riding a bike"
        });
      });

      act(() => {
        result.current.setSelectedModel(
          buildModel(false, "the non-declaring model's default prompt")
        );
      });

      expect(result.current.values.prompt).toBe("a cat riding a bike");
    });

    test("An empty prompt adopts the new model's default either way", () => {
      const { result } = renderModelSwitchHook();

      act(() => {
        result.current.updateValue({ key: "prompt", value: "" });
      });

      act(() => {
        result.current.setSelectedModel(
          buildModel(true, "the declaring model's default prompt")
        );
      });

      expect(result.current.values.prompt).toBe(
        "the declaring model's default prompt"
      );
    });

    test("Negative prompt preservation is unaffected by a declaring model", () => {
      const { result } = renderModelSwitchHook();

      act(() => {
        result.current.updateValue({
          key: "negative_prompt",
          value: "blurry"
        });
      });

      act(() => {
        result.current.setSelectedModel(
          buildModel(true, "the declaring model's default prompt")
        );
      });

      expect(result.current.values.negative_prompt).toBe("blurry");
    });
  });

  describe("Always-visible Settings Preservation", () => {
    test("Always-visible settings identified correctly", () => {
      const model = RENDER_MODELS.find((m) => m.name === "v3.3.0.cnets");
      expect(model).toBeDefined();

      const basicKeys = getAlwaysVisibleSettingKeys(model!);

      expect(basicKeys.has("prompt")).toBe(true);
      expect(basicKeys.has("negative_prompt")).toBe(true);

      expect(basicKeys.has("control_type")).toBe(false);
      expect(basicKeys.has("enable_facemesh_blending")).toBe(false);
    });

    test("Always-visible settings preserved during preset application", () => {
      const { result } = renderHook(() => {
        const atoms = useRenderSettingsAtoms();
        return {
          selectedModel: useAtomValue(atoms.selectedModelAtom),
          setSelectedModel: useSetAtom(atoms.selectedModelAtom),
          updateValue: useSetAtom(atoms.updateValueAtom),
          applyPreset: useSetAtom(atoms.applyPresetAtom),
          values: useAtomValue(atoms.renderSettingsValuesAtom)
        };
      });

      act(() => {
        result.current.setSelectedModel(
          RENDER_MODELS.find((model) => model.name === VideoEngine.V5_0_0)!
        );
      });

      expect(result.current.selectedModel.name).toBe(VideoEngine.V5_0_0);

      const styleTransferAlwaysVisibleKeys: Array<keyof VideoSettings> = [
        "source_image_slot",
        "prompt",
        "negative_prompt",
        "max_size"
      ];

      act(() => {
        styleTransferAlwaysVisibleKeys.forEach((key) => {
          result.current.updateValue({ key, value: `custom-${key}` });
        });
      });

      const basicSettingsBeforePreset: Partial<VideoSettings> = {};
      styleTransferAlwaysVisibleKeys.forEach((key) => {
        basicSettingsBeforePreset[key] = result.current.values[key];
      });

      act(() => {
        result.current.applyPreset({
          presetId: replaceMultipleCharactersPreset.id,
          modelName: replaceMultipleCharactersPreset.model as VideoEngine,
          settingsOverrides: replaceMultipleCharactersPreset.settingsOverrides
        });
      });

      styleTransferAlwaysVisibleKeys.forEach((key) => {
        expect(result.current.values[key]).toBe(basicSettingsBeforePreset[key]);
      });

      expect(result.current.values.control_type).toBe("pose");
    });

    test("An advanced-level setting overridden by the preset actually lands in the applied values", () => {
      const { result } = renderHook(() => {
        const atoms = useRenderSettingsAtoms();
        return {
          applyPreset: useSetAtom(atoms.applyPresetAtom),
          values: useAtomValue(atoms.renderSettingsValuesAtom)
        };
      });

      const advancedLevelCfgOverride = 3;
      expect(result.current.values.cfg).not.toBe(advancedLevelCfgOverride);

      act(() => {
        result.current.applyPreset({
          presetId: "test-advanced-key-lands",
          modelName: VideoEngine.V3_4_0,
          settingsOverrides: {
            ...replaceMultipleCharactersPreset.settingsOverrides,
            cfg: advancedLevelCfgOverride
          }
        });
      });

      expect(result.current.values.cfg).toBe(advancedLevelCfgOverride);
    });

    test("Non-basic settings overwritten by preset", () => {
      const { result } = renderHook(() => {
        const atoms = useRenderSettingsAtoms();
        return {
          updateValue: useSetAtom(atoms.updateValueAtom),
          applyPreset: useSetAtom(atoms.applyPresetAtom),
          values: useAtomValue(atoms.renderSettingsValuesAtom)
        };
      });

      act(() => {
        result.current.updateValue({ key: "control_type", value: "depth" });
      });

      expect(result.current.values.control_type).toBe("depth");

      act(() => {
        result.current.applyPreset({
          presetId: replaceMultipleCharactersPreset.id,
          modelName: replaceMultipleCharactersPreset.model as VideoEngine,
          settingsOverrides: replaceMultipleCharactersPreset.settingsOverrides
        });
      });

      expect(result.current.values.control_type).toBe("pose");
    });
  });

  describe("Preset Clearing", () => {
    test("Changing control_type keeps the preset", () => {
      const { result } = renderHook(() => {
        const atoms = useRenderSettingsAtoms();
        return {
          applyPreset: useSetAtom(atoms.applyPresetAtom),
          updateValue: useSetAtom(atoms.updateValueAtom),
          selectedPreset: useAtomValue(atoms.selectedPresetAtom)
        };
      });

      act(() => {
        result.current.applyPreset({
          presetId: replaceMultipleCharactersPreset.id,
          modelName: replaceMultipleCharactersPreset.model as VideoEngine,
          settingsOverrides: replaceMultipleCharactersPreset.settingsOverrides
        });
      });

      expect(result.current.selectedPreset?.presetId).toBe(
        replaceMultipleCharactersPreset.id
      );

      act(() => {
        result.current.updateValue({ key: "control_type", value: "depth" });
      });

      expect(result.current.selectedPreset?.presetId).toBe(
        replaceMultipleCharactersPreset.id
      );
    });

    test("Changing an advanced-level setting (cfg) clears preset", () => {
      const { result } = renderHook(() => {
        const atoms = useRenderSettingsAtoms();
        return {
          applyPreset: useSetAtom(atoms.applyPresetAtom),
          updateValue: useSetAtom(atoms.updateValueAtom),
          selectedPreset: useAtomValue(atoms.selectedPresetAtom)
        };
      });

      act(() => {
        result.current.applyPreset({
          presetId: replaceMultipleCharactersPreset.id,
          modelName: replaceMultipleCharactersPreset.model as VideoEngine,
          settingsOverrides: replaceMultipleCharactersPreset.settingsOverrides
        });
      });

      expect(result.current.selectedPreset?.presetId).toBe(
        replaceMultipleCharactersPreset.id
      );

      act(() => {
        result.current.updateValue({ key: "cfg", value: 3 });
      });

      expect(result.current.selectedPreset).toBeUndefined();
    });

    test("Changing basic setting keeps preset", () => {
      const { result } = renderHook(() => {
        const atoms = useRenderSettingsAtoms();
        return {
          applyPreset: useSetAtom(atoms.applyPresetAtom),
          updateValue: useSetAtom(atoms.updateValueAtom),
          selectedPreset: useAtomValue(atoms.selectedPresetAtom)
        };
      });

      act(() => {
        result.current.applyPreset({
          presetId: replaceMultipleCharactersPreset.id,
          modelName: replaceMultipleCharactersPreset.model as VideoEngine,
          settingsOverrides: replaceMultipleCharactersPreset.settingsOverrides
        });
      });

      expect(result.current.selectedPreset?.presetId).toBe(
        replaceMultipleCharactersPreset.id
      );

      act(() => {
        result.current.updateValue({ key: "prompt", value: "modified prompt" });
      });

      expect(result.current.selectedPreset?.presetId).toBe(
        replaceMultipleCharactersPreset.id
      );
      expect(result.current.selectedPreset?.isPristine).toBe(true);
    });

    test("Model switching clears preset", () => {
      const { result } = renderHook(() => {
        const atoms = useRenderSettingsAtoms();
        return {
          applyPreset: useSetAtom(atoms.applyPresetAtom),
          setModel: useSetAtom(atoms.selectedModelAtom),
          selectedPreset: useAtomValue(atoms.selectedPresetAtom)
        };
      });

      act(() => {
        result.current.applyPreset({
          presetId: replaceMultipleCharactersPreset.id,
          modelName: replaceMultipleCharactersPreset.model as VideoEngine,
          settingsOverrides: replaceMultipleCharactersPreset.settingsOverrides
        });
      });

      expect(result.current.selectedPreset?.presetId).toBe(
        replaceMultipleCharactersPreset.id
      );

      const differentModel = RENDER_MODELS.find((m) => m.name === "v2.5.0");
      expect(differentModel).toBeDefined();

      act(() => {
        result.current.setModel(differentModel!);
      });

      expect(result.current.selectedPreset).toBeUndefined();
    });
  });

  describe("Creative upscaler main-level promotion", () => {
    test("changing Steps preserves the selected preset (Steps is now a main setting)", () => {
      const { result } = renderHook(() => {
        const atoms = useRenderSettingsAtoms();
        return {
          applyPreset: useSetAtom(atoms.applyPresetAtom),
          updateValue: useSetAtom(atoms.updateValueAtom),
          selectedPreset: useAtomValue(atoms.selectedPresetAtom)
        };
      });

      act(() => {
        result.current.applyPreset({
          presetId: "creative-upscaler-preset",
          modelName: VideoEngine.v1_0_0_upscaler,
          settingsOverrides: {}
        });
      });

      expect(result.current.selectedPreset?.presetId).toBe(
        "creative-upscaler-preset"
      );

      act(() => {
        result.current.updateValue({ key: "steps", value: 8 });
      });

      expect(result.current.selectedPreset?.presetId).toBe(
        "creative-upscaler-preset"
      );
    });

    test("changing Detail enhancement (denoise) preserves the selected preset", () => {
      const { result } = renderHook(() => {
        const atoms = useRenderSettingsAtoms();
        return {
          applyPreset: useSetAtom(atoms.applyPresetAtom),
          updateValue: useSetAtom(atoms.updateValueAtom),
          selectedPreset: useAtomValue(atoms.selectedPresetAtom)
        };
      });

      act(() => {
        result.current.applyPreset({
          presetId: "creative-upscaler-preset",
          modelName: VideoEngine.v1_0_0_upscaler,
          settingsOverrides: {}
        });
      });

      act(() => {
        result.current.updateValue({ key: "denoise", value: 0.6 });
      });

      expect(result.current.selectedPreset?.presetId).toBe(
        "creative-upscaler-preset"
      );
    });

    test("changing an advanced-only setting (tile_width_count) still clears the preset", () => {
      const { result } = renderHook(() => {
        const atoms = useRenderSettingsAtoms();
        return {
          applyPreset: useSetAtom(atoms.applyPresetAtom),
          updateValue: useSetAtom(atoms.updateValueAtom),
          selectedPreset: useAtomValue(atoms.selectedPresetAtom)
        };
      });

      act(() => {
        result.current.applyPreset({
          presetId: "creative-upscaler-preset",
          modelName: VideoEngine.v1_0_0_upscaler,
          settingsOverrides: {}
        });
      });

      act(() => {
        result.current.updateValue({ key: "tile_width_count", value: 3 });
      });

      expect(result.current.selectedPreset).toBeUndefined();
    });
  });

  describe("Controlnet defaults on control_type change", () => {
    test("changing control_type triggers controlnet default application (mechanics covered by applyControlnetDefaults.test.ts)", () => {
      const { result } = renderHook(() => {
        const atoms = useRenderSettingsAtoms();
        return {
          setModel: useSetAtom(atoms.selectedModelAtom),
          updateValue: useSetAtom(atoms.updateValueAtom),
          values: useAtomValue(atoms.renderSettingsValuesAtom)
        };
      });

      act(() => {
        result.current.setModel(
          RENDER_MODELS.find((m) => m.name === VideoEngine.V3_4_0)!
        );
      });

      act(() => {
        result.current.updateValue({ key: "control_type", value: "depth" });
      });

      expect(result.current.values.cn_depth_resolution).toBe(1280);
    });

    test("setting skip_cnet_preprocess true forces control_type to depth and applies its defaults", () => {
      const { result } = renderHook(() => {
        const atoms = useRenderSettingsAtoms();
        return {
          setModel: useSetAtom(atoms.selectedModelAtom),
          updateValue: useSetAtom(atoms.updateValueAtom),
          values: useAtomValue(atoms.renderSettingsValuesAtom)
        };
      });

      act(() => {
        result.current.setModel(
          RENDER_MODELS.find((m) => m.name === VideoEngine.V3_4_0)!
        );
      });

      act(() => {
        result.current.updateValue({
          key: "skip_cnet_preprocess",
          value: true
        });
      });

      expect(result.current.values.control_type).toBe("depth");
      expect(result.current.values.cn_depth_resolution).toBe(1280);
    });
  });

  describe("localStorage Persistence", () => {
    test("Preset state persists in localStorage", () => {
      const { result } = renderHook(() => {
        const atoms = useRenderSettingsAtoms();
        return {
          applyPreset: useSetAtom(atoms.applyPresetAtom)
        };
      });

      act(() => {
        result.current.applyPreset({
          presetId: replaceMultipleCharactersPreset.id,
          modelName: replaceMultipleCharactersPreset.model as VideoEngine,
          settingsOverrides: replaceMultipleCharactersPreset.settingsOverrides
        });
      });

      const stored = getStoredSettings(TEST_USER_ID, TEST_PROJECT_ID);
      expect(stored).toBeDefined();
      expect(stored.selectedPreset.presetId).toBe(
        replaceMultipleCharactersPreset.id
      );
      expect(stored.selectedPreset.isPristine).toBe(true);
    });

    test("Preset restored on store recreation", () => {
      const { result: result1 } = renderHook(() => {
        const atoms = useRenderSettingsAtoms();
        return {
          applyPreset: useSetAtom(atoms.applyPresetAtom),
          values: useAtomValue(atoms.renderSettingsValuesAtom),
          selectedPreset: useAtomValue(atoms.selectedPresetAtom)
        };
      });

      act(() => {
        result1.current.applyPreset({
          presetId: replaceMultipleCharactersPreset.id,
          modelName: replaceMultipleCharactersPreset.model as VideoEngine,
          settingsOverrides: replaceMultipleCharactersPreset.settingsOverrides
        });
      });

      const controlTypeBeforeReload = result1.current.values.control_type;
      const presetIdBeforeReload = result1.current.selectedPreset?.presetId;

      const { result: result2 } = renderHook(() => {
        const atoms = useRenderSettingsAtoms();
        return {
          values: useAtomValue(atoms.renderSettingsValuesAtom),
          selectedPreset: useAtomValue(atoms.selectedPresetAtom)
        };
      });

      expect(result2.current.selectedPreset?.presetId).toBe(
        presetIdBeforeReload
      );
      expect(result2.current.selectedPreset?.isPristine).toBe(true);

      expect(result2.current.values.control_type).toBe(controlTypeBeforeReload);
    });

    test("The local default model loads on first load, with no preset", () => {
      localStorage.clear();

      const freshlyLoadedAppStore = createStore();
      const renderInFreshlyLoadedApp = ({
        children
      }: {
        children: ReactNode;
      }) => createElement(Provider, { store: freshlyLoadedAppStore }, children);

      const { result } = renderHook(
        () => {
          const atoms = useRenderSettingsAtoms();
          return {
            selectedPreset: useAtomValue(atoms.selectedPresetAtom),
            selectedModel: useAtomValue(atoms.selectedModelAtom),
            values: useAtomValue(atoms.renderSettingsValuesAtom)
          };
        },
        { wrapper: renderInFreshlyLoadedApp }
      );

      expect(result.current.selectedPreset).toBeUndefined();
      expect(result.current.selectedModel.name).toBe(
        VideoEngine.minimax_h3_local
      );
    });
  });

  describe("Reset to Defaults", () => {
    test("Reset clears preset selection", () => {
      const { result } = renderHook(() => {
        const atoms = useRenderSettingsAtoms();
        return {
          applyPreset: useSetAtom(atoms.applyPresetAtom),
          resetToDefaults: useSetAtom(atoms.resetToDefaultsAtom),
          selectedPreset: useAtomValue(atoms.selectedPresetAtom)
        };
      });

      act(() => {
        result.current.applyPreset({
          presetId: replaceMultipleCharactersPreset.id,
          modelName: replaceMultipleCharactersPreset.model as VideoEngine,
          settingsOverrides: replaceMultipleCharactersPreset.settingsOverrides
        });
      });

      expect(result.current.selectedPreset?.presetId).toBe(
        replaceMultipleCharactersPreset.id
      );

      act(() => {
        result.current.resetToDefaults();
      });

      expect(result.current.selectedPreset).toBeUndefined();
    });

    test("Reset restores model defaults", () => {
      const { result } = renderHook(() => {
        const atoms = useRenderSettingsAtoms();
        return {
          selectedModel: useAtomValue(atoms.selectedModelAtom),
          applyPreset: useSetAtom(atoms.applyPresetAtom),
          resetToDefaults: useSetAtom(atoms.resetToDefaultsAtom),
          values: useAtomValue(atoms.renderSettingsValuesAtom)
        };
      });

      act(() => {
        result.current.applyPreset({
          presetId: replaceMultipleCharactersPreset.id,
          modelName: replaceMultipleCharactersPreset.model as VideoEngine,
          settingsOverrides: replaceMultipleCharactersPreset.settingsOverrides
        });
      });

      expect(result.current.values.control_type).toBe("pose");

      act(() => {
        result.current.resetToDefaults();
      });

      const defaultsAfterReset = extractDefaultVideoSettings(
        result.current.selectedModel
      ) as VideoSettings;

      Object.keys(defaultsAfterReset).forEach((key) => {
        expect(result.current.values[key as keyof VideoSettings]).toEqual(
          defaultsAfterReset[key as keyof VideoSettings]
        );
      });
    });
  });
});

describe("renderSettingsStore - Reuse settings carries sources", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(useSelectedProjectId).mockReturnValue(TEST_PROJECT_ID);
  });

  test("loadSettings drops legacy `category` on reference_frame entries while preserving them in sources", () => {
    const { result } = renderHook(() => {
      const atoms = useRenderSettingsAtoms();
      return {
        loadSettings: useSetAtom(atoms.loadSettingsAtom),
        sources: useAtomValue(atoms.sourcesAtom),
        values: useAtomValue(atoms.renderSettingsValuesAtom)
      };
    });

    act(() => {
      result.current.loadSettings({
        values: { mago_engine: VideoEngine.V3_4_0 } as VideoSettings,
        sources: [
          { asset_id: "bg1", type: "reference_frame" },
          { asset_id: "legacy", type: "reference_frame" }
        ],
        targetTool: "render-video"
      });
    });

    expect(result.current.values).not.toHaveProperty("background_images");
    expect(result.current.values).not.toHaveProperty("character_images");
    expect(result.current.values).not.toHaveProperty("objects_images");
    expect(result.current.sources).toEqual([
      { asset_id: "bg1", type: "reference_frame" },
      { asset_id: "legacy", type: "reference_frame" }
    ]);
  });

  test("loadSettings promotes an explicit lone reference to key_frame for V3.4 (key-frame slot only)", () => {
    const { result } = renderHook(() => {
      const atoms = useRenderSettingsAtoms();
      return {
        loadSettings: useSetAtom(atoms.loadSettingsAtom),
        sources: useAtomValue(atoms.sourcesAtom),
        selectedModel: useAtomValue(atoms.selectedModelAtom)
      };
    });

    act(() => {
      result.current.loadSettings({
        values: { mago_engine: VideoEngine.V3_4_0 } as VideoSettings,
        sources: [{ asset_id: "asset-from-track", type: "reference_frame" }],
        targetTool: "render-video"
      });
    });

    expect(result.current.sources).toEqual([
      { asset_id: "asset-from-track", type: "key_frame", index: 0 }
    ]);
    expect(result.current.selectedModel.name).toBe(VideoEngine.V3_4_0);
  });

  test("loadSettings without explicit sources falls back to legacy ipadapter_image_source (promoted to key_frame on V3.4)", () => {
    const { result } = renderHook(() => {
      const atoms = useRenderSettingsAtoms();
      return {
        loadSettings: useSetAtom(atoms.loadSettingsAtom),
        sources: useAtomValue(atoms.sourcesAtom),
        values: useAtomValue(atoms.renderSettingsValuesAtom)
      };
    });

    act(() => {
      result.current.loadSettings({
        values: {
          mago_engine: VideoEngine.V3_4_0,
          ipadapter_image_source: "legacy-asset"
        } as VideoSettings,
        targetTool: "render-video"
      });
    });

    expect(result.current.sources).toEqual([
      { asset_id: "legacy-asset", type: "key_frame", index: 0 }
    ]);
    expect(result.current.values.ipadapter_image_source).toBeUndefined();
  });

  test("loadSettings prefers explicit sources over values-derived legacy field", () => {
    const { result } = renderHook(() => {
      const atoms = useRenderSettingsAtoms();
      return {
        loadSettings: useSetAtom(atoms.loadSettingsAtom),
        sources: useAtomValue(atoms.sourcesAtom)
      };
    });

    act(() => {
      result.current.loadSettings({
        values: {
          mago_engine: VideoEngine.V5_0_0,
          ipadapter_image_source: "legacy-asset"
        } as VideoSettings,
        sources: [{ asset_id: "from-track", type: "reference_frame" }],
        targetTool: "render-video"
      });
    });

    expect(result.current.sources).toEqual([
      { asset_id: "from-track", type: "key_frame", index: 0 }
    ]);
  });

  test("loadSettings with empty sources and no legacy field yields []", () => {
    const { result } = renderHook(() => {
      const atoms = useRenderSettingsAtoms();
      return {
        loadSettings: useSetAtom(atoms.loadSettingsAtom),
        sources: useAtomValue(atoms.sourcesAtom)
      };
    });

    act(() => {
      result.current.loadSettings({
        values: { mago_engine: VideoEngine.V5_0_0 } as VideoSettings,
        targetTool: "render-video"
      });
    });

    expect(result.current.sources).toEqual([]);
  });

  test("Kling 3.0 reuse strips BE-only image_id and promotes the reconstructed source to motion_reference", () => {
    const { result } = renderHook(() => {
      const atoms = useRenderSettingsAtoms();
      return {
        loadSettings: useSetAtom(atoms.loadSettingsAtom),
        sources: useAtomValue(atoms.sourcesAtom),
        values: useAtomValue(atoms.renderSettingsValuesAtom)
      };
    });

    act(() => {
      result.current.loadSettings({
        values: {
          mago_engine: VideoEngine.kling_3_motion_control,
          image_id: "char-asset"
        } as unknown as VideoSettings,
        sources: [{ asset_id: "char-asset", type: "reference_frame" }],
        targetTool: "render-video"
      });
    });

    expect(result.current.sources).toEqual([
      { asset_id: "char-asset", type: "motion_reference" }
    ]);
    expect(result.current.values.image_id).toBeUndefined();
  });

  test("Kling 2.6 reuse promotes the reconstructed source to motion_reference", () => {
    const { result } = renderHook(() => {
      const atoms = useRenderSettingsAtoms();
      return {
        loadSettings: useSetAtom(atoms.loadSettingsAtom),
        sources: useAtomValue(atoms.sourcesAtom)
      };
    });

    act(() => {
      result.current.loadSettings({
        values: {
          mago_engine: VideoEngine.kling_2_6_motion_control,
          image_id: "char-asset"
        } as unknown as VideoSettings,
        sources: [{ asset_id: "char-asset", type: "reference_frame" }],
        targetTool: "render-video"
      });
    });

    expect(result.current.sources).toEqual([
      { asset_id: "char-asset", type: "motion_reference" }
    ]);
  });

  test("Kling 3.0 reuse via legacy ipadapter_image_source promotes through the adapter then to motion_reference", () => {
    const { result } = renderHook(() => {
      const atoms = useRenderSettingsAtoms();
      return {
        loadSettings: useSetAtom(atoms.loadSettingsAtom),
        sources: useAtomValue(atoms.sourcesAtom)
      };
    });

    act(() => {
      result.current.loadSettings({
        values: {
          mago_engine: VideoEngine.kling_3_motion_control,
          ipadapter_image_source: "legacy-char-asset"
        } as unknown as VideoSettings,
        targetTool: "render-video"
      });
    });

    expect(result.current.sources).toEqual([
      { asset_id: "legacy-char-asset", type: "motion_reference" }
    ]);
  });
});

describe("renderSettingsStore - reusing settings restores the crop", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(useSelectedProjectId).mockReturnValue(TEST_PROJECT_ID);
  });

  test("loadSettings restores a normalized crop from a cropped render's stored settings", () => {
    const { result } = renderHook(() => {
      const atoms = useRenderSettingsAtoms();
      return {
        loadSettings: useSetAtom(atoms.loadSettingsAtom),
        values: useAtomValue(atoms.renderSettingsValuesAtom),
        crop: useAtomValue(
          getCropStorageAtom(TEST_USER_ID, TEST_PROJECT_ID, TEST_SHOT_ID)
        )
      };
    });

    act(() => {
      result.current.loadSettings({
        values: {
          mago_engine: VideoEngine.V4_0_0,
          crop_coordinates: { top_left: [360, 0], bottom_right: [1920, 1080] },
          source_video_dimensions: [1920, 1080]
        } as unknown as VideoSettings,
        targetTool: "render-video"
      });
    });

    expect(result.current.crop.crop).toEqual({
      x: 0.1875,
      y: 0,
      width: 0.8125,
      height: 1
    });
    expect(result.current.values).not.toHaveProperty("crop_coordinates");
    expect(result.current.values).not.toHaveProperty("source_video_dimensions");
  });

  test("loadSettings clears an active crop when the reused render carries none", () => {
    const { result } = renderHook(() => {
      const atoms = useRenderSettingsAtoms();
      return {
        loadSettings: useSetAtom(atoms.loadSettingsAtom),
        crop: useAtomValue(
          getCropStorageAtom(TEST_USER_ID, TEST_PROJECT_ID, TEST_SHOT_ID)
        )
      };
    });

    act(() => {
      result.current.loadSettings({
        values: {
          mago_engine: VideoEngine.V4_0_0,
          crop_coordinates: { top_left: [360, 0], bottom_right: [1920, 1080] },
          source_video_dimensions: [1920, 1080]
        } as unknown as VideoSettings,
        targetTool: "render-video"
      });
    });

    expect(result.current.crop.crop).toBeDefined();

    act(() => {
      result.current.loadSettings({
        values: { mago_engine: VideoEngine.V4_0_0 } as VideoSettings,
        targetTool: "render-video"
      });
    });

    expect(result.current.crop.crop).toBeUndefined();
  });
});

describe("renderSettingsStore - source_image_slot synthesis", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(useSelectedProjectId).mockReturnValue(TEST_PROJECT_ID);
  });

  test("synthesises from the first reference_frame in sources", () => {
    const { result } = renderHook(() => {
      const atoms = useRenderSettingsAtoms();
      return {
        loadSettings: useSetAtom(atoms.loadSettingsAtom),
        values: useAtomValue(atoms.renderSettingsValuesAtom)
      };
    });

    act(() => {
      result.current.loadSettings({
        values: { mago_engine: VideoEngine.V3_4_0 } as VideoSettings,
        sources: [{ asset_id: "ref", type: "reference_frame" }],
        targetTool: "render-video"
      });
    });

    expect(result.current.values.source_image_slot).toBe("ref");
  });

  test("synthesises from a key_frame when no reference_frame is present", () => {
    const { result } = renderHook(() => {
      const atoms = useRenderSettingsAtoms();
      return {
        loadSettings: useSetAtom(atoms.loadSettingsAtom),
        values: useAtomValue(atoms.renderSettingsValuesAtom)
      };
    });

    act(() => {
      result.current.loadSettings({
        values: { mago_engine: VideoEngine.V3_4_0 } as VideoSettings,
        sources: [{ asset_id: "kf", type: "key_frame", index: 0 }],
        targetTool: "render-video"
      });
    });

    expect(result.current.values.source_image_slot).toBe("kf");
  });

  test("is undefined when sources is empty", () => {
    const { result } = renderHook(() => {
      const atoms = useRenderSettingsAtoms();
      return {
        loadSettings: useSetAtom(atoms.loadSettingsAtom),
        values: useAtomValue(atoms.renderSettingsValuesAtom)
      };
    });

    act(() => {
      result.current.loadSettings({
        values: { mago_engine: VideoEngine.V3_4_0 } as VideoSettings,
        targetTool: "render-video"
      });
    });

    expect(result.current.values.source_image_slot).toBeUndefined();
  });

  test("synthesises from a style_reference source", () => {
    const { result } = renderHook(() => {
      const atoms = useRenderSettingsAtoms();
      return {
        loadSettings: useSetAtom(atoms.loadSettingsAtom),
        values: useAtomValue(atoms.renderSettingsValuesAtom)
      };
    });

    act(() => {
      result.current.loadSettings({
        values: { mago_engine: VideoEngine.V5_0_0 } as VideoSettings,
        sources: [{ asset_id: "style-uuid", type: "style_reference" }],
        targetTool: "render-video"
      });
    });

    expect(result.current.values.source_image_slot).toBe("style-uuid");
  });
});

describe("renderSettingsStore - image_ids / element pair synthesis", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(useSelectedProjectId).mockReturnValue(TEST_PROJECT_ID);
  });

  test("synthesises image_ids in order from reference_frame entries in sources", () => {
    const { result } = renderHook(() => {
      const atoms = useRenderSettingsAtoms();
      return {
        loadSettings: useSetAtom(atoms.loadSettingsAtom),
        values: useAtomValue(atoms.renderSettingsValuesAtom)
      };
    });

    act(() => {
      result.current.loadSettings({
        values: { mago_engine: VideoEngine.seedance_2 } as VideoSettings,
        sources: [
          { asset_id: "a", type: "reference_frame" },
          { asset_id: "b", type: "reference_frame" }
        ],
        targetTool: "render-video"
      });
    });

    expect(result.current.values.image_ids).toEqual(["a", "b"]);
  });

  test("image_ids is empty when sources has no reference_frame entries", () => {
    const { result } = renderHook(() => {
      const atoms = useRenderSettingsAtoms();
      return {
        loadSettings: useSetAtom(atoms.loadSettingsAtom),
        values: useAtomValue(atoms.renderSettingsValuesAtom)
      };
    });

    act(() => {
      result.current.loadSettings({
        values: { mago_engine: VideoEngine.seedance_2 } as VideoSettings,
        targetTool: "render-video"
      });
    });

    expect(result.current.values.image_ids).toEqual([]);
  });

  test("synthesises reference_image_id / frontal_image_id from element entries in sources", () => {
    const { result } = renderHook(() => {
      const atoms = useRenderSettingsAtoms();
      return {
        loadSettings: useSetAtom(atoms.loadSettingsAtom),
        values: useAtomValue(atoms.renderSettingsValuesAtom)
      };
    });

    act(() => {
      result.current.loadSettings({
        values: { mago_engine: VideoEngine.kling_o1 } as VideoSettings,
        sources: [
          { asset_id: "er", type: "element_reference", index: 0 },
          { asset_id: "ef", type: "element_frontal", index: 0 }
        ],
        targetTool: "render-video"
      });
    });

    expect(result.current.values.reference_image_id).toBe("er");
    expect(result.current.values.frontal_image_id).toBe("ef");
  });

  test("reference_image_id / frontal_image_id are undefined when no element entries are present", () => {
    const { result } = renderHook(() => {
      const atoms = useRenderSettingsAtoms();
      return {
        loadSettings: useSetAtom(atoms.loadSettingsAtom),
        values: useAtomValue(atoms.renderSettingsValuesAtom)
      };
    });

    act(() => {
      result.current.loadSettings({
        values: { mago_engine: VideoEngine.kling_o1 } as VideoSettings,
        targetTool: "render-video"
      });
    });

    expect(result.current.values.reference_image_id).toBeUndefined();
    expect(result.current.values.frontal_image_id).toBeUndefined();
  });
});

describe("renderSettingsStore - stale source roles are dropped on model switch", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(useSelectedProjectId).mockReturnValue(TEST_PROJECT_ID);
  });

  const renderModelSwitchHook = () =>
    renderHook(() => {
      const atoms = useRenderSettingsAtoms();
      return {
        setSelectedModel: useSetAtom(atoms.selectedModelAtom),
        setSources: useSetAtom(atoms.sourcesAtom),
        sources: useAtomValue(atoms.sourcesAtom)
      };
    });

  const klingO1 = () =>
    RENDER_MODELS.find((model) => model.name === VideoEngine.kling_o1)!;
  const magoTransform = () =>
    RENDER_MODELS.find((model) => model.name === VideoEngine.V3_4_0)!;
  const magoV2_5_0 = () =>
    RENDER_MODELS.find((model) => model.name === VideoEngine.V2_5_0)!;

  test("switching from Kling O1 (reference_frame + element pair) to Mago V2.5.0 (plain key_frame, no wire round-trip bucket) drops the element pair and reference_frame entries", () => {
    const { result } = renderModelSwitchHook();

    act(() => {
      result.current.setSelectedModel(klingO1());
    });
    act(() => {
      result.current.setSources([
        { asset_id: "img-a", type: "reference_frame" },
        { asset_id: "er", type: "element_reference", index: 0 },
        { asset_id: "ef", type: "element_frontal", index: 0 }
      ]);
    });

    act(() => {
      result.current.setSelectedModel(magoV2_5_0());
    });

    expect(result.current.sources).toEqual([]);
  });

  test("switching from Kling O1 (reference_frame + element pair) to Mago Transform (V3.4.0, a REFERENCE_AND_KEY_FRAME_ENGINES wire bucket) drops only the element pair — reference_frame is a role V3.4.0 legitimately round-trips on the wire", () => {
    const { result } = renderModelSwitchHook();

    act(() => {
      result.current.setSelectedModel(klingO1());
    });
    act(() => {
      result.current.setSources([
        { asset_id: "img-a", type: "reference_frame" },
        { asset_id: "er", type: "element_reference", index: 0 },
        { asset_id: "ef", type: "element_frontal", index: 0 }
      ]);
    });

    act(() => {
      result.current.setSelectedModel(magoTransform());
    });

    expect(result.current.sources).toEqual([
      { asset_id: "img-a", type: "reference_frame" }
    ]);
  });

  test("switching from Mago Transform (key_frame) to Kling O1 (reference_frame + element pair) drops the key_frame entry", () => {
    const { result } = renderModelSwitchHook();

    act(() => {
      result.current.setSelectedModel(magoTransform());
    });
    act(() => {
      result.current.setSources([
        { asset_id: "kf", type: "key_frame", index: 0 }
      ]);
    });

    act(() => {
      result.current.setSelectedModel(klingO1());
    });

    expect(result.current.sources).toEqual([]);
  });

  test("switching between two models that both support reference_frame keeps that role's entries", () => {
    const { result } = renderModelSwitchHook();
    const seedance2 = () =>
      RENDER_MODELS.find((model) => model.name === VideoEngine.seedance_2)!;

    act(() => {
      result.current.setSelectedModel(klingO1());
    });
    act(() => {
      result.current.setSources([
        { asset_id: "img-a", type: "reference_frame" }
      ]);
    });

    act(() => {
      result.current.setSelectedModel(seedance2());
    });

    expect(result.current.sources).toEqual([
      { asset_id: "img-a", type: "reference_frame" }
    ]);
  });
});

describe("renderSettingsStore - loadSettingsAtom fallback drops stale roles when mago_engine is unrecognised", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(useSelectedProjectId).mockReturnValue(TEST_PROJECT_ID);
  });

  const renderLoadSettingsHook = () =>
    renderHook(() => {
      const atoms = useRenderSettingsAtoms();
      return {
        setSelectedModel: useSetAtom(atoms.selectedModelAtom),
        loadSettings: useSetAtom(atoms.loadSettingsAtom),
        sources: useAtomValue(atoms.sourcesAtom)
      };
    });

  const klingO1 = () =>
    RENDER_MODELS.find((model) => model.name === VideoEngine.kling_o1)!;

  test("a reused render whose values carry no mago_engine at all keeps only roles the currently-selected model supports", () => {
    const { result } = renderLoadSettingsHook();

    act(() => {
      result.current.setSelectedModel(klingO1());
    });

    act(() => {
      result.current.loadSettings({
        values: {} as VideoSettings,
        sources: [
          { asset_id: "kf", type: "key_frame", index: 0 },
          { asset_id: "img-a", type: "reference_frame" }
        ],
        targetTool: "render-video"
      });
    });

    expect(result.current.sources).toEqual([
      { asset_id: "img-a", type: "reference_frame" }
    ]);
  });

  test("a reused render whose mago_engine no longer matches any RENDER_MODELS entry keeps only roles the currently-selected model supports", () => {
    const { result } = renderLoadSettingsHook();

    act(() => {
      result.current.setSelectedModel(klingO1());
    });

    act(() => {
      result.current.loadSettings({
        values: {
          mago_engine: "some.retired.engine.no.longer.in.render_models"
        } as VideoSettings,
        sources: [
          { asset_id: "kf", type: "key_frame", index: 0 },
          { asset_id: "img-a", type: "reference_frame" }
        ],
        targetTool: "render-video"
      });
    });

    expect(result.current.sources).toEqual([
      { asset_id: "img-a", type: "reference_frame" }
    ]);
  });
});

describe("renderSettingsStore - applyPresetAtom drops stale roles the target preset's model does not support", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(useSelectedProjectId).mockReturnValue(TEST_PROJECT_ID);
  });

  test("applying a preset onto Kling O1 after sources were authored under Mago Transform drops the key_frame entry", () => {
    const { result } = renderHook(() => {
      const atoms = useRenderSettingsAtoms();
      return {
        setSelectedModel: useSetAtom(atoms.selectedModelAtom),
        setSources: useSetAtom(atoms.sourcesAtom),
        applyPreset: useSetAtom(atoms.applyPresetAtom),
        sources: useAtomValue(atoms.sourcesAtom)
      };
    });

    const magoTransform = RENDER_MODELS.find(
      (model) => model.name === VideoEngine.V3_4_0
    )!;

    act(() => {
      result.current.setSelectedModel(magoTransform);
    });
    act(() => {
      result.current.setSources([
        { asset_id: "kf", type: "key_frame", index: 0 }
      ]);
    });

    act(() => {
      result.current.applyPreset({
        presetId: "test-preset",
        modelName: VideoEngine.kling_o1,
        settingsOverrides: {}
      });
    });

    expect(result.current.sources).toEqual([]);
  });
});

describe("renderSettingsStore - applyMaskAsInpaintingInputAtom drops stale roles V5.1.0 Inpainting does not support", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(useSelectedProjectId).mockReturnValue(TEST_PROJECT_ID);
  });

  test("using a mask as inpainting input after sources were authored under Kling O1 drops the element pair", () => {
    const { result } = renderHook(() => {
      const atoms = useRenderSettingsAtoms();
      return {
        setSelectedModel: useSetAtom(atoms.selectedModelAtom),
        setSources: useSetAtom(atoms.sourcesAtom),
        applyMaskAsInpaintingInput: useSetAtom(
          atoms.applyMaskAsInpaintingInputAtom
        ),
        sources: useAtomValue(atoms.sourcesAtom)
      };
    });

    const klingO1 = RENDER_MODELS.find(
      (model) => model.name === VideoEngine.kling_o1
    )!;

    act(() => {
      result.current.setSelectedModel(klingO1);
    });
    act(() => {
      result.current.setSources([
        { asset_id: "img-a", type: "reference_frame" },
        { asset_id: "er", type: "element_reference", index: 0 },
        { asset_id: "ef", type: "element_frontal", index: 0 }
      ]);
    });

    act(() => {
      result.current.applyMaskAsInpaintingInput("mask-track-id");
    });

    expect(result.current.sources).toEqual([
      { asset_id: "img-a", type: "reference_frame" }
    ]);
  });
});

describe("renderSettingsStore - applyMaskAsInpaintingInputAtom clears a stale mask_prompt", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(useSelectedProjectId).mockReturnValue(TEST_PROJECT_ID);
  });

  test("applying a mask while already on Inpainting clears an existing mask_prompt", () => {
    const { result } = renderHook(() => {
      const atoms = useRenderSettingsAtoms();
      return {
        setSelectedModel: useSetAtom(atoms.selectedModelAtom),
        updateValue: useSetAtom(atoms.updateValueAtom),
        applyMaskAsInpaintingInput: useSetAtom(
          atoms.applyMaskAsInpaintingInputAtom
        ),
        values: useAtomValue(atoms.renderSettingsValuesAtom)
      };
    });

    const inpaintingModel = RENDER_MODELS.find(
      (model) => model.name === VideoEngine.V5_1_0
    )!;

    act(() => {
      result.current.setSelectedModel(inpaintingModel);
    });
    act(() => {
      result.current.updateValue({ key: "mask_prompt", value: "a person" });
    });

    expect(result.current.values.mask_prompt).toBe("a person");

    act(() => {
      result.current.applyMaskAsInpaintingInput("mask-track-id");
    });

    expect(result.current.values.mask_prompt).toBe("");
    expect(result.current.values.input_mask).toBe("mask-track-id");
  });

  test("clearMaskAsInpaintingInputAtom deletes the applied mask and clears mask_prompt in one atomic write", () => {
    const { result } = renderHook(() => {
      const atoms = useRenderSettingsAtoms();
      return {
        setSelectedModel: useSetAtom(atoms.selectedModelAtom),
        updateValue: useSetAtom(atoms.updateValueAtom),
        clearMaskAsInpaintingInput: useSetAtom(
          atoms.clearMaskAsInpaintingInputAtom
        ),
        values: useAtomValue(atoms.renderSettingsValuesAtom)
      };
    });

    const inpaintingModel = RENDER_MODELS.find(
      (model) => model.name === VideoEngine.V5_1_0
    )!;

    act(() => {
      result.current.setSelectedModel(inpaintingModel);
    });
    act(() => {
      result.current.updateValue({ key: "input_mask", value: "mask-track-id" });
      result.current.updateValue({
        key: "mask_prompt",
        value: "a stale prompt"
      });
    });

    expect(result.current.values.input_mask).toBe("mask-track-id");
    expect(result.current.values.mask_prompt).toBe("a stale prompt");

    act(() => {
      result.current.clearMaskAsInpaintingInput();
    });

    expect(result.current.values.input_mask).toBe("");
    expect(result.current.values.mask_prompt).toBe("");
  });
});
