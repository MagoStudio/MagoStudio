import { VideoEngine, VideoModelDefinition } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { buildBulkRenderingDraftShotVideoSettingsOverrides } from "./buildBulkRenderingDraftShotVideoSettingsOverrides";

const buildModelDeclaring = (settingKeys: string[]): VideoModelDefinition =>
  ({
    name: VideoEngine.V3_4_0,
    settingsGroups: [
      {
        name: "group",
        level: "main",
        sections: [
          {
            name: undefined,
            settings: settingKeys.map((key) => ({
              key,
              type: "number",
              label: key,
              ui: "NumberInput"
            }))
          }
        ]
      }
    ]
  }) as VideoModelDefinition;

const modelDeclaringStepsAndCfgScale = buildModelDeclaring([
  "steps",
  "cfg_scale"
]);

describe("buildBulkRenderingDraftShotVideoSettingsOverrides", () => {
  it("emits an override for a Shot with a touched setting its own model declares", () => {
    const overrides = buildBulkRenderingDraftShotVideoSettingsOverrides({
      videoSettingsByShotId: { "shot-1": { steps: 30 } },
      getShotCurrentVideoModelDefinition: () => modelDeclaringStepsAndCfgScale
    });

    expect(overrides).toEqual({ "shot-1": { steps: 30 } });
  });

  it("omits a Shot whose patch is empty", () => {
    const overrides = buildBulkRenderingDraftShotVideoSettingsOverrides({
      videoSettingsByShotId: { "shot-1": {} },
      getShotCurrentVideoModelDefinition: () => modelDeclaringStepsAndCfgScale
    });

    expect(overrides).toEqual({});
  });

  it("carries every touched key its model declares for one Shot, not only the first", () => {
    const overrides = buildBulkRenderingDraftShotVideoSettingsOverrides({
      videoSettingsByShotId: { "shot-1": { steps: 30, cfg_scale: 7 } },
      getShotCurrentVideoModelDefinition: () => modelDeclaringStepsAndCfgScale
    });

    expect(overrides).toEqual({ "shot-1": { steps: 30, cfg_scale: 7 } });
  });

  it("keeps Shots independent of each other", () => {
    const overrides = buildBulkRenderingDraftShotVideoSettingsOverrides({
      videoSettingsByShotId: {
        "shot-1": { steps: 30 },
        "shot-2": {}
      },
      getShotCurrentVideoModelDefinition: () => modelDeclaringStepsAndCfgScale
    });

    expect(Object.keys(overrides)).toEqual(["shot-1"]);
  });

  it("returns an empty record when nothing was touched", () => {
    const overrides = buildBulkRenderingDraftShotVideoSettingsOverrides({
      videoSettingsByShotId: {},
      getShotCurrentVideoModelDefinition: () => modelDeclaringStepsAndCfgScale
    });

    expect(overrides).toEqual({});
  });

  describe("stray keys from a model a Shot no longer uses", () => {
    it("drops a patch key the Shot's CURRENT model does not declare", () => {
      const overrides = buildBulkRenderingDraftShotVideoSettingsOverrides({
        videoSettingsByShotId: {
          "shot-1": { steps: 30, a_model_b_only_key: 1 }
        },
        getShotCurrentVideoModelDefinition: () => buildModelDeclaring(["steps"])
      });

      expect(overrides).toEqual({ "shot-1": { steps: 30 } });
    });

    it("omits the Shot entirely when every touched key belongs to a model it no longer uses — the exact switch-away-and-back scenario", () => {
      const overrides = buildBulkRenderingDraftShotVideoSettingsOverrides({
        videoSettingsByShotId: { "shot-1": { a_model_b_only_key: 1 } },
        getShotCurrentVideoModelDefinition: () => buildModelDeclaring(["steps"])
      });

      expect(overrides).toEqual({});
    });

    it("resolves each Shot against its OWN current model, not a shared one", () => {
      const overrides = buildBulkRenderingDraftShotVideoSettingsOverrides({
        videoSettingsByShotId: {
          "shot-1": { steps: 30 },
          "shot-2": { cfg_scale: 7 }
        },
        getShotCurrentVideoModelDefinition: (shotId) =>
          shotId === "shot-1"
            ? buildModelDeclaring(["steps"])
            : buildModelDeclaring(["cfg_scale"])
      });

      expect(overrides).toEqual({
        "shot-1": { steps: 30 },
        "shot-2": { cfg_scale: 7 }
      });
    });

    it("always keeps a touched prompt, even against a model declaring no settings at all", () => {
      const overrides = buildBulkRenderingDraftShotVideoSettingsOverrides({
        videoSettingsByShotId: { "shot-1": { prompt: "a different clip" } },
        getShotCurrentVideoModelDefinition: () => buildModelDeclaring([])
      });

      expect(overrides).toEqual({ "shot-1": { prompt: "a different clip" } });
    });
  });
});
