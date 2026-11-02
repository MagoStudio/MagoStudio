import { describe, expect, it } from "vitest";

import { resolveOnboardingGuardAction } from "./resolveOnboardingGuardAction";

const base = {
  isOnboardingRoute: false,
  isOnboardingProjectPath: false,
  stepIsProjectStep: false,
  justCompleted: false,
  hasProjectId: false,
  needsOnboarding: undefined as boolean | undefined
};

describe("resolveOnboardingGuardAction", () => {
  it("does nothing while the onboarding status is still loading", () => {
    expect(
      resolveOnboardingGuardAction({
        ...base,
        isOnboardingProjectPath: true,
        hasProjectId: true,
        needsOnboarding: undefined
      })
    ).toBe("none");
  });

  it("enters onboarding from an off-flow page when the user still needs it", () => {
    expect(
      resolveOnboardingGuardAction({ ...base, needsOnboarding: true })
    ).toBe("enter-onboarding");
  });

  it("resumes in place on a reloaded onboarding project page (no navigation)", () => {
    expect(
      resolveOnboardingGuardAction({
        ...base,
        isOnboardingProjectPath: true,
        hasProjectId: true,
        needsOnboarding: true
      })
    ).toBe("resume-in-place");
  });

  it("enters onboarding from a reloaded onboarding project page lacking a projectId", () => {
    expect(
      resolveOnboardingGuardAction({
        ...base,
        isOnboardingProjectPath: true,
        hasProjectId: false,
        needsOnboarding: true
      })
    ).toBe("enter-onboarding");
  });

  it("stays put on the onboarding project page once already on a project step", () => {
    expect(
      resolveOnboardingGuardAction({
        ...base,
        isOnboardingProjectPath: true,
        stepIsProjectStep: true,
        hasProjectId: true,
        needsOnboarding: true
      })
    ).toBe("none");
  });

  it("never redirects a user who just completed onboarding this session", () => {
    expect(
      resolveOnboardingGuardAction({
        ...base,
        isOnboardingProjectPath: true,
        justCompleted: true,
        hasProjectId: true,
        needsOnboarding: true
      })
    ).toBe("none");
  });

  it("clears the onboarding param on a reloaded project page once actions are done", () => {
    expect(
      resolveOnboardingGuardAction({
        ...base,
        isOnboardingProjectPath: true,
        hasProjectId: true,
        needsOnboarding: false
      })
    ).toBe("clear-onboarding-param");
  });

  it("does nothing on the /onboarding route itself while it self-resolves", () => {
    expect(
      resolveOnboardingGuardAction({
        ...base,
        isOnboardingRoute: true,
        needsOnboarding: true
      })
    ).toBe("none");
  });

  it("exits onboarding when a completed user is on the /onboarding route", () => {
    expect(
      resolveOnboardingGuardAction({
        ...base,
        isOnboardingRoute: true,
        needsOnboarding: false
      })
    ).toBe("exit-onboarding");
  });

  it("does not exit onboarding while needsOnboarding is still loading", () => {
    expect(
      resolveOnboardingGuardAction({
        ...base,
        isOnboardingRoute: true,
        needsOnboarding: undefined
      })
    ).toBe("none");
  });

  it("never exits onboarding for a user who just completed it this session", () => {
    expect(
      resolveOnboardingGuardAction({
        ...base,
        isOnboardingRoute: true,
        justCompleted: true,
        needsOnboarding: false
      })
    ).toBe("none");
  });

  it("does not exit onboarding for a mid-flow New User", () => {
    expect(
      resolveOnboardingGuardAction({
        ...base,
        isOnboardingRoute: true,
        needsOnboarding: true
      })
    ).toBe("none");
  });
});
