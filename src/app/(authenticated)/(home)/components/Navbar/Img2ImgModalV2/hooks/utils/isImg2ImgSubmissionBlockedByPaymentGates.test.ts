import { describe, expect, it } from "vitest";

import { isImg2ImgSubmissionBlockedByPaymentGates } from "./isImg2ImgSubmissionBlockedByPaymentGates";

const cloudRenderWithEnoughCredits = {
  renderProvider: "mago-cloud" as const,
  hasEnoughCreditsForImg2img: true,
  isUnlimitedModeActive: false,
  isOnboardingActive: false,
  isOnboardingImageCapReached: false
};

describe("isImg2ImgSubmissionBlockedByPaymentGates", () => {
  it("allows a Mago cloud render the user has enough credits for", () => {
    expect(
      isImg2ImgSubmissionBlockedByPaymentGates(cloudRenderWithEnoughCredits)
    ).toBe(false);
  });

  it("blocks a Mago cloud render the user lacks the credits for", () => {
    expect(
      isImg2ImgSubmissionBlockedByPaymentGates({
        ...cloudRenderWithEnoughCredits,
        hasEnoughCreditsForImg2img: false
      })
    ).toBe(true);
  });

  it("allows a Mago cloud render without enough credits in unlimited mode", () => {
    expect(
      isImg2ImgSubmissionBlockedByPaymentGates({
        ...cloudRenderWithEnoughCredits,
        hasEnoughCreditsForImg2img: false,
        isUnlimitedModeActive: true
      })
    ).toBe(false);
  });

  it("allows a Mago cloud render without enough credits during onboarding", () => {
    expect(
      isImg2ImgSubmissionBlockedByPaymentGates({
        ...cloudRenderWithEnoughCredits,
        hasEnoughCreditsForImg2img: false,
        isOnboardingActive: true
      })
    ).toBe(false);
  });

  it("blocks a Mago cloud render once the onboarding image cap is reached", () => {
    expect(
      isImg2ImgSubmissionBlockedByPaymentGates({
        ...cloudRenderWithEnoughCredits,
        isOnboardingActive: true,
        isOnboardingImageCapReached: true
      })
    ).toBe(true);
  });

  it.each(["local-comfy", null] as const)(
    "never blocks a %s render, even without credits or past the onboarding cap",
    (renderProvider) => {
      expect(
        isImg2ImgSubmissionBlockedByPaymentGates({
          renderProvider,
          hasEnoughCreditsForImg2img: false,
          isUnlimitedModeActive: false,
          isOnboardingActive: true,
          isOnboardingImageCapReached: true
        })
      ).toBe(false);
    }
  );
});
