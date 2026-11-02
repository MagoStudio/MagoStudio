import { VideoEngine, VideoModelDefinition } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { getDeclaredVideoSettingKeysForModel } from "./getDeclaredVideoSettingKeysForModel";

const buildModel = (
  overrides: Partial<VideoModelDefinition> = {}
): VideoModelDefinition =>
  ({
    name: VideoEngine.V3_4_0,
    settingsGroups: [],
    ...overrides
  }) as VideoModelDefinition;

describe("getDeclaredVideoSettingKeysForModel", () => {
  it("always includes prompt, even for a model with no settings groups", () => {
    const keys = getDeclaredVideoSettingKeysForModel(buildModel());

    expect(keys.has("prompt")).toBe(true);
  });

  it("includes every setting's key across every group and section", () => {
    const model = buildModel({
      settingsGroups: [
        {
          name: "Basic",
          level: "main",
          sections: [
            { name: undefined, settings: [{ key: "steps" }] },
            { name: "Advanced", settings: [{ key: "cfg_scale" }] }
          ]
        },
        {
          name: "Quality",
          level: "quality",
          sections: [{ name: undefined, settings: [{ key: "max_size" }] }]
        }
      ]
    } as unknown as Partial<VideoModelDefinition>);

    const keys = getDeclaredVideoSettingKeysForModel(model);

    expect(keys.has("steps")).toBe(true);
    expect(keys.has("cfg_scale")).toBe(true);
    expect(keys.has("max_size")).toBe(true);
  });

  it("includes a setting's secondKey alongside its own key", () => {
    const model = buildModel({
      settingsGroups: [
        {
          name: "Basic",
          level: "main",
          sections: [
            {
              name: undefined,
              settings: [
                { key: "frame_range_start", secondKey: "frame_range_end" }
              ]
            }
          ]
        }
      ]
    } as unknown as Partial<VideoModelDefinition>);

    const keys = getDeclaredVideoSettingKeysForModel(model);

    expect(keys.has("frame_range_start")).toBe(true);
    expect(keys.has("frame_range_end")).toBe(true);
  });

  it("never claims a key the model does not declare", () => {
    const model = buildModel({
      settingsGroups: [
        {
          name: "Basic",
          level: "main",
          sections: [{ name: undefined, settings: [{ key: "steps" }] }]
        }
      ]
    } as unknown as Partial<VideoModelDefinition>);

    const keys = getDeclaredVideoSettingKeysForModel(model);

    expect(keys.has("cfg_scale")).toBe(false);
  });
});
