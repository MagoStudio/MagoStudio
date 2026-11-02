import { alignFrameRangeDerivedSettings } from "@domains/cloud/alignFrameRangeDerivedSettings";
import { clampFrameRange } from "@domains/cloud/clampFrameRange";

import { getFrameRangeLength } from "./getFrameRangeLength";
import {
  getRenderValidationErrorKeys,
  RenderValidationInputs,
  SAM_FRAME_NOT_IN_RANGE_ERROR_KEY
} from "./getRenderValidationErrorKeys";

export const MODE_RESTRICTION_ERROR_KEY =
  "notifications.payment_flow_relaxed_mode_model_restriction.description";

const SKIP_CN_COUNT = true;

export interface RenderSubmissionInputs extends RenderValidationInputs {
  fullClipRange: [number, number];
  isModelAllowedInMode: boolean;
  isRateLimited: boolean;
  isReferenceImageUploading: boolean;
  simultaneousVideoRendersLimit: number;
  unlimitedCurrentGenerationCount: number;
  userCredits: number;
  skipCreditCheck: boolean;
  isPaywallEligible: boolean;
  sourceVideoFrameCount?: number;
}

export interface RenderSubmissionTargetState {
  canSubmit: boolean;
  disabledReasonKey: string | undefined;
  estimateCredits: number;
  hasEnoughCredits: boolean;
  isBlockedByCreditPaywall: boolean;
  exceedsMaxRange: boolean;
  maxRangeReasonKey: string | undefined;
}

export interface RenderSubmissionResult {
  range: RenderSubmissionTargetState;
  fullClip: RenderSubmissionTargetState;
}

const passesNonCreditEnvironmentGates = (
  inputs: RenderSubmissionInputs
): boolean => {
  if (inputs.isRateLimited) return false;
  if (inputs.isReferenceImageUploading) return false;
  if (
    inputs.isUnlimitedModeActive &&
    inputs.unlimitedCurrentGenerationCount >=
      inputs.simultaneousVideoRendersLimit
  ) {
    return false;
  }
  return true;
};

const passesCreditGate = (
  inputs: RenderSubmissionInputs,
  requiredCredits: number
): boolean =>
  inputs.skipCreditCheck ||
  inputs.isUnlimitedModeActive ||
  inputs.userCredits >= requiredCredits;

export const evaluateRenderSubmission = (
  inputs: RenderSubmissionInputs
): RenderSubmissionResult => {
  const fullClipRangeLength = getFrameRangeLength(inputs.fullClipRange);

  const validationErrorKeys = getRenderValidationErrorKeys(inputs);
  const fullClipValidationErrorKeys = validationErrorKeys.filter(
    (errorKey) => errorKey !== SAM_FRAME_NOT_IN_RANGE_ERROR_KEY
  );

  const isFullClipExceedsMaxRange =
    fullClipRangeLength > inputs.durationLimits.maxFrames;
  const fullClipMaxRangeErrorKey = inputs.isUnlimitedModeActive
    ? "range.max_in_relaxed_mode.description"
    : "range.max_in_credits_mode.description";

  const modeRestrictionKey = !inputs.isModelAllowedInMode
    ? MODE_RESTRICTION_ERROR_KEY
    : undefined;

  const settingsWithContext = {
    ...inputs.renderSettingsValues,
    fps: inputs.fps,
    width: inputs.inputVideoWidth,
    height: inputs.inputVideoHeight
  };
  const resolveSubmittedFrameRange = (requestedFrameRange: [number, number]) =>
    inputs.sourceVideoFrameCount === undefined
      ? { range: requestedFrameRange, clamped: false }
      : clampFrameRange(requestedFrameRange, inputs.sourceVideoFrameCount);

  const toCredits = (requestedFrameRange: [number, number]) => {
    const {
      range: submittedFrameRange,
      clamped: isSubmittedFrameRangeClampedToSourceVideo
    } = resolveSubmittedFrameRange(requestedFrameRange);
    const submittedSettings = isSubmittedFrameRangeClampedToSourceVideo
      ? (alignFrameRangeDerivedSettings(
          settingsWithContext,
          submittedFrameRange,
          inputs.fps
        ) as typeof settingsWithContext)
      : settingsWithContext;
    return inputs.model.calcEstimatedRenderTime(
      submittedSettings,
      getFrameRangeLength(submittedFrameRange),
      SKIP_CN_COUNT
    ).impactToShow;
  };

  const rangeCredits = toCredits(inputs.rangeFrames);
  const fullClipCredits = toCredits(inputs.fullClipRange);

  const rangeDisabledReasonKey = modeRestrictionKey ?? validationErrorKeys[0];
  const fullClipDisabledReasonKey =
    modeRestrictionKey ??
    (isFullClipExceedsMaxRange ? fullClipMaxRangeErrorKey : undefined) ??
    fullClipValidationErrorKeys[0];

  const nonCreditGatesPass = passesNonCreditEnvironmentGates(inputs);

  const buildTargetState = (
    disabledReasonKey: string | undefined,
    estimateCredits: number,
    exceedsMaxRange: boolean
  ): RenderSubmissionTargetState => {
    const creditGatePasses = passesCreditGate(inputs, estimateCredits);
    const blockedOnlyByCredits =
      disabledReasonKey === undefined &&
      nonCreditGatesPass &&
      !creditGatePasses;

    return {
      canSubmit:
        disabledReasonKey === undefined &&
        nonCreditGatesPass &&
        creditGatePasses,
      disabledReasonKey,
      estimateCredits,
      hasEnoughCredits: inputs.userCredits >= estimateCredits,
      isBlockedByCreditPaywall:
        inputs.isPaywallEligible && blockedOnlyByCredits,
      exceedsMaxRange,
      maxRangeReasonKey: exceedsMaxRange ? fullClipMaxRangeErrorKey : undefined
    };
  };

  return {
    range: buildTargetState(rangeDisabledReasonKey, rangeCredits, false),
    fullClip: buildTargetState(
      fullClipDisabledReasonKey,
      fullClipCredits,
      isFullClipExceedsMaxRange
    )
  };
};
