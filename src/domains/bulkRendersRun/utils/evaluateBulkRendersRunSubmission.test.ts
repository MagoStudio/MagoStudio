import { describe, expect, it } from "vitest";

import {
  EvaluateBulkRendersRunSubmissionInput,
  evaluateBulkRendersRunSubmission
} from "./evaluateBulkRendersRunSubmission";

const buildInput = (
  overrides: Partial<EvaluateBulkRendersRunSubmissionInput> = {}
): EvaluateBulkRendersRunSubmissionInput => ({
  openShotCanSubmit: true,
  openShotIsBlockedByCreditPaywall: false,
  isPaywallEligible: false,
  isUnlimitedModeActive: false,
  userCredits: 1000,
  isRequiredCreditsForRunResolved: true,
  requiredCreditsForRun: 500,
  ...overrides
});

describe("evaluateBulkRendersRunSubmission", () => {
  it("enables Next and never opens the paywall when the run's full credit cost is covered", () => {
    const state = evaluateBulkRendersRunSubmission(buildInput());

    expect(state).toEqual({
      isSubmissionBlocked: false,
      shouldOpenPaywallOnPress: false
    });
  });

  it("disables Next without opening the paywall when a non-credit gate already blocks the per-Shot submission", () => {
    const state = evaluateBulkRendersRunSubmission(
      buildInput({ openShotCanSubmit: false })
    );

    expect(state).toEqual({
      isSubmissionBlocked: true,
      shouldOpenPaywallOnPress: false
    });
  });

  it("disables Next when the per-Shot estimate alone already exceeds the balance, even before scaling by the selection", () => {
    const state = evaluateBulkRendersRunSubmission(
      buildInput({
        openShotCanSubmit: false,
        userCredits: 100,
        requiredCreditsForRun: 150,
        isPaywallEligible: false
      })
    );

    expect(state.isSubmissionBlocked).toBe(true);
    expect(state.shouldOpenPaywallOnPress).toBe(false);
  });

  it("disables Next when the per-Shot estimate passes but the SCALED run cost exceeds the balance, for a subscriber not eligible for the paywall", () => {
    const state = evaluateBulkRendersRunSubmission(
      buildInput({
        openShotCanSubmit: true,
        userCredits: 400,
        requiredCreditsForRun: 500,
        isPaywallEligible: false
      })
    );

    expect(state).toEqual({
      isSubmissionBlocked: true,
      shouldOpenPaywallOnPress: false
    });
  });

  it("keeps Next enabled and routes the press to the paywall when the scaled cost exceeds the balance for a paywall-eligible user", () => {
    const state = evaluateBulkRendersRunSubmission(
      buildInput({
        openShotCanSubmit: true,
        userCredits: 400,
        requiredCreditsForRun: 500,
        isPaywallEligible: true
      })
    );

    expect(state).toEqual({
      isSubmissionBlocked: false,
      shouldOpenPaywallOnPress: true
    });
  });

  it("blocks in unlimited mode however large the balance, because a run bills in credits only", () => {
    const state = evaluateBulkRendersRunSubmission(
      buildInput({
        isUnlimitedModeActive: true,
        userCredits: 999999,
        requiredCreditsForRun: 1
      })
    );

    expect(state).toEqual({
      isSubmissionBlocked: true,
      shouldOpenPaywallOnPress: false
    });
  });

  it("opens no paywall when unlimited mode blocks: the user is not short of credits", () => {
    const state = evaluateBulkRendersRunSubmission(
      buildInput({
        isUnlimitedModeActive: true,
        isPaywallEligible: true,
        userCredits: 0,
        requiredCreditsForRun: 999999
      })
    );

    expect(state).toEqual({
      isSubmissionBlocked: true,
      shouldOpenPaywallOnPress: false
    });
  });

  it("already-flagged per-Shot paywall block stays a paywall block, never a plain disable", () => {
    const state = evaluateBulkRendersRunSubmission(
      buildInput({
        openShotCanSubmit: false,
        openShotIsBlockedByCreditPaywall: true,
        isPaywallEligible: true,
        userCredits: 0,
        requiredCreditsForRun: 500
      })
    );

    expect(state).toEqual({
      isSubmissionBlocked: false,
      shouldOpenPaywallOnPress: true
    });
  });

  it("disables Next in unlimited mode when a non-credit gate blocks the per-Shot submission, rather than letting the unlimited-mode credit bypass override it", () => {
    const state = evaluateBulkRendersRunSubmission(
      buildInput({
        openShotCanSubmit: false,
        isUnlimitedModeActive: true,
        userCredits: 999999,
        requiredCreditsForRun: 0
      })
    );

    expect(state).toEqual({
      isSubmissionBlocked: true,
      shouldOpenPaywallOnPress: false
    });
  });

  it("disables Next in regular credit mode when a non-credit gate blocks the per-Shot submission, even with an ample balance", () => {
    const state = evaluateBulkRendersRunSubmission(
      buildInput({
        openShotCanSubmit: false,
        isUnlimitedModeActive: false,
        userCredits: 999999,
        requiredCreditsForRun: 1
      })
    );

    expect(state).toEqual({
      isSubmissionBlocked: true,
      shouldOpenPaywallOnPress: false
    });
  });

  it("blocks submission while the run's credit cost is still unresolved, rather than reading it as covered", () => {
    const state = evaluateBulkRendersRunSubmission(
      buildInput({
        isRequiredCreditsForRunResolved: false,
        requiredCreditsForRun: 0
      })
    );

    expect(state).toEqual({
      isSubmissionBlocked: true,
      shouldOpenPaywallOnPress: false
    });
  });

  it("blocks on an unresolved credit cost in credits mode, so the cost is never unknown at launch", () => {
    const state = evaluateBulkRendersRunSubmission(
      buildInput({
        isRequiredCreditsForRunResolved: false,
        requiredCreditsForRun: 0,
        isUnlimitedModeActive: false
      })
    );

    expect(state).toEqual({
      isSubmissionBlocked: true,
      shouldOpenPaywallOnPress: false
    });
  });
});
