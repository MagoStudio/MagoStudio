import { SettingsSection } from "@models/shared/types";
import { describe, expect, it } from "vitest";

import { RENDER_MODELS } from "./constants";
import { VideoModelDefinition } from "./types";
import { flattenSettingsGroups } from "./utils/flattenSettingsGroups";

const FACEMESH_BLENDING_SETTING_KEY = "enable_facemesh_blending";
const VIDEO_REFERENCE_TOGGLE_SETTING_KEY = "use_video_reference";

const CONTROL_TYPES = [
  "depth",
  "normal_map",
  "pose",
  "softedge",
  "pose_depth",
  "softedge_normal"
];

const modelHasFacemeshBlendingUiSetting = (
  model: VideoModelDefinition
): boolean =>
  flattenSettingsGroups(model).some((section) =>
    section.settings.some(
      (setting) => setting.key === FACEMESH_BLENDING_SETTING_KEY
    )
  );

const modelHasFacemeshBlendingWireDefault = (
  model: VideoModelDefinition
): boolean =>
  model.extraKeys !== undefined &&
  FACEMESH_BLENDING_SETTING_KEY in model.extraKeys;

const modelExposesFacemeshBlendingSetting = (
  model: VideoModelDefinition
): boolean =>
  modelHasFacemeshBlendingUiSetting(model) ||
  modelHasFacemeshBlendingWireDefault(model);

const modelExposesVideoReferenceToggleSetting = (
  model: VideoModelDefinition
): boolean =>
  flattenSettingsGroups(model).some((section) =>
    section.settings.some(
      (setting) => setting.key === VIDEO_REFERENCE_TOGGLE_SETTING_KEY
    )
  );

const engineNamesOf = (models: VideoModelDefinition[]): string[] =>
  models.map((model) => model.name);

describe("video model capability declarations", () => {
  describe("supportsFacemeshBlending", () => {
    const modelsExposingTheSetting = RENDER_MODELS.filter(
      modelExposesFacemeshBlendingSetting
    );

    it("has models to check, so an empty traversal cannot pass silently", () => {
      expect(modelsExposingTheSetting.length).toBeGreaterThan(0);
    });

    it("is declared by every model exposing the facemesh setting", () => {
      const modelsMissingTheDeclaration = modelsExposingTheSetting.filter(
        (model) => model.capabilities.supportsFacemeshBlending === undefined
      );

      expect(engineNamesOf(modelsMissingTheDeclaration)).toEqual([]);
    });

    it("is absent from every model that does not expose the facemesh setting", () => {
      const modelsWithAStaleDeclaration = RENDER_MODELS.filter(
        (model) =>
          !modelExposesFacemeshBlendingSetting(model) &&
          model.capabilities.supportsFacemeshBlending !== undefined
      );

      expect(engineNamesOf(modelsWithAStaleDeclaration)).toEqual([]);
    });
  });

  describe("supportsVideoReferenceToggle", () => {
    const modelsExposingTheSetting = RENDER_MODELS.filter(
      modelExposesVideoReferenceToggleSetting
    );

    it("has models to check, so an empty traversal cannot pass silently", () => {
      expect(modelsExposingTheSetting.length).toBeGreaterThan(0);
    });

    it("is declared by every model exposing the use_video_reference setting", () => {
      const modelsMissingTheDeclaration = modelsExposingTheSetting.filter(
        (model) => model.capabilities.supportsVideoReferenceToggle !== true
      );

      expect(engineNamesOf(modelsMissingTheDeclaration)).toEqual([]);
    });

    it("is absent from every model that does not expose the use_video_reference setting", () => {
      const modelsWithAStaleDeclaration = RENDER_MODELS.filter(
        (model) =>
          !modelExposesVideoReferenceToggleSetting(model) &&
          model.capabilities.supportsVideoReferenceToggle !== undefined
      );

      expect(engineNamesOf(modelsWithAStaleDeclaration)).toEqual([]);
    });
  });

  describe("isControlNetDetailSetting", () => {
    const sectionsVaryingWithControlType = (model: VideoModelDefinition) =>
      flattenSettingsGroups(model).filter((section) => {
        if (!section.hidingCondition) return false;

        const hidingResults = CONTROL_TYPES.map((controlType) =>
          section.hidingCondition?.({ control_type: controlType }, false)
        );

        return new Set(hidingResults).size > 1;
      });

    const describeSection = (
      model: VideoModelDefinition,
      section: SettingsSection
    ) =>
      `${model.name}: ${section.settings.map((setting) => setting.key).join(", ")}`;

    it("has control-type-dependent sections to check, so an empty traversal cannot pass silently", () => {
      const total = RENDER_MODELS.flatMap(
        sectionsVaryingWithControlType
      ).length;

      expect(total).toBeGreaterThan(0);
    });

    it("is declared by every section whose visibility depends on control_type", () => {
      const undeclaredSections = RENDER_MODELS.flatMap((model) =>
        sectionsVaryingWithControlType(model)
          .filter((section) => !section.isControlNetDetailSetting)
          .map((section) => describeSection(model, section))
      );

      expect(undeclaredSections).toEqual([]);
    });

    it("is absent from every section whose visibility does not depend on control_type", () => {
      const staleDeclarations = RENDER_MODELS.flatMap((model) => {
        const controlTypeDependent = new Set(
          sectionsVaryingWithControlType(model)
        );

        return flattenSettingsGroups(model)
          .filter(
            (section) =>
              section.isControlNetDetailSetting &&
              !controlTypeDependent.has(section)
          )
          .map((section) => describeSection(model, section));
      });

      expect(staleDeclarations).toEqual([]);
    });
  });
});
