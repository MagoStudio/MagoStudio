import { VideoEngine, VideoModelDefinition } from "@models/video/types";
import { Layer } from "@schemas/layer";
import { describe, expect, it } from "vitest";

import { SAM_FRAME_NOT_IN_RANGE_ERROR_KEY } from "./getRenderValidationErrorKeys";
import {
  validateRenderPayload,
  ValidateRenderPayloadParams
} from "./validateRenderPayload";

const PROMPT_REQUIRED_ERROR_KEY = "notifications.prompt_required.description";

const makeModel = (
  overrides: Partial<VideoModelDefinition> = {}
): VideoModelDefinition =>
  ({
    name: VideoEngine.V4_0_0,
    displayName: "Test Model",
    settingsGroups: [
      {
        level: "main",
        sections: [
          {
            settings: [
              {
                key: "prompt",
                type: "string",
                nullable: false,
                errorMessage: PROMPT_REQUIRED_ERROR_KEY
              }
            ]
          }
        ]
      }
    ],
    calcEstimatedRenderTime: () => ({ impactToShow: 1 }),
    renderDurationLimits: {
      defaultFrameRange: { defaultRender: 100, testRender: 50 },
      modelLimits: { minFrames: 10, maxFrames: 300 }
    },
    ...overrides
  }) as unknown as VideoModelDefinition;

const makeMaskTrack = (offset: number, duration: number): Layer =>
  ({
    id: "mask-track",
    name: "mask",
    clips: [
      {
        id: "clip",
        asset_id: "asset",
        asset: { id: "asset", name: "", data: { duration } },
        data: { timeline_offset: offset }
      }
    ]
  }) as unknown as Layer;

const makeParams = (
  overrides: Partial<ValidateRenderPayloadParams> = {}
): ValidateRenderPayloadParams => ({
  model: makeModel(),
  renderSettingsValues: { prompt: "a horse in a field" },
  sources: [],
  fps: 24,
  isUnlimitedModeActive: false,
  inputVideoWidth: 1920,
  inputVideoHeight: 1080,
  imageDimensions: undefined,
  rangeFrames: [0, 100],
  durationLimits: {
    minFrames: 10,
    maxFrames: 300,
    modelHasTimeBasedDurationLimits: false
  },
  maskTrack: undefined,
  sourceTrackTimelineOffset: 0,
  crop: undefined,
  tracks: [],
  target: "range",
  ...overrides
});

