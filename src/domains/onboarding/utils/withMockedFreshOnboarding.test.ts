import { OnboardingStatus } from "@schemas/balance";
import { describe, expect, it } from "vitest";

import { createBalance } from "../../../../tests/factories/balance";

import { needsOnboardingFromBalance } from "./needsOnboardingFromBalance";
import { withMockedFreshOnboarding } from "./withMockedFreshOnboarding";

const completedOnboarding: OnboardingStatus = {
  img2img_success: 4,
  video_success: 1,
  img2img_remaining: 0,
  video_remaining: 0,
  completed: true
};

const videoInProgress = () => ({
  renders_in_progress: {
    credits: {
      img2img: 0,
      img2img_ids: [],
      last_img2img_render_at: 0,
      video: 1,
      video_ids: ["render-1"]
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

describe("withMockedFreshOnboarding", () => {
  it("forces onboarding.completed to false", () => {
    const balance = createBalance({ onboarding: completedOnboarding });
    expect(withMockedFreshOnboarding(balance).onboarding?.completed).toBe(
      false
    );
  });

  it("zeroes in-progress video renders in both modes", () => {
    const balance = createBalance({
      onboarding: completedOnboarding,
      ...videoInProgress()
    });
    const mocked = withMockedFreshOnboarding(balance);
    expect(mocked.renders_in_progress.credits.video).toBe(0);
    expect(mocked.renders_in_progress.unlimited.video).toBe(0);
  });

  it("makes a completed, mid-render account read as needing onboarding", () => {
    const balance = createBalance({
      onboarding: completedOnboarding,
      ...videoInProgress()
    });
    expect(needsOnboardingFromBalance(balance)).toBe(false);
    expect(needsOnboardingFromBalance(withMockedFreshOnboarding(balance))).toBe(
      true
    );
  });

  it("does not mutate the input balance", () => {
    const balance = createBalance({ onboarding: completedOnboarding });
    withMockedFreshOnboarding(balance);
    expect(balance.onboarding?.completed).toBe(true);
  });
});
