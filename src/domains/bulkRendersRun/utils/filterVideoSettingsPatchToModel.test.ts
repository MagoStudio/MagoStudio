import { VideoEngine, VideoModelDefinition } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { filterVideoSettingsPatchToModel } from "./filterVideoSettingsPatchToModel";

const buildModelDeclaring = (settingKeys: string[]): VideoModelDefinition =>
  ({
    name: VideoEngine.V3_4_0,
    settingsGroups: [
      {
        name: "group",
        level: "main",
        sections: [
          { name: undefined, settings: settingKeys.map((key) => ({ key })) }
        ]
      }
    ]
  }) as VideoModelDefinition;

describe("filterVideoSettingsPatchToModel", () => {
  it("keeps a patch key the model declares", () => {
    const filtered = filterVideoSettingsPatchToModel(
      { steps: 30 },
      buildModelDeclaring(["steps"])
    );

    expect(filtered).toEqual({ steps: 30 });
  });

  it("drops a patch key the model does not declare", () => {
    const filtered = filterVideoSettingsPatchToModel(
      { steps: 30, a_model_b_only_key: 1 },
      buildModelDeclaring(["steps"])
    );

    expect(filtered).toEqual({ steps: 30 });
  });

  it("keeps prompt regardless of what the model declares", () => {
    const filtered = filterVideoSettingsPatchToModel(
      { prompt: "a different clip" },
      buildModelDeclaring([])
    );

    expect(filtered).toEqual({ prompt: "a different clip" });
  });

  it("returns an empty object when every key is undeclared", () => {
    const filtered = filterVideoSettingsPatchToModel(
      { a_model_b_only_key: 1 },
      buildModelDeclaring(["steps"])
    );

    expect(filtered).toEqual({});
  });
});
