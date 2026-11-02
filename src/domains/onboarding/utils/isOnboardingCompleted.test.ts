import { describe, expect, it } from "vitest";

import { isOnboardingCompleted } from "./isOnboardingCompleted";

describe("isOnboardingCompleted", () => {
  it("is true when the backend flag is completed", () => {
    expect(
      isOnboardingCompleted({
        img2img_success: 4,
        video_success: 1,
        img2img_remaining: 0,
        video_remaining: 0,
        completed: true
      })
    ).toBe(true);
  });

  it("is false when the backend flag is not completed", () => {
    expect(
      isOnboardingCompleted({
        img2img_success: 0,
        video_success: 0,
        img2img_remaining: 4,
        video_remaining: 1,
        completed: false
      })
    ).toBe(false);
  });

  it("treats a missing onboarding object as not completed", () => {
    expect(isOnboardingCompleted(undefined)).toBe(false);
    expect(isOnboardingCompleted(null)).toBe(false);
  });
});
