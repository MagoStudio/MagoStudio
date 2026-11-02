import { Balance, OnboardingStatus } from "@schemas/balance";
import { describe, expect, it } from "vitest";

import { createBalance } from "../../../../tests/factories/balance";

import { needsOnboardingFromBalance } from "./needsOnboardingFromBalance";

const onboarding = (completed: boolean): OnboardingStatus => ({
  img2img_success: 0,
  video_success: completed ? 1 : 0,
  img2img_remaining: 4,
  video_remaining: completed ? 0 : 1,
  completed
});

const videoInProgress = (count: number): Partial<Balance> => ({
  renders_in_progress: {
    credits: {
      img2img: 0,
      img2img_ids: [],
      last_img2img_render_at: 0,
      video: count,
      video_ids: count > 0 ? ["render-1"] : []
    },
    unlimited: {
      img2img: 0,
      img2img_ids: [],
      last_img2img_render_at: 0,
      video: 0,
      video_ids: []
    }
  }
});

describe("needsOnboardingFromBalance", () => {
  it("needs onboarding when not completed and no video render is in progress", () => {
    expect(
      needsOnboardingFromBalance(
        createBalance({ onboarding: onboarding(false) })
      )
    ).toBe(true);
  });

  it("does NOT need onboarding once completed", () => {
    expect(
      needsOnboardingFromBalance(
        createBalance({ onboarding: onboarding(true) })
      )
    ).toBe(false);
  });

  it("does NOT need onboarding while the onboarding video render is in progress", () => {
    expect(
      needsOnboardingFromBalance(
        createBalance({ onboarding: onboarding(false), ...videoInProgress(1) })
      )
    ).toBe(false);
  });
});
