import { describe, expect, it } from "vitest";

import { isReloadedOnboardingLanding } from "./isReloadedOnboardingLanding";

describe("isReloadedOnboardingLanding", () => {
  it("is true on the onboarding project path when the step was lost (reset to upload)", () => {
    expect(
      isReloadedOnboardingLanding({
        isOnboardingProjectPath: true,
        step: "upload"
      })
    ).toBe(true);
  });

  it("is false when a project-phase step is present (soft nav kept the step)", () => {
    expect(
      isReloadedOnboardingLanding({
        isOnboardingProjectPath: true,
        step: "generate-image"
      })
    ).toBe(false);
  });

  it("is false when onboarding is complete", () => {
    expect(
      isReloadedOnboardingLanding({
        isOnboardingProjectPath: true,
        step: "complete"
      })
    ).toBe(false);
  });

  it("is false off the onboarding project path", () => {
    expect(
      isReloadedOnboardingLanding({
        isOnboardingProjectPath: false,
        step: "upload"
      })
    ).toBe(false);
  });
});
