import { describe, expect, it } from "vitest";

import { resolveAutoProjectName } from "./resolveAutoProjectName";

const base = {
  currentName: "Untitled",
  defaultName: "Untitled",
  hasExistingVideo: false,
  isOnboardingActive: false,
  filename: "Project_summer_ep01.mp4"
};

describe("resolveAutoProjectName", () => {
  it("derives the name for a first upload into a default-named project", () => {
    expect(resolveAutoProjectName(base)).toBe("Project_su");
  });

  it("returns null during onboarding", () => {
    expect(
      resolveAutoProjectName({ ...base, isOnboardingActive: true })
    ).toBeNull();
  });

  it("returns null when the project already has video", () => {
    expect(
      resolveAutoProjectName({ ...base, hasExistingVideo: true })
    ).toBeNull();
  });

  it("returns null when the name is not the default", () => {
    expect(
      resolveAutoProjectName({ ...base, currentName: "My Film" })
    ).toBeNull();
  });

  it("returns null when the filename yields no usable name", () => {
    expect(resolveAutoProjectName({ ...base, filename: ".mp4" })).toBeNull();
  });

  it("accepts numbered default names", () => {
    expect(
      resolveAutoProjectName({ ...base, currentName: "Untitled_02" })
    ).toBe("Project_su");
  });
});
