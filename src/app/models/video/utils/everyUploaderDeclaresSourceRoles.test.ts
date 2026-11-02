import { parseSourceImageTypes } from "@domains/renders/utils/parseSourceImageTypes";
import { describe, expect, it } from "vitest";

import { RENDER_MODELS } from "../constants";

import { flattenSettingsGroups } from "./flattenSettingsGroups";

const SOURCE_WRITING_UI_COMPONENTS = [
  "FileUploaderWithStylizeButton",
  "MultiImageUploader",
  "TwoAngleImageUploader",
  "FrameAndMaskInput",
  "ModifyFrameInput"
];

const uploaderSettings = RENDER_MODELS.flatMap((model) =>
  flattenSettingsGroups(model).flatMap((section) =>
    section.settings
      .filter((setting) =>
        SOURCE_WRITING_UI_COMPONENTS.includes(setting.ui as string)
      )
      .map((setting) => ({ model: model.name, setting }))
  )
);

describe("every source-writing uploader declares its roles in the model file", () => {
  it("finds uploader settings to check", () => {
    expect(uploaderSettings.length).toBeGreaterThan(0);
  });

  it.each(uploaderSettings)(
    "$model / $setting.key declares a non-empty sourceRoles",
    ({ setting }) => {
      const declaredRoles = parseSourceImageTypes(
        setting.specificConfig?.sourceRoles
      );
      expect(declaredRoles.length).toBeGreaterThan(0);
    }
  );

  it("declares exactly two roles wherever a two-angle uploader is used", () => {
    const twoAngleSettings = uploaderSettings.filter(
      ({ setting }) => setting.ui === "TwoAngleImageUploader"
    );
    expect(twoAngleSettings.length).toBeGreaterThan(0);
    for (const { setting } of twoAngleSettings) {
      expect(
        parseSourceImageTypes(setting.specificConfig?.sourceRoles)
      ).toEqual(["element_reference", "element_frontal"]);
    }
  });

  it("marks exactly one primary source slot per model that has one", () => {
    for (const model of RENDER_MODELS) {
      const primarySlotCount = flattenSettingsGroups(model)
        .flatMap((section) => section.settings)
        .filter(
          (setting) => setting.specificConfig?.isPrimarySourceSlot === true
        ).length;
      expect(primarySlotCount).toBeLessThanOrEqual(1);
    }
  });
});
