import { VideoEngine, VideoModelDefinition } from "@models/video/types";
import { Layer } from "@schemas/layer";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  evaluateRenderSubmission,
  MODE_RESTRICTION_ERROR_KEY,
  RenderSubmissionInputs
} from "./evaluateRenderSubmission";
import {
  CROP_MISSING_INPUT_DIMENSIONS_ERROR_KEY,
  IMAGE_SOURCE_CROP_MISMATCH_ERROR_KEY,
  MASK_CROP_MISMATCH_ERROR_KEY,
  SAM_FRAME_NOT_IN_RANGE_ERROR_KEY
} from "./getRenderValidationErrorKeys";

const PROMPT_REQUIRED_ERROR_KEY = "notifications.prompt_required.description";
const CREDITS_PER_FRAME = 0.5;

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
    calcEstimatedRenderTime: (
      _settings: unknown,
      frameRangeLength: number
    ) => ({
      impactToShow: Math.ceil(frameRangeLength * CREDITS_PER_FRAME)
    }),
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

const makeInputs = (
  overrides: Partial<RenderSubmissionInputs> = {}
): RenderSubmissionInputs => ({
  model: makeModel(),
  renderSettingsValues: { prompt: "a horse in a field" },
  sources: [],
  fps: 24,
  isUnlimitedModeActive: false,
  inputVideoWidth: 1920,
  inputVideoHeight: 1080,
  imageDimensions: undefined,
  rangeFrames: [0, 100],
  fullClipRange: [0, 200],
  durationLimits: {
    minFrames: 10,
    maxFrames: 300,
    modelHasTimeBasedDurationLimits: false
  },
  maskTrack: undefined,
  sourceTrackTimelineOffset: 0,
  crop: undefined,
  tracks: [],
  isModelAllowedInMode: true,
  isRateLimited: false,
  isReferenceImageUploading: false,
  simultaneousVideoRendersLimit: 3,
  unlimitedCurrentGenerationCount: 0,
  userCredits: 1000,
  skipCreditCheck: false,
  isPaywallEligible: false,
  ...overrides
});

