import { describe, it, expect } from "vitest";

import { extractDefaultVideoSettings } from "./extractDefaultVideoSettings";
import { VideoModelDefinition, VideoEngine } from "./types";

describe("extractDefaultVideoSettings", () => {
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

  it("should return an empty object when model is undefined", () => {
    const result = extractDefaultVideoSettings(undefined);
    expect(result).toEqual({});
  });

  it("should extract default values from all settings", () => {
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

    const result = extractDefaultVideoSettings(model);
    expect(result.prompt).toBe("test prompt");
    expect(result.steps).toBe(8);
  });

  it("should handle settings with secondKey", () => {
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

    const result = extractDefaultVideoSettings(model);
    expect(result.primary_key).toBe("primary value");
    expect(result.secondary_key).toBe("secondary value");
  });

  it("should respect section hidingCondition and extract only visible section defaults", () => {
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
                  key: "firstframe_control_strength",
                  type: "number",
                  label: "Strength",
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
                  key: "firstframe_control_strength",
                  type: "number",
                  label: "Strength",
                  ui: "SliderAndNumberInput",
                  defaultValue: 0.7
                }
              ]
            }
          ]
        }
      ]
    });

    const result = extractDefaultVideoSettings(model, false);
    expect(result.control_type).toBe("depth");
    expect(result.firstframe_control_strength).toBe(1);
  });

  it("should respect setting hidingCondition and extract only visible setting defaults", () => {
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

    const result = extractDefaultVideoSettings(model, false);
    expect(result.enable_feature).toBe(false);
    expect(result.feature_strength).toBe(0.5);
  });

  it("should apply extraKeys from model definition", () => {
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
      ],
      extraKeys: {
        custom_key: "custom_value",
        another_key: 42
      }
    });

    const result = extractDefaultVideoSettings(model, false);
    expect(result.steps).toBe(8);
    expect(result.custom_key).toBe("custom_value");
    expect(result.another_key).toBe(42);
  });

  it("should handle team-only settings when isTeamMember is false", () => {
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

    const result = extractDefaultVideoSettings(model, false);
    expect(result.team_only_feature).toBe(true);
    expect(result.public_feature).toBe(true);
  });

  it("should handle team-only settings when isTeamMember is true", () => {
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
            }
          ]
        }
      ]
    });

    const result = extractDefaultVideoSettings(model, true);
    expect(result.team_only_feature).toBe(true);
  });

  it("should handle complex conditional defaults with pose_depth controlnet", () => {
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
                  key: "firstframe_control_strength",
                  type: "number",
                  label: "Depth Strength",
                  ui: "SliderAndNumberInput",
                  defaultValue: 1
                }
              ]
            },
            {
              name: "Pose+Depth Settings",
              hidingCondition: (settings) =>
                settings.control_type !== "pose_depth",
              settings: [
                {
                  key: "pose_depth_control_strength",
                  type: "number",
                  label: "Pose Strength",
                  ui: "SliderAndNumberInput",
                  defaultValue: 0.5
                },
                {
                  key: "firstframe_control_strength",
                  type: "number",
                  label: "Depth Strength",
                  ui: "SliderAndNumberInput",
                  defaultValue: 0.5
                }
              ]
            }
          ]
        }
      ]
    });

    const result = extractDefaultVideoSettings(model, false);
    expect(result.control_type).toBe("pose_depth");
    expect(result.pose_depth_control_strength).toBe(0.5);
    expect(result.firstframe_control_strength).toBe(0.5);
  });

  it("should preserve base keys even when no tabs are present", () => {
    const model = createMockModel({
      settingsGroups: []
    });

    const result = extractDefaultVideoSettings(model, false);
    expect(result).toHaveProperty("input_image");
    expect(result.input_image).toBeUndefined();
    expect(result).toHaveProperty("mago_engine");
  });
});
