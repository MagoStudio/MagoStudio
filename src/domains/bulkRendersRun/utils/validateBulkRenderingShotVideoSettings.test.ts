import { seedance2Model } from "@models/video/seedance2Model";
import { VideoEngine, VideoModelDefinition } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { validateBulkRenderingShotVideoSettings } from "./validateBulkRenderingShotVideoSettings";

const buildModelWithOneNumberSetting = (
  overrides: Record<string, unknown> = {}
): VideoModelDefinition =>
  ({
    name: VideoEngine.V3_4_0,
    capabilities: {},
    displayName: "Test Model",
    description: "Test Description",
    type: "render",
    status: "active",
    modeAvailability: { isRelaxedModeAvailable: true },
    calcEstimatedRenderTime: () => ({ impactToShow: 0 }),
    renderDurationLimits: {
      defaultFrameRange: { defaultRender: 99, testRender: 48 },
      modelLimits: { minFrames: 8, maxFrames: 2000 }
    },
    settingsGroups: [
      {
        name: "Basic",
        level: "main",
        sections: [
          {
            name: undefined,
            settings: [
              {
                key: "cfg_scale",
                type: "number",
                label: "CFG scale",
                ui: "NumberInput",
                min: 0,
                max: 100,
                ...overrides
              }
            ]
          }
        ]
      }
    ]
  }) as unknown as VideoModelDefinition;

describe("validateBulkRenderingShotVideoSettings", () => {
  it("returns no errors when every required setting is present", () => {
    const errors = validateBulkRenderingShotVideoSettings(seedance2Model, {
      mago_engine: seedance2Model.name,
      prompt: "a valid prompt"
    });

    expect(errors).toEqual([]);
  });

  it("reports a required string setting left empty, using the model's own error message", () => {
    const errors = validateBulkRenderingShotVideoSettings(seedance2Model, {
      mago_engine: seedance2Model.name,
      prompt: ""
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "prompt",
          message: "You need to add a prompt"
        })
      ])
    );
  });

  it("reports a required string setting that is missing entirely", () => {
    const errors = validateBulkRenderingShotVideoSettings(seedance2Model, {
      mago_engine: seedance2Model.name
    });

    expect(errors.some((error) => error.key === "prompt")).toBe(true);
  });

  it("reports a required string setting left whitespace-only, not just fully empty", () => {
    const errors = validateBulkRenderingShotVideoSettings(seedance2Model, {
      mago_engine: seedance2Model.name,
      prompt: "   "
    });

    expect(errors.some((error) => error.key === "prompt")).toBe(true);
  });

  it("never reports a numeric setting whose value is exactly 0 as an error — the classic falsy trap", () => {
    const errors = validateBulkRenderingShotVideoSettings(
      buildModelWithOneNumberSetting(),
      { mago_engine: VideoEngine.V3_4_0, cfg_scale: 0 }
    );

    expect(errors).toEqual([]);
  });
});
