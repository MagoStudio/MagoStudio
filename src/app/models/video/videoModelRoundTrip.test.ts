import { SourceImage } from "@domains/renders/types";
import { parseRenderDataForFrontend } from "@domains/renders/utils/parseRenderDataForFrontend";
import { Setting } from "@models/shared/types";
import { RENDER_MODELS } from "@models/video/constants";
import {
  PrepareRenderSettingsContext,
  VideoModelDefinition,
  VideoSettings
} from "@models/video/types";
import { flattenSettingsGroups } from "@models/video/utils/flattenSettingsGroups";
import { describe, expect, it } from "vitest";

import { happyHorse1Model } from "./happyHorse1Model";
import { kling2_6MotionControlModel } from "./kling2_6MotionControlModel";
import { kling3_0MotionControlModel } from "./kling3_0MotionControlModel";
import { klingO1Model } from "./klingO1Model";
import { klingO3EditProModel } from "./klingO3EditProModel";
import { seedance2Model } from "./seedance2Model";

const CONTEXT: PrepareRenderSettingsContext = {
  inputVideoWidth: 1280,
  inputVideoHeight: 720,
  frameRange: [0, 24],
  fps: 24,
  sources: []
};

const ARRAY_SEED = ["roundtrip-seed-asset-id"];
const STRING_SEED = "roundtrip-seed-asset-id";

const seedValueForSetting = (setting: Setting): unknown => {
  if (setting.type === "array") {
    return ARRAY_SEED;
  }
  if (setting.type === "string") {
    if (typeof setting.defaultValue === "string" && setting.defaultValue) {
      return setting.defaultValue;
    }
    return STRING_SEED;
  }
  if (setting.type === "enum") {
    if (typeof setting.defaultValue === "string") {
      return setting.defaultValue;
    }
    const enumSetting = setting as Setting & {
      options: { value: string }[];
    };
    return enumSetting.options?.[0]?.value;
  }
  if (setting.type === "number") {
    const numSetting = setting as Setting & { min?: number; max?: number };
    const min = typeof numSetting.min === "number" ? numSetting.min : 0;
    const max = typeof numSetting.max === "number" ? numSetting.max : min + 1;
    if (min < max) {
      return min === 0 ? Math.min(1, max) : min;
    }
    return min;
  }
  if (setting.type === "boolean") {
    return typeof setting.defaultValue === "boolean"
      ? setting.defaultValue
      : false;
  }
  return setting.defaultValue;
};

const collectFormKeys = (model: VideoModelDefinition): FormKey[] => {
  const out: FormKey[] = [];
  for (const section of flattenSettingsGroups(model)) {
    for (const setting of section.settings) {
      if (setting.type === "tool") continue;
      if (setting.ui === "hidden") continue;
      out.push({
        key: setting.key,
        secondKey: setting.secondKey,
        setting
      });
    }
  }
  return out;
};

type FormKey = { key: string; secondKey?: string; setting: Setting };

const buildSeedValues = (formKeys: FormKey[]): VideoSettings => {
  const seed: Record<string, unknown> = {};
  for (const { key, secondKey, setting } of formKeys) {
    const value = seedValueForSetting(setting);
    if (value !== undefined) {
      seed[key] = value;
    }
    if (secondKey) {
      seed[secondKey] = STRING_SEED;
    }
  }
  return seed as VideoSettings;
};

const identity = (values: VideoSettings): VideoSettings => values;

const modelsWithBackendAdapter = RENDER_MODELS.filter(
  (model) => typeof model.formatValuesForBackend === "function"
);

const SOURCES_DERIVED_KEYS = new Set<string>([
  "image_ids",
  "reference_image_id",
  "frontal_image_id"
]);

const KEYS_DROPPED_BY_SIBLING_OVERRIDE = new Set<string>(["mask_prompt"]);

describe("video model adapter round-trip test coverage stays non-degenerate", () => {
  it("at least one RENDER_MODELS entry declares a backend adapter", () => {
    expect(modelsWithBackendAdapter.length).toBeGreaterThan(0);
  });
});

describe("video model adapter round-trip (FE → BE → FE preserves FE-form keys)", () => {
  it.each(modelsWithBackendAdapter.map((model) => [model.name, model]))(
    "%s preserves every FE-form key declared in settingsGroups",
    (_name, model) => {
      const formKeys = collectFormKeys(model).filter(
        ({ key }) =>
          !SOURCES_DERIVED_KEYS.has(key) &&
          !KEYS_DROPPED_BY_SIBLING_OVERRIDE.has(key)
      );
      const seedValues = buildSeedValues(formKeys);

      const onWire = model.formatValuesForBackend!(seedValues, CONTEXT);
      const toFrontend = model.formatValuesForFrontend ?? identity;
      const back = toFrontend(onWire) as Record<string, unknown>;

      for (const { key, secondKey, setting } of formKeys) {
        if (!(key in seedValues)) continue;
        expect(
          key in back,
          `${model.name}: FE key "${key}" (type=${setting.type}) was dropped after FE→BE→FE round-trip. Add formatValuesForFrontend that restores it.`
        ).toBe(true);
        if (secondKey && secondKey in (seedValues as Record<string, unknown>)) {
          expect(
            secondKey in back,
            `${model.name}: FE secondKey "${secondKey}" was dropped after FE→BE→FE round-trip.`
          ).toBe(true);
        }
      }
    }
  );
});