describe("validateRenderPayload", () => {
  it("accepts a valid payload", () => {
    const result = validateRenderPayload(makeParams());
    expect(result.isRenderPayloadValid).toBe(true);
    expect(result.errorKeys).toEqual([]);
  });

  it("accepts an onboarding-shaped payload (short fixed range, credits mode)", () => {
    const result = validateRenderPayload(
      makeParams({
        renderSettingsValues: { prompt: "make it look like a painting" },
        rangeFrames: [0, 76]
      })
    );
    expect(result.isRenderPayloadValid).toBe(true);
  });

  it("rejects a payload failing schema validation", () => {
    const result = validateRenderPayload(
      makeParams({ renderSettingsValues: { prompt: "" } })
    );
    expect(result.isRenderPayloadValid).toBe(false);
    expect(result.errorKeys).toContain(PROMPT_REQUIRED_ERROR_KEY);
  });

  it("rejects a payload failing context validation", () => {
    const result = validateRenderPayload(
      makeParams({
        model: makeModel({
          validateContext: () => ({
            isRenderContextValid: false,
            errorKey: "notifications.fps_not_supported.description"
          })
        })
      })
    );
    expect(result.isRenderPayloadValid).toBe(false);
    expect(result.errorKeys).toContain(
      "notifications.fps_not_supported.description"
    );
  });

  it("rejects a payload outside the duration limits", () => {
    const result = validateRenderPayload(makeParams({ rangeFrames: [0, 4] }));
    expect(result.isRenderPayloadValid).toBe(false);
    expect(result.errorKeys).toContain(
      "range.no_interpolation_min_range.description"
    );
  });

  it("rejects an inpainting payload with a mask-range mismatch", () => {
    const result = validateRenderPayload(
      makeParams({
        model: makeModel({ name: VideoEngine.V5_1_0 }),
        renderSettingsValues: { prompt: "a horse", input_mask: "mask-track" },
        sources: [{ asset_id: "ref", type: "reference_frame" }],
        maskTrack: makeMaskTrack(150, 20)
      })
    );
    expect(result.isRenderPayloadValid).toBe(false);
    expect(result.errorKeys).toContain(
      "inpainting.mask_range_error.not_in_range.description"
    );
  });

  it("exempts a full-clip payload from the mask-range rule", () => {
    const result = validateRenderPayload(
      makeParams({
        model: makeModel({ name: VideoEngine.V5_1_0 }),
        renderSettingsValues: { prompt: "a horse", input_mask: "mask-track" },
        sources: [{ asset_id: "ref", type: "reference_frame" }],
        maskTrack: makeMaskTrack(150, 20),
        target: "fullClip"
      })
    );
    expect(result.isRenderPayloadValid).toBe(true);
  });

  it("rejects an inpainting payload missing image and mask", () => {
    const result = validateRenderPayload(
      makeParams({
        model: makeModel({ name: VideoEngine.V5_1_0 }),
        renderSettingsValues: { prompt: "a horse" }
      })
    );
    expect(result.isRenderPayloadValid).toBe(false);
    expect(result.errorKeys).toContain(
      "inpainting.generate_disabled.missing_both.label"
    );
  });

  it("rejects an inpainting payload missing only the mask", () => {
    const result = validateRenderPayload(
      makeParams({
        model: makeModel({ name: VideoEngine.V5_1_0 }),
        renderSettingsValues: { prompt: "a horse" },
        sources: [{ asset_id: "ref", type: "reference_frame" }]
      })
    );
    expect(result.isRenderPayloadValid).toBe(false);
    expect(result.errorKeys).toContain(
      "inpainting.generate_disabled.missing_mask.label"
    );
  });

  it("rejects an inpainting payload missing only the image", () => {
    const result = validateRenderPayload(
      makeParams({
        model: makeModel({ name: VideoEngine.V5_1_0 }),
        renderSettingsValues: { prompt: "a horse", input_mask: "mask-track" }
      })
    );
    expect(result.isRenderPayloadValid).toBe(false);
    expect(result.errorKeys).toContain(
      "inpainting.generate_disabled.missing_image.label"
    );
  });

  it("accepts an inpainting payload with a non-empty mask_prompt and no input_mask", () => {
    const result = validateRenderPayload(
      makeParams({
        model: makeModel({ name: VideoEngine.V5_1_0 }),
        renderSettingsValues: { prompt: "a horse", mask_prompt: "person" },
        sources: [{ asset_id: "ref", type: "reference_frame" }]
      })
    );
    expect(result.isRenderPayloadValid).toBe(true);
  });

  it("rejects an inpainting payload when mask_prompt is emptied back to ''", () => {
    const result = validateRenderPayload(
      makeParams({
        model: makeModel({ name: VideoEngine.V5_1_0 }),
        renderSettingsValues: { prompt: "a horse", mask_prompt: "" },
        sources: [{ asset_id: "ref", type: "reference_frame" }]
      })
    );
    expect(result.isRenderPayloadValid).toBe(false);
    expect(result.errorKeys).toContain(
      "inpainting.generate_disabled.missing_mask.label"
    );
  });

  it("rejects an inpainting payload when mask_prompt is whitespace-only", () => {
    const result = validateRenderPayload(
      makeParams({
        model: makeModel({ name: VideoEngine.V5_1_0 }),
        renderSettingsValues: { prompt: "a horse", mask_prompt: "   " },
        sources: [{ asset_id: "ref", type: "reference_frame" }]
      })
    );
    expect(result.isRenderPayloadValid).toBe(false);
    expect(result.errorKeys).toContain(
      "inpainting.generate_disabled.missing_mask.label"
    );
  });

  it("accepts an inpainting payload with input_mask and no mask_prompt", () => {
    const result = validateRenderPayload(
      makeParams({
        model: makeModel({ name: VideoEngine.V5_1_0 }),
        renderSettingsValues: {
          prompt: "a horse",
          input_mask: "mask-track",
          mask_prompt: ""
        },
        sources: [{ asset_id: "ref", type: "reference_frame" }]
      })
    );
    expect(result.isRenderPayloadValid).toBe(true);
  });

  it("applies the SAM points-frame rule to range submissions only", () => {
    const samParams = makeParams({
      model: makeModel({ name: VideoEngine.v1_0_0_mask }),
      renderSettingsValues: {
        prompt: "a horse",
        mask_mode: "visual_selection",
        mask_frame_idx: 150
      }
    });
    const rangeResult = validateRenderPayload(samParams);
    expect(rangeResult.isRenderPayloadValid).toBe(false);
    expect(rangeResult.errorKeys).toContain(SAM_FRAME_NOT_IN_RANGE_ERROR_KEY);

    const fullClipResult = validateRenderPayload({
      ...samParams,
      target: "fullClip"
    });
    expect(fullClipResult.isRenderPayloadValid).toBe(true);
  });

  it("adds the source-track timeline offset to the SAM points frame before the range check", () => {
    const base = makeParams({
      model: makeModel({ name: VideoEngine.v1_0_0_mask }),
      renderSettingsValues: {
        prompt: "a horse",
        mask_mode: "visual_selection",
        mask_frame_idx: 40
      },
      sourceTrackTimelineOffset: 70
    });

    const inRange = validateRenderPayload({ ...base, rangeFrames: [100, 200] });
    expect(inRange.errorKeys).not.toContain(SAM_FRAME_NOT_IN_RANGE_ERROR_KEY);

    const outOfRange = validateRenderPayload({
      ...base,
      rangeFrames: [0, 100]
    });
    expect(outOfRange.errorKeys).toContain(SAM_FRAME_NOT_IN_RANGE_ERROR_KEY);
  });
});
