import { describe, expect, it } from "vitest";

import {
  buildOnboardingProjectName,
  isOnboardingProjectName
} from "./onboardingProjectName";

describe("isOnboardingProjectName", () => {
  it("matches the base name and numbered variants", () => {
    expect(isOnboardingProjectName("Onboarding")).toBe(true);
    expect(isOnboardingProjectName("Onboarding_1")).toBe(true);
    expect(isOnboardingProjectName("Onboarding_42")).toBe(true);
  });

  it("does not match unrelated or partial names", () => {
    expect(isOnboardingProjectName("Shared org project")).toBe(false);
    expect(isOnboardingProjectName("My Onboarding")).toBe(false);
    expect(isOnboardingProjectName("Onboarding video")).toBe(false);
    expect(isOnboardingProjectName("Onboarding_")).toBe(false);
  });
});

describe("buildOnboardingProjectName", () => {
  it("uses the base name when free", () => {
    expect(buildOnboardingProjectName([])).toBe("Onboarding");
    expect(buildOnboardingProjectName(["My project"])).toBe("Onboarding");
  });

  it("appends the first available number when taken", () => {
    expect(buildOnboardingProjectName(["Onboarding"])).toBe("Onboarding_1");
    expect(buildOnboardingProjectName(["Onboarding", "Onboarding_1"])).toBe(
      "Onboarding_2"
    );
  });

  it("fills the lowest free gap in the series", () => {
    expect(buildOnboardingProjectName(["Onboarding", "Onboarding_2"])).toBe(
      "Onboarding_1"
    );
  });
});
