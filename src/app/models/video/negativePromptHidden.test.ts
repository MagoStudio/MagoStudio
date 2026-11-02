import { describe, expect, it } from "vitest";

import { RENDER_MODELS } from "./constants";
import { extractDefaultVideoSettings } from "./extractDefaultVideoSettings";
import { VideoModelDefinition } from "./types";
import { flattenSettingsGroups } from "./utils/flattenSettingsGroups";

const findSetting = (model: VideoModelDefinition, key: string) => {
  for (const section of flattenSettingsGroups(model)) {
    for (const setting of section.settings) {
      if (setting.key === key) return setting;
    }
  }
  return undefined;
};

const MODELS_WITH_NEGATIVE_PROMPT: ReadonlyArray<
  [string, VideoModelDefinition]
> = RENDER_MODELS.filter(
  (model) => findSetting(model, "negative_prompt") !== undefined
).map((model) => [model.name, model] as const);

describe("negative_prompt is hidden from the UI but still shipped to backend", () => {
  it("guards against the source list being empty", () => {
    expect(MODELS_WITH_NEGATIVE_PROMPT.length).toBeGreaterThan(0);
  });

  it.each(MODELS_WITH_NEGATIVE_PROMPT)(
    "%s: hides negative_prompt from the editor while preserving it in the defaults payload",
    (_, model) => {
      const setting = findSetting(model, "negative_prompt");
      if (!setting) throw new Error("negative_prompt setting not found");
      expect(setting.hidingCondition?.({}, false)).toBe(true);
      expect(setting.hidingCondition?.({}, true)).toBe(true);
      expect(typeof setting.defaultValue).toBe("string");
      expect((setting.defaultValue as string).length).toBeGreaterThan(0);

      const defaults = extractDefaultVideoSettings(model);
      expect(defaults.negative_prompt).toBeTruthy();
    }
  );
});