describe("evaluateRenderSubmission", () => {
  const perFrameModel = makeModel({
    calcEstimatedRenderTime: (_settings, frameRangeLength) => ({
      impactToShow: frameRangeLength
    })
  });

  it("estimates the full clip on the frames the source video has, as the submit clamps it", () => {
    const result = evaluateRenderSubmission(
      makeInputs({
        model: perFrameModel,
        fullClipRange: [0, 200],
        sourceVideoFrameCount: 200
      })
    );
    expect(result.fullClip.estimateCredits).toBe(200);
  });

  it("estimates a range running past the source video's last frame on the clamped range", () => {
    const result = evaluateRenderSubmission(
      makeInputs({
        model: perFrameModel,
        rangeFrames: [150, 260],
        sourceVideoFrameCount: 200
      })
    );
    expect(result.range.estimateCredits).toBe(50);
  });

  it("keeps the requested range when the source video's frame count is unknown", () => {
    const result = evaluateRenderSubmission(
      makeInputs({
        model: perFrameModel,
        fullClipRange: [0, 200],
        sourceVideoFrameCount: undefined
      })
    );
    expect(result.fullClip.estimateCredits).toBe(201);
  });

  it("estimates a clamped range on the duration the submit realigns to it", () => {
    const result = evaluateRenderSubmission(
      makeInputs({
        model: makeModel({
          calcEstimatedRenderTime: (settings) => ({
            impactToShow: Number(
              (settings as { durationInSeconds?: number }).durationInSeconds
            )
          })
        }),
        renderSettingsValues: {
          prompt: "a horse in a field",
          durationInSeconds: 10
        },
        fps: 24,
        fullClipRange: [0, 240],
        sourceVideoFrameCount: 120
      })
    );
    expect(result.fullClip.estimateCredits).toBe(5);
  });

  it("gates on the requested range even when the estimate is clamped", () => {
    const result = evaluateRenderSubmission(
      makeInputs({
        model: perFrameModel,
        fullClipRange: [0, 400],
        sourceVideoFrameCount: 200
      })
    );
    expect(result.fullClip.exceedsMaxRange).toBe(true);
    expect(result.fullClip.estimateCredits).toBe(200);
  });

  it("allows both targets when every rule passes", () => {
    const result = evaluateRenderSubmission(makeInputs());
    expect(result.range).toEqual({
      canSubmit: true,
      disabledReasonKey: undefined,
      estimateCredits: 51,
      hasEnoughCredits: true,
      isBlockedByCreditPaywall: false,
      exceedsMaxRange: false,
      maxRangeReasonKey: undefined
    });
    expect(result.fullClip).toEqual({
      canSubmit: true,
      disabledReasonKey: undefined,
      estimateCredits: 101,
      hasEnoughCredits: true,
      isBlockedByCreditPaywall: false,
      exceedsMaxRange: false,
      maxRangeReasonKey: undefined
    });
  });

  it("bills a two-frame range as two frames' worth of credits, not one", () => {
    const result = evaluateRenderSubmission(
      makeInputs({
        model: makeModel({
          calcEstimatedRenderTime: (_settings, frameRangeLength) => ({
            impactToShow: frameRangeLength
          })
        }),
        rangeFrames: [5, 6],
        durationLimits: {
          minFrames: 0,
          maxFrames: 300,
          modelHasTimeBasedDurationLimits: false
        }
      })
    );
    expect(result.range.estimateCredits).toBe(2);
  });

  it("reports exceedsMaxRange only for the full clip target, with the mode-appropriate reason", () => {
    const result = evaluateRenderSubmission(
      makeInputs({ fullClipRange: [0, 400] })
    );
    expect(result.fullClip.exceedsMaxRange).toBe(true);
    expect(result.fullClip.maxRangeReasonKey).toBe(
      "range.max_in_credits_mode.description"
    );
    expect(result.range.exceedsMaxRange).toBe(false);
    expect(result.range.maxRangeReasonKey).toBeUndefined();
  });

  it("does not report exceedsMaxRange when the render is blocked for an unrelated reason", () => {
    const result = evaluateRenderSubmission(
      makeInputs({ renderSettingsValues: { prompt: "" } })
    );
    expect(result.fullClip.canSubmit).toBe(false);
    expect(result.fullClip.exceedsMaxRange).toBe(false);
    expect(result.fullClip.maxRangeReasonKey).toBeUndefined();
  });

  it("blocks both targets on a schema error", () => {
    const result = evaluateRenderSubmission(
      makeInputs({ renderSettingsValues: { prompt: "" } })
    );
    expect(result.range.canSubmit).toBe(false);
    expect(result.range.disabledReasonKey).toBe(PROMPT_REQUIRED_ERROR_KEY);
    expect(result.fullClip.canSubmit).toBe(false);
    expect(result.fullClip.disabledReasonKey).toBe(PROMPT_REQUIRED_ERROR_KEY);
  });

  it("blocks both targets on a context validation error", () => {
    const result = evaluateRenderSubmission(
      makeInputs({
        model: makeModel({
          validateContext: () => ({
            isRenderContextValid: false,
            errorKey: "notifications.fps_not_supported.description"
          })
        })
      })
    );
    expect(result.range.disabledReasonKey).toBe(
      "notifications.fps_not_supported.description"
    );
    expect(result.fullClip.disabledReasonKey).toBe(
      "notifications.fps_not_supported.description"
    );
  });

  it("mode restriction wins over validation errors on both targets", () => {
    const result = evaluateRenderSubmission(
      makeInputs({
        isModelAllowedInMode: false,
        renderSettingsValues: { prompt: "" }
      })
    );
    expect(result.range.canSubmit).toBe(false);
    expect(result.range.disabledReasonKey).toBe(MODE_RESTRICTION_ERROR_KEY);
    expect(result.fullClip.canSubmit).toBe(false);
    expect(result.fullClip.disabledReasonKey).toBe(MODE_RESTRICTION_ERROR_KEY);
  });

  it("mode restriction wins over the full-clip max-range reason", () => {
    const result = evaluateRenderSubmission(
      makeInputs({ isModelAllowedInMode: false, fullClipRange: [0, 400] })
    );
    expect(result.fullClip.disabledReasonKey).toBe(MODE_RESTRICTION_ERROR_KEY);
  });

  it("full-clip max-range reason wins over validation errors", () => {
    const result = evaluateRenderSubmission(
      makeInputs({
        fullClipRange: [0, 400],
        renderSettingsValues: { prompt: "" }
      })
    );
    expect(result.fullClip.disabledReasonKey).toBe(
      "range.max_in_credits_mode.description"
    );
    expect(result.range.disabledReasonKey).toBe(PROMPT_REQUIRED_ERROR_KEY);
  });

  it("inpainting missing-image/mask reason wins over schema errors", () => {
    const result = evaluateRenderSubmission(
      makeInputs({
        model: makeModel({ name: VideoEngine.V5_1_0 }),
        renderSettingsValues: { prompt: "" }
      })
    );
    expect(result.range.disabledReasonKey).toBe(
      "inpainting.generate_disabled.missing_both.label"
    );
  });

  it("schema errors win over duration errors", () => {
    const result = evaluateRenderSubmission(
      makeInputs({
        renderSettingsValues: { prompt: "" },
        rangeFrames: [0, 5]
      })
    );
    expect(result.range.disabledReasonKey).toBe(PROMPT_REQUIRED_ERROR_KEY);
  });

  it("full clip exceeding max range blocks only the full clip target", () => {
    const result = evaluateRenderSubmission(
      makeInputs({ fullClipRange: [0, 400] })
    );
    expect(result.range.canSubmit).toBe(true);
    expect(result.fullClip.canSubmit).toBe(false);
    expect(result.fullClip.disabledReasonKey).toBe(
      "range.max_in_credits_mode.description"
    );
  });

  it("full clip max-range reason uses the relaxed-mode key in unlimited mode", () => {
    const result = evaluateRenderSubmission(
      makeInputs({ fullClipRange: [0, 400], isUnlimitedModeActive: true })
    );
    expect(result.fullClip.disabledReasonKey).toBe(
      "range.max_in_relaxed_mode.description"
    );
  });

  it("SAM points-frame outside the range blocks only the range target", () => {
    const result = evaluateRenderSubmission(
      makeInputs({
        model: makeModel({ name: VideoEngine.v1_0_0_mask }),
        renderSettingsValues: {
          prompt: "a horse",
          mask_mode: "visual_selection",
          mask_frame_idx: 150
        }
      })
    );
    expect(result.range.canSubmit).toBe(false);
    expect(result.range.disabledReasonKey).toBe(
      SAM_FRAME_NOT_IN_RANGE_ERROR_KEY
    );
    expect(result.fullClip.canSubmit).toBe(true);
    expect(result.fullClip.disabledReasonKey).toBeUndefined();
  });

  it("SAM points-frame inside the range blocks neither target", () => {
    const result = evaluateRenderSubmission(
      makeInputs({
        model: makeModel({ name: VideoEngine.v1_0_0_mask }),
        renderSettingsValues: {
          prompt: "a horse",
          mask_mode: "visual_selection",
          mask_frame_idx: 50
        }
      })
    );
    expect(result.range.canSubmit).toBe(true);
    expect(result.fullClip.canSubmit).toBe(true);
  });

  it("SAM points-frame on the range's last frame is inside the range", () => {
    const result = evaluateRenderSubmission(
      makeInputs({
        model: makeModel({ name: VideoEngine.v1_0_0_mask }),
        renderSettingsValues: {
          prompt: "a horse",
          mask_mode: "visual_selection",
          mask_frame_idx: 100
        }
      })
    );
    expect(result.range.canSubmit).toBe(true);
  });

  it("SAM points-frame one past the range's last frame is outside", () => {
    const result = evaluateRenderSubmission(
      makeInputs({
        model: makeModel({ name: VideoEngine.v1_0_0_mask }),
        renderSettingsValues: {
          prompt: "a horse",
          mask_mode: "visual_selection",
          mask_frame_idx: 101
        }
      })
    );
    expect(result.range.canSubmit).toBe(false);
    expect(result.range.disabledReasonKey).toBe(
      SAM_FRAME_NOT_IN_RANGE_ERROR_KEY
    );
  });

  it("SAM points-frame accounts for the source track timeline offset", () => {
    const result = evaluateRenderSubmission(
      makeInputs({
        model: makeModel({ name: VideoEngine.v1_0_0_mask }),
        renderSettingsValues: {
          prompt: "a horse",
          mask_mode: "visual_selection",
          mask_frame_idx: 50
        },
        sourceTrackTimelineOffset: 60
      })
    );
    expect(result.range.canSubmit).toBe(false);
    expect(result.range.disabledReasonKey).toBe(
      SAM_FRAME_NOT_IN_RANGE_ERROR_KEY
    );
  });

  it("mask-range mismatch blocks both targets for the inpainting model", () => {
    const result = evaluateRenderSubmission(
      makeInputs({
        model: makeModel({ name: VideoEngine.V5_1_0 }),
        renderSettingsValues: { prompt: "a horse", input_mask: "mask-track" },
        sources: [{ asset_id: "ref", type: "reference_frame" }],
        maskTrack: makeMaskTrack(150, 20)
      })
    );
    expect(result.range.canSubmit).toBe(false);
    expect(result.range.disabledReasonKey).toBe(
      "inpainting.mask_range_error.not_in_range.description"
    );
    expect(result.fullClip.canSubmit).toBe(false);
    expect(result.fullClip.disabledReasonKey).toBe(
      "inpainting.mask_range_error.not_in_range.description"
    );
  });

  it("inpainting model missing image and mask reports the combined reason", () => {
    const result = evaluateRenderSubmission(
      makeInputs({
        model: makeModel({ name: VideoEngine.V5_1_0 }),
        renderSettingsValues: { prompt: "a horse" }
      })
    );
    expect(result.range.disabledReasonKey).toBe(
      "inpainting.generate_disabled.missing_both.label"
    );
  });

  it("range shorter than the frame-based minimum blocks both targets", () => {
    const result = evaluateRenderSubmission(
      makeInputs({ rangeFrames: [0, 5] })
    );
    expect(result.range.disabledReasonKey).toBe(
      "range.no_interpolation_min_range.description"
    );
    expect(result.fullClip.disabledReasonKey).toBe(
      "range.no_interpolation_min_range.description"
    );
  });

  it("range exceeding the frame-based maximum blocks the range target", () => {
    const result = evaluateRenderSubmission(
      makeInputs({
        rangeFrames: [0, 350],
        fullClipRange: [0, 100]
      })
    );
    expect(result.range.disabledReasonKey).toBe(
      "range.max_in_credits_mode.description"
    );
  });

  it("uses seconds-based reason keys for time-based limits", () => {
    const timeBasedLimits = {
      minFrames: 24,
      maxFrames: 120,
      modelHasTimeBasedDurationLimits: true,
      minSeconds: 1,
      maxSeconds: 5
    };
    const tooShort = evaluateRenderSubmission(
      makeInputs({ durationLimits: timeBasedLimits, rangeFrames: [0, 10] })
    );
    expect(tooShort.range.disabledReasonKey).toBe(
      "range.min_duration_seconds.description"
    );
    const tooLong = evaluateRenderSubmission(
      makeInputs({
        durationLimits: timeBasedLimits,
        rangeFrames: [0, 150],
        fullClipRange: [0, 100]
      })
    );
    expect(tooLong.range.disabledReasonKey).toBe(
      "range.max_duration_seconds.description"
    );
  });

  it("rejects one frame over the maximum for time-based limits", () => {
    const result = evaluateRenderSubmission(
      makeInputs({
        durationLimits: {
          minFrames: 24,
          maxFrames: 120,
          modelHasTimeBasedDurationLimits: true,
          minSeconds: 1,
          maxSeconds: 5
        },
        rangeFrames: [0, 120],
        fullClipRange: [0, 100]
      })
    );
    expect(result.range.canSubmit).toBe(false);
    expect(result.range.disabledReasonKey).toBe(
      "range.max_duration_seconds.description"
    );
  });

  it("accepts a range exactly at the maximum for time-based limits", () => {
    const result = evaluateRenderSubmission(
      makeInputs({
        durationLimits: {
          minFrames: 24,
          maxFrames: 120,
          modelHasTimeBasedDurationLimits: true,
          minSeconds: 1,
          maxSeconds: 5
        },
        rangeFrames: [0, 119],
        fullClipRange: [0, 100]
      })
    );
    expect(result.range.canSubmit).toBe(true);
  });

  it("insufficient credits block submission without a reason key", () => {
    const result = evaluateRenderSubmission(makeInputs({ userCredits: 10 }));
    expect(result.range.canSubmit).toBe(false);
    expect(result.range.disabledReasonKey).toBeUndefined();
    expect(result.range.hasEnoughCredits).toBe(false);
    expect(result.fullClip.canSubmit).toBe(false);
  });

  it("credits gate applies per target", () => {
    const result = evaluateRenderSubmission(makeInputs({ userCredits: 60 }));
    expect(result.range.canSubmit).toBe(true);
    expect(result.range.hasEnoughCredits).toBe(true);
    expect(result.fullClip.canSubmit).toBe(false);
    expect(result.fullClip.hasEnoughCredits).toBe(false);
  });

  it("onboarding skips the credit gate but still reports low balance", () => {
    const result = evaluateRenderSubmission(
      makeInputs({ userCredits: 0, skipCreditCheck: true })
    );
    expect(result.range.canSubmit).toBe(true);
    expect(result.range.hasEnoughCredits).toBe(false);
    expect(result.fullClip.canSubmit).toBe(true);
  });

  it("rate limit blocks both targets without a reason key", () => {
    const result = evaluateRenderSubmission(
      makeInputs({ isRateLimited: true })
    );
    expect(result.range.canSubmit).toBe(false);
    expect(result.range.disabledReasonKey).toBeUndefined();
    expect(result.fullClip.canSubmit).toBe(false);
    expect(result.fullClip.disabledReasonKey).toBeUndefined();
  });

  it("reference image upload in progress blocks both targets without a reason key", () => {
    const result = evaluateRenderSubmission(
      makeInputs({ isReferenceImageUploading: true })
    );
    expect(result.range.canSubmit).toBe(false);
    expect(result.range.disabledReasonKey).toBeUndefined();
    expect(result.fullClip.canSubmit).toBe(false);
  });

  it("simultaneous renders limit blocks in unlimited mode only", () => {
    const atLimit = makeInputs({
      isUnlimitedModeActive: true,
      unlimitedCurrentGenerationCount: 3,
      simultaneousVideoRendersLimit: 3
    });
    const result = evaluateRenderSubmission(atLimit);
    expect(result.range.canSubmit).toBe(false);
    expect(result.range.disabledReasonKey).toBeUndefined();

    const creditsMode = evaluateRenderSubmission({
      ...atLimit,
      isUnlimitedModeActive: false
    });
    expect(creditsMode.range.canSubmit).toBe(true);
  });

  it("unlimited mode ignores the credit balance", () => {
    const result = evaluateRenderSubmission(
      makeInputs({ isUnlimitedModeActive: true, userCredits: 0 })
    );
    expect(result.range.canSubmit).toBe(true);
  });

  it("reports isBlockedByCreditPaywall for a no-subscription user blocked only by credits", () => {
    const result = evaluateRenderSubmission(
      makeInputs({ userCredits: 10, isPaywallEligible: true })
    );
    expect(result.range.canSubmit).toBe(false);
    expect(result.range.isBlockedByCreditPaywall).toBe(true);
    expect(result.fullClip.isBlockedByCreditPaywall).toBe(true);
  });

  it("does not report isBlockedByCreditPaywall for a subscribed user out of credits", () => {
    const result = evaluateRenderSubmission(
      makeInputs({ userCredits: 10, isPaywallEligible: false })
    );
    expect(result.range.canSubmit).toBe(false);
    expect(result.range.isBlockedByCreditPaywall).toBe(false);
  });

  it("does not report isBlockedByCreditPaywall when another rule blocks the target", () => {
    const result = evaluateRenderSubmission(
      makeInputs({
        userCredits: 10,
        isPaywallEligible: true,
        renderSettingsValues: { prompt: "" }
      })
    );
    expect(result.range.isBlockedByCreditPaywall).toBe(false);
    expect(result.range.disabledReasonKey).toBe(PROMPT_REQUIRED_ERROR_KEY);
  });

  it("does not report isBlockedByCreditPaywall when the user has enough credits", () => {
    const result = evaluateRenderSubmission(
      makeInputs({ userCredits: 1000, isPaywallEligible: true })
    );
    expect(result.range.canSubmit).toBe(true);
    expect(result.range.isBlockedByCreditPaywall).toBe(false);
  });
});

