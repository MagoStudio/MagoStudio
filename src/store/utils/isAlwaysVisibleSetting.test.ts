import { SettingsGroup } from "@models/shared/types";
import { VideoModelDefinition } from "@models/video/types";
import { describe, expect, it } from "vitest";

import {
  getAlwaysVisibleSettingKeys,
  isAlwaysVisibleSetting
} from "./isAlwaysVisibleSetting";

const buildModel = (settingsGroups: SettingsGroup[]): VideoModelDefinition =>
  ({ settingsGroups }) as unknown as VideoModelDefinition;

describe("isAlwaysVisibleSetting", () => {
  it("treats main and technical level keys as always visible", () => {
    const model = buildModel([
      {
        name: "Main",
        level: "main",
        sections: [{ name: undefined, settings: [{ key: "prompt" } as any] }]
      },
      {
        name: "Technical",
        level: "technical",
        sections: [{ name: undefined, settings: [{ key: "max_size" } as any] }]
      },
      {
        name: "Advanced",
        level: "advanced",
        sections: [{ name: undefined, settings: [{ key: "seed" } as any] }]
      }
    ]);

    const keys = getAlwaysVisibleSettingKeys(model);
    expect(keys.has("prompt")).toBe(true);
    expect(keys.has("max_size")).toBe(true);
    expect(keys.has("seed")).toBe(false);

    expect(isAlwaysVisibleSetting("prompt", model)).toBe(true);
    expect(isAlwaysVisibleSetting("seed", model)).toBe(false);
  });

  it("includes secondKey alongside key", () => {
    const model = buildModel([
      {
        name: "Main",
        level: "main",
        sections: [
          {
            name: undefined,
            settings: [{ key: "range_start", secondKey: "range_end" } as any]
          }
        ]
      }
    ]);

    const keys = getAlwaysVisibleSettingKeys(model);
    expect(keys.has("range_start")).toBe(true);
    expect(keys.has("range_end")).toBe(true);
  });

  it("ignores quality and advanced groups", () => {
    const model = buildModel([
      {
        name: "Quality",
        level: "quality",
        sections: [{ name: undefined, settings: [{ key: "steps" } as any] }]
      }
    ]);

    expect(getAlwaysVisibleSettingKeys(model).size).toBe(0);
  });
});
