import { magoV5_0_0RenderModel } from "@models/video/magoV5_0_0VideoModel";
import { VideoEngine, VideoModelDefinition } from "@models/video/types";
import { describe, it, expect } from "vitest";

import { getDisplayableRenderSettingKeys } from "./getDisplayableRenderSettingKeys";

describe("getDisplayableRenderSettingKeys", () => {
  const createMockModel = (
    overrides?: Partial<VideoModelDefinition>
  ): VideoModelDefinition => ({
    name: VideoEngine.V3_4_0,
    capabilities: {},
    displayName: "Test Model",
    description: "Test Description",
    type: "render",
    status: "active",
    modeAvailability: {
      isRelaxedModeAvailable: true
    },
    calcEstimatedRenderTime: () => ({ impactToShow: 0 }),
    renderDurationLimits: {
      defaultFrameRange: { defaultRender: 99, testRender: 48 },
      modelLimits: {
        minFrames: 8,
        maxFrames: 2000,
        interpolationMinFrames: 24,
        interpolationMaxFrames: 2000
      }
    },
    settingsGroups: [],
    ...overrides
  });

  it("should return empty object when model has no tabs", () => {
    const model = createMockModel({ settingsGroups: [] });
    const result = getDisplayableRenderSettingKeys({
      renderSettings: {},
      model,
      isTeamMember: false
    });
    expect(result).toEqual({});
  });

  it("should return empty object when renderSettings is undefined", () => {
    const model = createMockModel({ settingsGroups: [] });
    const result = getDisplayableRenderSettingKeys({
      renderSettings: undefined,
      model,
      isTeamMember: false
    });
    expect(result).toEqual({});
  });

  it("should return all settings when no hiding conditions are present", () => {
    const model = createMockModel({
      settingsGroups: [
        {
          name: "Basic",
          level: "main",
          sections: [
            {
              name: "Settings",
              settings: [
                {
                  key: "prompt",
                  type: "string",
                  label: "Prompt",
                  ui: "Prompt",
                  defaultValue: "test prompt"
                },
                {
                  key: "steps",
                  type: "number",
                  label: "Steps",
                  ui: "NumberInput",
                  defaultValue: 8
                }
              ]
            }
          ]
        }
      ]
    });

    const result = getDisplayableRenderSettingKeys({
      renderSettings: { prompt: "my prompt", steps: 10 },
      model,
      isTeamMember: false
    });
    expect(result).toEqual({ prompt: "my prompt", steps: 10 });
  });

  it("should include both key and secondKey for settings with dual values", () => {
    const model = createMockModel({
      settingsGroups: [
        {
          name: "Basic",
          level: "main",
          sections: [
            {
              name: "Settings",
              settings: [
                {
                  key: "primary_key",
                  secondKey: "secondary_key",
                  type: "string",
                  label: "Test",
                  ui: "TextInput",
                  defaultValue: "primary value",
                  secondDefaultValue: "secondary value"
                }
              ]
            }
          ]
        }
      ]
    });

    const result = getDisplayableRenderSettingKeys({
      renderSettings: { primary_key: "val1", secondary_key: "val2" },
      model,
      isTeamMember: false
    });
    expect(result).toEqual({ primary_key: "val1", secondary_key: "val2" });
  });

  it("should exclude settings from hidden sections based on control_type", () => {
    const model = createMockModel({
      settingsGroups: [
        {
          name: "Controlnets",
          level: "main",
          sections: [
            {
              name: "Type",
              settings: [
                {
                  key: "control_type",
                  type: "enum",
                  label: "Control Type",
                  ui: "SelectInput",
                  defaultValue: "depth",
                  options: [
                    { value: "depth", label: "Depth" },
                    { value: "pose", label: "Pose" }
                  ]
                }
              ]
            },
            {
              name: "Depth Settings",
              hidingCondition: (settings) => settings.control_type !== "depth",
              settings: [
                {
                  key: "cn_depth_strength",
                  type: "number",
                  label: "Depth Strength",
                  ui: "SliderAndNumberInput",
                  defaultValue: 1
                }
              ]
            },
            {
              name: "Pose Settings",
              hidingCondition: (settings) => settings.control_type !== "pose",
              settings: [
                {
                  key: "cn_pose_strength",
                  type: "number",
                  label: "Pose Strength",
                  ui: "SliderAndNumberInput",
                  defaultValue: 0.7
                }
              ]
            }
          ]
        }
      ]
    });

    const resultDepth = getDisplayableRenderSettingKeys({
      renderSettings: {
        control_type: "depth",
        cn_depth_strength: 0.8,
        cn_pose_strength: 0.5
      },
      model,
      isTeamMember: false
    });
    expect(resultDepth).toEqual({
      control_type: "depth",
      cn_depth_strength: 0.8
    });
    expect(resultDepth).not.toHaveProperty("cn_pose_strength");

    const resultPose = getDisplayableRenderSettingKeys({
      renderSettings: {
        control_type: "pose",
        cn_depth_strength: 0.8,
        cn_pose_strength: 0.5
      },
      model,
      isTeamMember: false
    });
    expect(resultPose).toEqual({
      control_type: "pose",
      cn_pose_strength: 0.5
    });
    expect(resultPose).not.toHaveProperty("cn_depth_strength");
  });

  it("should exclude settings based on hidingCondition", () => {
    const model = createMockModel({
      settingsGroups: [
        {
          name: "Advanced",
          level: "main",
          sections: [
            {
              name: "Settings",
              settings: [
                {
                  key: "enable_feature",
                  type: "boolean",
                  label: "Enable Feature",
                  ui: "CheckboxInput",
                  defaultValue: false
                },
                {
                  key: "feature_strength",
                  type: "number",
                  label: "Feature Strength",
                  ui: "SliderAndNumberInput",
                  defaultValue: 0.5,
                  hidingCondition: (settings) => !settings.enable_feature
                }
              ]
            }
          ]
        }
      ]
    });

    const resultDisabled = getDisplayableRenderSettingKeys({
      renderSettings: { enable_feature: false, feature_strength: 0.5 },
      model,
      isTeamMember: false
    });
    expect(resultDisabled).toEqual({ enable_feature: false });
    expect(resultDisabled).not.toHaveProperty("feature_strength");

    const resultEnabled = getDisplayableRenderSettingKeys({
      renderSettings: { enable_feature: true, feature_strength: 0.5 },
      model,
      isTeamMember: false
    });
    expect(resultEnabled).toEqual({
      enable_feature: true,
      feature_strength: 0.5
    });
  });

  it("should respect team-only section hiding when user is not a team member", () => {
    const model = createMockModel({
      settingsGroups: [
        {
          name: "Advanced",
          level: "main",
          sections: [
            {
              name: "Team Settings",
              hidingCondition: (_, isTeamMember) => !isTeamMember,
              settings: [
                {
                  key: "team_only_feature",
                  type: "boolean",
                  label: "Team Feature",
                  ui: "CheckboxInput",
                  defaultValue: true
                }
              ]
            },
            {
              name: "Public Settings",
              settings: [
                {
                  key: "public_feature",
                  type: "boolean",
                  label: "Public Feature",
                  ui: "CheckboxInput",
                  defaultValue: true
                }
              ]
            }
          ]
        }
      ]
    });

    const resultNonTeam = getDisplayableRenderSettingKeys({
      renderSettings: { team_only_feature: true, public_feature: true },
      model,
      isTeamMember: false
    });
    expect(resultNonTeam).toEqual({ public_feature: true });
    expect(resultNonTeam).not.toHaveProperty("team_only_feature");

    const resultTeam = getDisplayableRenderSettingKeys({
      renderSettings: { team_only_feature: true, public_feature: true },
      model,
      isTeamMember: true
    });
    expect(resultTeam).toEqual({
      team_only_feature: true,
      public_feature: true
    });
  });

  it("should handle image influence sections hidden when no image source", () => {
    const model = createMockModel({
      settingsGroups: [
        {
          name: "Advanced",
          level: "main",
          sections: [
            {
              name: "Image Source",
              settings: [
                {
                  key: "source_image_slot",
                  type: "string",
                  label: "Image Source",
                  ui: "FileUploaderWithStylizeButton",
                  defaultValue: undefined
                }
              ]
            },
            {
              name: "Image Influence",
              hidingCondition: (settings) => !settings.source_image_slot,
              settings: [
                {
                  key: "image_weight",
                  type: "number",
                  label: "Image Weight",
                  ui: "SliderAndNumberInput",
                  defaultValue: 0.8
                },
                {
                  key: "weight_type",
                  type: "enum",
                  label: "Weight Type",
                  ui: "SelectInput",
                  defaultValue: "linear",
                  options: [{ value: "linear", label: "Linear" }]
                }
              ]
            }
          ]
        }
      ]
    });

    const resultNoImage = getDisplayableRenderSettingKeys({
      renderSettings: {
        source_image_slot: undefined,
        image_weight: 0.8,
        weight_type: "linear"
      },
      model,
      isTeamMember: false
    });
    expect(resultNoImage).toEqual({ source_image_slot: undefined });
    expect(resultNoImage).not.toHaveProperty("image_weight");
    expect(resultNoImage).not.toHaveProperty("weight_type");

    const resultWithImage = getDisplayableRenderSettingKeys({
      renderSettings: {
        source_image_slot: "asset-123",
        image_weight: 0.8,
        weight_type: "linear"
      },
      model,
      isTeamMember: false
    });
    expect(resultWithImage).toEqual({
      source_image_slot: "asset-123",
      image_weight: 0.8,
      weight_type: "linear"
    });
  });

  it("should handle complex multi-control type scenarios", () => {
    const model = createMockModel({
      settingsGroups: [
        {
          name: "Controlnets",
          level: "main",
          sections: [
            {
              name: "Type",
              settings: [
                {
                  key: "control_type",
                  type: "enum",
                  label: "Control Type",
                  ui: "SelectInput",
                  defaultValue: "pose_depth",
                  options: [
                    { value: "depth", label: "Depth" },
                    { value: "pose", label: "Pose" },
                    { value: "pose_depth", label: "Pose+Depth" }
                  ]
                }
              ]
            },
            {
              name: "Depth Settings",
              hidingCondition: (settings) => settings.control_type !== "depth",
              settings: [
                {
                  key: "cn_depth_strength",
                  type: "number",
                  label: "Depth Strength",
                  ui: "SliderAndNumberInput",
                  defaultValue: 1
                }
              ]
            },
            {
              name: "Pose Settings",
              hidingCondition: (settings) => settings.control_type !== "pose",
              settings: [
                {
                  key: "cn_pose_strength",
                  type: "number",
                  label: "Pose Strength",
                  ui: "SliderAndNumberInput",
                  defaultValue: 0.7
                }
              ]
            },
            {
              name: "Pose+Depth Settings",
              hidingCondition: (settings) =>
                settings.control_type !== "pose_depth",
              settings: [
                {
                  key: "cn_pose_depth_strength",
                  type: "number",
                  label: "Combined Strength",
                  ui: "SliderAndNumberInput",
                  defaultValue: 0.5
                },
                {
                  key: "cn_pose_ratio",
                  type: "number",
                  label: "Pose Ratio",
                  ui: "SliderAndNumberInput",
                  defaultValue: 0.5
                }
              ]
            }
          ]
        }
      ]
    });

    const result = getDisplayableRenderSettingKeys({
      renderSettings: {
        control_type: "pose_depth",
        cn_depth_strength: 0.8,
        cn_pose_strength: 0.7,
        cn_pose_depth_strength: 0.6,
        cn_pose_ratio: 0.4
      },
      model,
      isTeamMember: false
    });
    expect(result).toEqual({
      control_type: "pose_depth",
      cn_pose_depth_strength: 0.6,
      cn_pose_ratio: 0.4
    });
    expect(result).not.toHaveProperty("cn_depth_strength");
    expect(result).not.toHaveProperty("cn_pose_strength");
  });

  it("should handle multiple tabs with mixed visibility", () => {
    const model = createMockModel({
      settingsGroups: [
        {
          name: "Basic",
          level: "main",
          sections: [
            {
              name: "Always Visible",
              settings: [
                {
                  key: "prompt",
                  type: "string",
                  label: "Prompt",
                  ui: "Prompt",
                  defaultValue: "test"
                }
              ]
            }
          ]
        },
        {
          name: "Advanced",
          level: "main",
          sections: [
            {
              name: "Conditional",
              hidingCondition: (settings) => !settings.advanced_mode,
              settings: [
                {
                  key: "advanced_setting",
                  type: "number",
                  label: "Advanced",
                  ui: "NumberInput",
                  defaultValue: 10
                }
              ]
            }
          ]
        }
      ]
    });

    const resultBasic = getDisplayableRenderSettingKeys({
      renderSettings: {
        prompt: "my prompt",
        advanced_mode: false,
        advanced_setting: 10
      },
      model,
      isTeamMember: false
    });
    expect(resultBasic).toEqual({ prompt: "my prompt" });

    const resultAdvanced = getDisplayableRenderSettingKeys({
      renderSettings: {
        prompt: "my prompt",
        advanced_mode: true,
        advanced_setting: 10
      },
      model,
      isTeamMember: false
    });
    expect(resultAdvanced).toEqual({
      prompt: "my prompt",
      advanced_setting: 10
    });
  });

  it("should not include settings that are not in renderSettings", () => {
    const model = createMockModel({
      settingsGroups: [
        {
          name: "Basic",
          level: "main",
          sections: [
            {
              name: "Settings",
              settings: [
                {
                  key: "prompt",
                  type: "string",
                  label: "Prompt",
                  ui: "Prompt"
                },
                {
                  key: "steps",
                  type: "number",
                  label: "Steps",
                  ui: "NumberInput"
                }
              ]
            }
          ]
        }
      ]
    });

    const result = getDisplayableRenderSettingKeys({
      renderSettings: { prompt: "my prompt" },
      model,
      isTeamMember: false
    });
    expect(result).toEqual({ prompt: "my prompt" });
    expect(result).not.toHaveProperty("steps");
  });

  it("Mago V5.0.0: drops retired LoRA keys and custom_loras from a stored render for the reuse-settings flow", () => {
    const result = getDisplayableRenderSettingKeys({
      renderSettings: {
        steps: 4,
        lora_1: 0.7,
        lora_weight_1: 0.3,
        custom_loras: [{ lora_name: "any_lora", lora_strength: 0.9 }]
      } as never,
      model: magoV5_0_0RenderModel,
      isTeamMember: true
    });

    expect(result).not.toHaveProperty("lora_1");
    expect(result).not.toHaveProperty("lora_weight_1");
    expect(result).not.toHaveProperty("custom_loras");
  });
});
