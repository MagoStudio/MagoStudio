import { SettingsGroup } from "@models/shared/types";
import { magoV3_4_0RenderModel } from "@models/video/magoV3_4_0VideoModel";
import { describe, expect, it } from "vitest";

import { keyedSections } from "./keyedSections";

describe("keyedSections", () => {
  it("produces a unique key per section even when name and setting keys collide", () => {
    const groups: SettingsGroup[] = [
      {
        name: "Advanced settings",
        level: "advanced",
        sections: [
          {
            name: "",
            hidingCondition: () => true,
            settings: [
              {
                key: "enable_facemesh_blending",
                type: "boolean",
                label: "Facemesh",
                ui: "CheckboxInput"
              }
            ]
          },
          {
            name: "",
            hidingCondition: () => false,
            settings: [
              {
                key: "enable_facemesh_blending",
                type: "boolean",
                label: "Facemesh",
                ui: "CheckboxInput"
              }
            ]
          }
        ]
      }
    ];

    const keys = keyedSections(groups).map(({ key }) => key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("keeps every key stable and unique for the real Transform (V3.4) settingsGroups, which has four identically-named/keyed facemesh sections", () => {
    const keys = keyedSections(magoV3_4_0RenderModel.settingsGroups).map(
      ({ key }) => key
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("keys are independent of the groups array's own filtering upstream", () => {
    const groups: SettingsGroup[] = [
      {
        name: "Main",
        level: "main",
        sections: [
          {
            name: undefined,
            settings: [
              { key: "a", type: "string", label: "A", ui: "TextInput" }
            ]
          }
        ]
      },
      {
        name: "Advanced",
        level: "advanced",
        sections: [
          {
            name: undefined,
            settings: [
              { key: "b", type: "string", label: "B", ui: "TextInput" }
            ]
          }
        ]
      }
    ];

    expect(keyedSections(groups).map(({ key }) => key)).toEqual([
      "main-0-0",
      "advanced-1-0"
    ]);
  });
});
