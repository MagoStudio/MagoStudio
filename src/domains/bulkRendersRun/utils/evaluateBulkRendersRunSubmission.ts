export interface EvaluateBulkRendersRunSubmissionInput {
  openShotCanSubmit: boolean;
  openShotIsBlockedByCreditPaywall: boolean;
  isPaywallEligible: boolean;
  isUnlimitedModeActive: boolean;
  userCredits: number;
  isRequiredCreditsForRunResolved: boolean;
  requiredCreditsForRun: number;
}

export interface BulkRendersRunSubmissionState {
  isSubmissionBlocked: boolean;
  shouldOpenPaywallOnPress: boolean;
}

export const evaluateBulkRendersRunSubmission = ({
  openShotCanSubmit,
  openShotIsBlockedByCreditPaywall,
  isPaywallEligible,
  isUnlimitedModeActive,
  userCredits,
  isRequiredCreditsForRunResolved,
  requiredCreditsForRun
}: EvaluateBulkRendersRunSubmissionInput): BulkRendersRunSubmissionState => {
  /* A Bulk Renders Run bills in credits and nothing else, so unlimited mode is a reason to
   * block rather than a reason to skip the credit check. No paywall: the user is not short of
   * credits, the feature is unavailable in the mode they are in. */
  if (isUnlimitedModeActive) {
    return { isSubmissionBlocked: true, shouldOpenPaywallOnPress: false };
  }

  const isBlockedByNonCreditReason =
    !openShotCanSubmit && !openShotIsBlockedByCreditPaywall;

  if (isBlockedByNonCreditReason) {
    return { isSubmissionBlocked: true, shouldOpenPaywallOnPress: false };
  }

  if (!isRequiredCreditsForRunResolved) {
    return { isSubmissionBlocked: true, shouldOpenPaywallOnPress: false };
  }

  const hasEnoughCreditsForRun = userCredits >= requiredCreditsForRun;

  if (hasEnoughCreditsForRun) {
    return { isSubmissionBlocked: false, shouldOpenPaywallOnPress: false };
  }

  if (isPaywallEligible) {
    return { isSubmissionBlocked: false, shouldOpenPaywallOnPress: true };
  }

  return { isSubmissionBlocked: true, shouldOpenPaywallOnPress: false };
};
