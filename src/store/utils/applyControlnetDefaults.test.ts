import { SettingsGroup } from "@models/shared/types";
import { extractDefaultVideoSettings } from "@models/video/extractDefaultVideoSettings";
import { magoV3_4_0RenderModel } from "@models/video/magoV3_4_0VideoModel";
import { VideoSettings } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { applyControlnetDefaults } from "./applyControlnetDefaults";

describe("applyControlnetDefaults", () => {
  const baseValues = extractDefaultVideoSettings(
    magoV3_4_0RenderModel
  ) as VideoSettings;

  it("selecting depth applies depth resolution and strength defaults", () => {
    const result = applyControlnetDefaults(
      magoV3_4_0RenderModel,
      baseValues,
      "depth"
    );
    expect(result.cn_depth_resolution).toBe(1280);
    expect(result.firstframe_control_strength).toBe(1);
  });

  it("selecting pose applies pose resolution and strength defaults", () => {
    const result = applyControlnetDefaults(
      magoV3_4_0RenderModel,
      baseValues,
      "pose"
    );
    expect(result.cn_pose_resolution).toBe(1280);
    expect(result.firstframe_control_strength).toBe(1);
  });

  it("selecting pose_depth applies pose_depth resolution, pose strength, and control strength defaults", () => {
    const result = applyControlnetDefaults(
      magoV3_4_0RenderModel,
      baseValues,
      "pose_depth"
    );
    expect(result.cn_pose_depth_resolution).toBe(1280);
    expect(result.pose_depth_control_strength).toBe(0.5);
    expect(result.firstframe_control_strength).toBe(0.5);
  });

  it("selecting normal_map applies normal map resolution and strength defaults", () => {
    const result = applyControlnetDefaults(
      magoV3_4_0RenderModel,
      baseValues,
      "normal_map"
    );
    expect(result.cn_normal_map_resolution).toBe(512);
    expect(result.firstframe_control_strength).toBe(1);
  });

  it("selecting softedge applies softedge resolution and strength defaults", () => {
    const result = applyControlnetDefaults(
      magoV3_4_0RenderModel,
      baseValues,
      "softedge"
    );
    expect(result.cn_softedge_resolution).toBe(1280);
    expect(result.firstframe_control_strength).toBe(1);
  });

  it("does not mutate the values object passed in", () => {
    const original = { ...baseValues };
    applyControlnetDefaults(magoV3_4_0RenderModel, baseValues, "depth");
    expect(baseValues).toEqual(original);
  });

  it("leaves unrelated keys untouched", () => {
    const withPrompt = { ...baseValues, prompt: "a custom prompt" };
    const result = applyControlnetDefaults(
      magoV3_4_0RenderModel,
      withPrompt,
      "depth"
    );
    expect(result.prompt).toBe("a custom prompt");
  });

  it("resets the selected control type's section to defaults", () => {
    const currentValues = {
      ...baseValues,
      cn_depth_resolution: 64
    };
    const result = applyControlnetDefaults(
      magoV3_4_0RenderModel,
      currentValues,
      "depth"
    );
    expect(result.cn_depth_resolution).toBe(1280);
  });

  it("does not reset another control type's section", () => {
    const currentValues = {
      ...baseValues,
      cn_pose_resolution: 64
    };
    const result = applyControlnetDefaults(
      magoV3_4_0RenderModel,
      currentValues,
      "depth"
    );
    expect(result.cn_pose_resolution).toBe(64);
  });

  it("never resets a team-gated section, even if its hidingCondition would otherwise show it", () => {
    const model = {
      settingsGroups: [
        {
          name: "Technical",
          level: "technical",
          sections: [
            {
              name: undefined,
              settings: [
                {
                  key: "control_type",
                  type: "enum",
                  label: "Control type",
                  ui: "SelectInput",
                  options: [{ value: "depth", label: "Depth" }],
                  defaultValue: "depth"
                }
              ]
            },
            {
              name: "Warm up settings",
              hidingCondition: () => false,
              settings: [
                {
                  key: "enable_warm_up",
                  type: "boolean",
                  label: "Enable warmup",
                  ui: "CheckboxInput",
                  defaultValue: true
                }
              ]
            }
          ]
        }
      ] satisfies SettingsGroup[]
    };

    const currentValues = {
      enable_warm_up: false
    } as unknown as VideoSettings;

    const result = applyControlnetDefaults(model, currentValues, "depth");

    expect(result.enable_warm_up).toBe(false);
  });

  it("does not reset a section gated on a non-control_type key when control_type changes", () => {
    const model = {
      settingsGroups: [
        {
          name: "Technical",
          level: "technical",
          sections: [
            {
              name: undefined,
              settings: [
                {
                  key: "control_type",
                  type: "enum",
                  label: "Control type",
                  ui: "SelectInput",
                  options: [{ value: "depth", label: "Depth" }],
                  defaultValue: "depth"
                }
              ]
            },
            {
              name: undefined,
              hidingCondition: (settings: Record<string, unknown>) =>
                settings.skip_cnet_preprocess === true,
              settings: [
                {
                  key: "cn_depth_resolution",
                  type: "number",
                  label: "Depth resolution",
                  ui: "NumberInput",
                  defaultValue: 1280
                }
              ]
            }
          ]
        }
      ] satisfies SettingsGroup[]
    };

    const currentValues = {
      skip_cnet_preprocess: true,
      cn_depth_resolution: 999
    } as unknown as VideoSettings;

    const result = applyControlnetDefaults(model, currentValues, "depth");

    expect(result.cn_depth_resolution).toBe(999);
  });
});
