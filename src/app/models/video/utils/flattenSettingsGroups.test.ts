import { SettingsGroup } from "@models/shared/types";
import { describe, expect, it } from "vitest";

import { flattenSettingsGroups } from "./flattenSettingsGroups";

describe("flattenSettingsGroups", () => {
  it("flattens sections across every group, preserving order", () => {
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
            name: "Quality",
            settings: [
              { key: "b", type: "string", label: "B", ui: "TextInput" }
            ]
          },
          {
            name: "Other",
            settings: [
              { key: "c", type: "string", label: "C", ui: "TextInput" }
            ]
          }
        ]
      }
    ];

    const sections = flattenSettingsGroups({ settingsGroups: groups });

    expect(sections).toHaveLength(3);
    expect(sections.map((section) => section.name)).toEqual([
      undefined,
      "Quality",
      "Other"
    ]);
    expect(
      sections.flatMap((section) => section.settings.map((s) => s.key))
    ).toEqual(["a", "b", "c"]);
  });

  it("preserves each section's hidingCondition", () => {
    const hidingCondition = (settings: Record<string, any>) =>
      settings.control_type !== "depth";
    const groups: SettingsGroup[] = [
      {
        name: "Technical",
        level: "technical",
        sections: [{ name: undefined, hidingCondition, settings: [] }]
      }
    ];

    const [section] = flattenSettingsGroups({ settingsGroups: groups });
    expect(section.hidingCondition).toBe(hidingCondition);
  });

  it("returns an empty array for a model with no groups", () => {
    expect(flattenSettingsGroups({ settingsGroups: [] })).toEqual([]);
  });
});