describe("evaluateRenderSubmission — crop gating", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const makeCroppedMaskTrack = (): Layer =>
    ({
      id: "mask-track",
      clips: [
        {
          data: {
            crop_coordinates: {
              top_left: [360, 0],
              bottom_right: [1920, 1080]
            },
            source_video_dimensions: [1920, 1080]
          }
        }
      ]
    }) as unknown as Layer;

  const makeUncroppedMaskTrack = (): Layer =>
    ({
      id: "mask-track",
      clips: [{ data: {} }]
    }) as unknown as Layer;

  it("blocks submission when a crop selection is active with an uncropped mask", () => {
    const result = evaluateRenderSubmission(
      makeInputs({
        crop: { x: 0.5, y: 0, width: 0.5, height: 1 },
        maskTrack: makeUncroppedMaskTrack()
      })
    );
    expect(result.range.canSubmit).toBe(false);
    expect(result.range.disabledReasonKey).toBe(MASK_CROP_MISMATCH_ERROR_KEY);
  });

  it("blocks submission when no crop is active but the mask stores one", () => {
    const result = evaluateRenderSubmission(
      makeInputs({
        maskTrack: makeCroppedMaskTrack()
      })
    );
    expect(result.range.canSubmit).toBe(false);
    expect(result.range.disabledReasonKey).toBe(MASK_CROP_MISMATCH_ERROR_KEY);
  });

  it("allows submission when the crop matches the mask's stored crop", () => {
    const result = evaluateRenderSubmission(
      makeInputs({
        crop: { x: 0.1875, y: 0, width: 0.8125, height: 1 },
        maskTrack: makeCroppedMaskTrack()
      })
    );
    expect(result.range.canSubmit).toBe(true);
  });

  it("allows submission when neither the render nor the mask is cropped", () => {
    const result = evaluateRenderSubmission(makeInputs());
    expect(result.range.canSubmit).toBe(true);
  });

  it("blocks submission when a crop is active but the input dimensions are unknown", () => {
    const result = evaluateRenderSubmission(
      makeInputs({
        crop: { x: 0.5, y: 0, width: 0.5, height: 1 },
        inputVideoWidth: undefined,
        inputVideoHeight: undefined
      })
    );
    expect(result.range.canSubmit).toBe(false);
    expect(result.range.disabledReasonKey).toBe(
      CROP_MISSING_INPUT_DIMENSIONS_ERROR_KEY
    );
  });

  it("blocks submission when the attached stylize frame was generated under a different crop", () => {
    const generatedTrack = {
      id: "generated-track",
      clips: [
        {
          asset_id: "generated-1",
          data: {
            crop_coordinates: { top_left: [0, 0], bottom_right: [960, 1080] },
            source_video_dimensions: [1920, 1080]
          }
        }
      ]
    } as unknown as Layer;

    const result = evaluateRenderSubmission(
      makeInputs({
        crop: { x: 0.5, y: 0, width: 0.5, height: 1 },
        sources: [{ asset_id: "generated-1", type: "reference_frame" }],
        tracks: [generatedTrack]
      })
    );
    expect(result.range.canSubmit).toBe(false);
    expect(result.range.disabledReasonKey).toBe(
      IMAGE_SOURCE_CROP_MISMATCH_ERROR_KEY
    );
  });

  it("never blocks on a plain uploaded stylize frame with no crop metadata", () => {
    const result = evaluateRenderSubmission(
      makeInputs({
        crop: { x: 0.5, y: 0, width: 0.5, height: 1 },
        sources: [{ asset_id: "uploaded-1", type: "reference_frame" }]
      })
    );
    expect(result.range.canSubmit).toBe(true);
  });

  it("does not gate crop mismatches for a non-crop-capable engine", () => {
    const result = evaluateRenderSubmission(
      makeInputs({
        model: makeModel({ name: "unknown_engine" as VideoEngine }),
        maskTrack: makeCroppedMaskTrack()
      })
    );
    expect(result.range.disabledReasonKey).not.toBe(
      MASK_CROP_MISMATCH_ERROR_KEY
    );
  });

  it("gates crop mismatches for a video model rendered locally", () => {
    vi.stubGlobal("window", { mago: { account: { mode: "local" } } });
    const result = evaluateRenderSubmission(
      makeInputs({
        model: makeModel({ name: VideoEngine.wan_animate_2_2 }),
        maskTrack: makeCroppedMaskTrack()
      })
    );
    expect(result.range.disabledReasonKey).toBe(MASK_CROP_MISMATCH_ERROR_KEY);
  });

  it("does not gate crop mismatches for a third-party model rendered on Mago cloud", () => {
    const result = evaluateRenderSubmission(
      makeInputs({
        model: makeModel({ name: VideoEngine.kling_o1 }),
        maskTrack: makeCroppedMaskTrack()
      })
    );
    expect(result.range.disabledReasonKey).not.toBe(
      MASK_CROP_MISMATCH_ERROR_KEY
    );
  });
});