const legacyRenderDataFor = (
  magov2: Record<string, unknown>
): { render_settings: { magov2: Record<string, unknown> } } => ({
  render_settings: { magov2 }
});

const typedSourcesRenderDataFor = (
  images: SourceImage[]
): { sources: { images: SourceImage[] } } => ({ sources: { images } });

describe("in-scope external models hydrate legacy-shaped stored renders into typed sources (locks hydration before the picker migration)", () => {
  it("Kling O1: legacy image_ids + elements hydrate into reference_frame + element roles", () => {
    const { sources } = parseRenderDataForFrontend(
      legacyRenderDataFor({
        mago_engine: klingO1Model.name,
        image_ids: ["a", "b"],
        elements: [{ reference_image_id: ["er"], frontal_image_id: "ef" }]
      })
    );
    expect(sources).toEqual([
      { asset_id: "er", type: "element_reference", index: 0 },
      { asset_id: "ef", type: "element_frontal", index: 0 },
      { asset_id: "a", type: "reference_frame" },
      { asset_id: "b", type: "reference_frame" }
    ]);
  });

  it("Kling O3 Edit Pro: legacy image_ids + elements hydrate into reference_frame + element roles", () => {
    const { sources } = parseRenderDataForFrontend(
      legacyRenderDataFor({
        mago_engine: klingO3EditProModel.name,
        image_ids: ["ref"],
        elements: [{ reference_image_id: ["er"], frontal_image_id: "ef" }]
      })
    );
    expect(sources).toEqual([
      { asset_id: "er", type: "element_reference", index: 0 },
      { asset_id: "ef", type: "element_frontal", index: 0 },
      { asset_id: "ref", type: "reference_frame" }
    ]);
  });

  it("Kling 2.6 Motion Control: legacy image_id hydrates into motion_reference", () => {
    const { sources } = parseRenderDataForFrontend(
      legacyRenderDataFor({
        mago_engine: kling2_6MotionControlModel.name,
        image_id: "char"
      })
    );
    expect(sources).toEqual([{ asset_id: "char", type: "motion_reference" }]);
  });

  it("Kling 3.0 Motion Control: legacy image_id + elements hydrate into motion_reference + element roles", () => {
    const { sources } = parseRenderDataForFrontend(
      legacyRenderDataFor({
        mago_engine: kling3_0MotionControlModel.name,
        image_id: "char",
        elements: [{ reference_image_id: ["er"], frontal_image_id: "ef" }]
      })
    );
    expect(sources).toEqual([
      { asset_id: "er", type: "element_reference", index: 0 },
      { asset_id: "ef", type: "element_frontal", index: 0 },
      { asset_id: "char", type: "motion_reference" }
    ]);
  });

  it("Seedance 2.0: legacy image_ids hydrates into reference_frame entries", () => {
    const { sources } = parseRenderDataForFrontend(
      legacyRenderDataFor({
        mago_engine: seedance2Model.name,
        image_ids: ["s1", "s2"]
      })
    );
    expect(sources).toEqual([
      { asset_id: "s1", type: "reference_frame" },
      { asset_id: "s2", type: "reference_frame" }
    ]);
  });

  it("Happy Horse 1.0: legacy reference_image_ids hydrates into reference_frame entries", () => {
    const { sources } = parseRenderDataForFrontend(
      legacyRenderDataFor({
        mago_engine: happyHorse1Model.name,
        reference_image_ids: ["h1"]
      })
    );
    expect(sources).toEqual([{ asset_id: "h1", type: "reference_frame" }]);
  });
});

describe("in-scope external models round-trip a post-slice typed sources.images render unchanged", () => {
  it("Kling O1 / O3 / Seedance / Happy Horse: reference_frame entries round-trip as-is", () => {
    const images: SourceImage[] = [
      { asset_id: "a", type: "reference_frame" },
      { asset_id: "b", type: "reference_frame" }
    ];
    const { sources } = parseRenderDataForFrontend(
      typedSourcesRenderDataFor(images)
    );
    expect(sources).toEqual(images);
  });

  it("Kling O1 / O3: motion-less element roles round-trip as-is", () => {
    const images: SourceImage[] = [
      { asset_id: "er", type: "element_reference", index: 0 },
      { asset_id: "ef", type: "element_frontal", index: 0 }
    ];
    const { sources } = parseRenderDataForFrontend(
      typedSourcesRenderDataFor(images)
    );
    expect(sources).toEqual(images);
  });

  it("Kling Motion Control: motion_reference + element roles round-trip as-is", () => {
    const images: SourceImage[] = [
      { asset_id: "char", type: "motion_reference" },
      { asset_id: "er", type: "element_reference", index: 0 },
      { asset_id: "ef", type: "element_frontal", index: 0 }
    ];
    const { sources } = parseRenderDataForFrontend(
      typedSourcesRenderDataFor(images)
    );
    expect(sources).toEqual(images);
  });
});
