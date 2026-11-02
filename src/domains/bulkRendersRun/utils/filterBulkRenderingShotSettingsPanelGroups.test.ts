import { SettingsGroup } from "@models/shared/types";
import { RENDER_MODELS } from "@models/video/constants";
import { describe, expect, it } from "vitest";

import {
  collectShotEditableSettingKeys,
  filterToShotEditableSettingsGroups
} from "./filterBulkRenderingShotSettingsPanelGroups";

const buildGroup = (
  settings: Array<{ key: string; ui: string }>
): SettingsGroup =>
  ({
    name: "Main",
    level: "main",
    sections: [{ name: undefined, settings }]
  }) as unknown as SettingsGroup;

describe("filterToShotEditableSettingsGroups", () => {
  it("keeps settings a Shot can meaningfully override on its own", () => {
    const groups = [
      buildGroup([
        { key: "keep_background", ui: "CheckboxInput" },
        { key: "max_size", ui: "NumberInput" }
      ])
    ];

    const [group] = filterToShotEditableSettingsGroups(groups);

    expect(group.sections[0].settings.map((setting) => setting.key)).toEqual([
      "keep_background",
      "max_size"
    ]);
  });

  it("removes every image, frame and mask input, which the Shot owns elsewhere", () => {
    const groups = [
      buildGroup([
        { key: "source_image_slot", ui: "FileUploaderWithStylizeButton" },
        { key: "image_ids", ui: "MultiImageUploader" },
        { key: "reference_image_id", ui: "TwoAngleImageUploader" },
        { key: "image_id", ui: "SingleImageUploader" },
        { key: "input_mask", ui: "AppliedMaskTile" },
        { key: "keep_background", ui: "CheckboxInput" }
      ])
    ];

    const [group] = filterToShotEditableSettingsGroups(groups);

    expect(group.sections[0].settings.map((setting) => setting.key)).toEqual([
      "keep_background"
    ]);
  });

  it("removes prompt inputs, which the Shot card owns and stores separately", () => {
    const groups = [
      buildGroup([
        { key: "prompt", ui: "Prompt" },
        { key: "negative_prompt", ui: "Prompt" },
        { key: "mask_prompt", ui: "MaskPromptInput" },
        { key: "steps", ui: "SliderAndNumberInput" }
      ])
    ];

    const [group] = filterToShotEditableSettingsGroups(groups);

    expect(group.sections[0].settings.map((setting) => setting.key)).toEqual([
      "steps"
    ]);
  });

  it("drops a section once nothing in it remains", () => {
    const groups = [buildGroup([{ key: "prompt", ui: "Prompt" }])];

    expect(filterToShotEditableSettingsGroups(groups)).toEqual([]);
  });

  describe("against every real model's own settings definitions", () => {
    for (const model of RENDER_MODELS) {
      it(`never lets prompt or negative_prompt survive for ${model.name}`, () => {
        const filteredGroups = filterToShotEditableSettingsGroups(
          model.settingsGroups
        );

        const survivingKeys = filteredGroups.flatMap((group) =>
          group.sections.flatMap((section) =>
            section.settings.map((setting) => setting.key)
          )
        );

        expect(survivingKeys).not.toContain("prompt");
        expect(survivingKeys).not.toContain("negative_prompt");
      });
    }
  });
});

describe("collectShotEditableSettingKeys", () => {
  it("collects the key of every setting the panel renders", () => {
    const keys = collectShotEditableSettingKeys([
      buildGroup([
        { key: "steps", ui: "NumberInput" },
        { key: "max_size", ui: "NumberInput" }
      ])
    ]);

    expect([...keys].sort()).toEqual(["max_size", "steps"]);
  });

  it("collects both halves of a paired control, so Reset and error placement see the second key too", () => {
    const groups = [
      buildGroup([
        { key: "enable_warmup", ui: "CheckboxInput", secondKey: "warmup_size" }
      ] as unknown as Array<{ key: string; ui: string }>)
    ];

    const keys = collectShotEditableSettingKeys(groups);

    expect([...keys].sort()).toEqual(["enable_warmup", "warmup_size"]);
  });

  it("returns an empty set when every setting was filtered out", () => {
    expect(collectShotEditableSettingKeys([]).size).toBe(0);
  });
});
