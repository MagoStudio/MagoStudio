import { describe, expect, it, test } from "vitest";

import { extractDefaultVideoSettings } from "./extractDefaultVideoSettings";
import { magoV5_0_0RenderModel } from "./magoV5_0_0VideoModel";
import { VideoSettings } from "./types";
import { flattenSettingsGroups } from "./utils/flattenSettingsGroups";

const findSetting = (key: string) => {
  for (const section of flattenSettingsGroups(magoV5_0_0RenderModel)) {
    for (const setting of section.settings) {
      if (setting.key === key) return setting;
    }
  }
  return undefined;
};

const toBackend = magoV5_0_0RenderModel.formatValuesForBackend!;
const toFrontend = magoV5_0_0RenderModel.formatValuesForFrontend!;
const PREPARE_CONTEXT = { isFlowsEnabled: false } as never;

const RETIRED_LORA_SETTINGS = {
  lora_1: 0.7,
  lora_5: 0.9,
  lora_weight_1: 0.5
} as VideoSettings;

describe("magoV5_0_0RenderModel", () => {
  it("declares no LoRA settings", () => {
    for (const key of Object.keys(RETIRED_LORA_SETTINGS)) {
      expect(findSetting(key)).toBeUndefined();
    }
  });

  it("seeds bypass_tiling: false default for team and non-team members alike", () => {
    expect(
      extractDefaultVideoSettings(magoV5_0_0RenderModel, false).bypass_tiling
    ).toBe(false);
    expect(
      extractDefaultVideoSettings(magoV5_0_0RenderModel, true).bypass_tiling
    ).toBe(false);
  });
});

describe("magoV5_0_0RenderModel.formatValuesForBackend", () => {
  test("always sends an empty custom_loras array and keeps other settings", () => {
    const result = toBackend(
      { steps: 4, prompt: "hello" } as VideoSettings,
      PREPARE_CONTEXT
    );

    expect(result.custom_loras).toEqual([]);
    expect(result.steps).toBe(4);
    expect(result.prompt).toBe("hello");
    expect(result.skip_cnet_preprocess).toBe(true);
  });

  test("drops retired LoRA values a saved Track may still hold", () => {
    const result = toBackend(
      { ...RETIRED_LORA_SETTINGS, steps: 4 } as VideoSettings,
      PREPARE_CONTEXT
    );

    for (const key of Object.keys(RETIRED_LORA_SETTINGS)) {
      expect(result).not.toHaveProperty(key);
    }
    expect(result.custom_loras).toEqual([]);
  });

  test("derives split_step from default steps and split_step_percentage", () => {
    const result = toBackend(
      { steps: 4, split_step_percentage: 40 } as VideoSettings,
      PREPARE_CONTEXT
    );

    expect(result.split_step).toBe(2);
    expect(result.split_step_percentage).toBe(40);
  });

  test("derives split_step for a high level of detail", () => {
    const result = toBackend(
      { steps: 20, split_step_percentage: 80 } as VideoSettings,
      PREPARE_CONTEXT
    );

    expect(result.split_step).toBe(4);
  });

  test("derives split_step for a low level of detail", () => {
    const result = toBackend(
      { steps: 20, split_step_percentage: 20 } as VideoSettings,
      PREPARE_CONTEXT
    );

    expect(result.split_step).toBe(16);
  });

  test("rounds non-integer split_step products via Math.round", () => {
    const result = toBackend(
      { steps: 7, split_step_percentage: 50 } as VideoSettings,
      PREPARE_CONTEXT
    );

    expect(result.split_step).toBe(4);
  });

  test("applies no floor at the high level-of-detail boundary", () => {
    const result = toBackend(
      { steps: 4, split_step_percentage: 80 } as VideoSettings,
      PREPARE_CONTEXT
    );

    expect(result.split_step).toBe(1);
  });

  test("falls back to defaults for split_step when settings are missing", () => {
    const result = toBackend({} as VideoSettings, PREPARE_CONTEXT);

    expect(result.split_step_percentage).toBe(40);
    expect(result.split_step).toBe(2);
  });
});

describe("magoV5_0_0RenderModel.formatValuesForFrontend", () => {
  test("inputs without LoRA keys pass through unchanged", () => {
    const result = toFrontend({ steps: 8, prompt: "x" } as VideoSettings);
    expect(result).toEqual({ steps: 8, prompt: "x" });
  });

  test("drops retired LoRA keys and the custom_loras array from a stored render", () => {
    const result = toFrontend({
      ...RETIRED_LORA_SETTINGS,
      custom_loras: [{ lora_name: "any_lora", lora_strength: 0.9 }],
      steps: 6
    } as VideoSettings);

    expect(result).toEqual({ steps: 6 });
  });
});
