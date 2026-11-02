import { Project } from "@schemas/project";
import { describe, expect, it } from "vitest";

import { isContainerShot } from "./isContainerShot";

describe("isContainerShot", () => {
  it("returns true when the shot id matches the project's betaI2vShotId", () => {
    const project = {
      settings: { betaI2vShotId: "shot-i2v" }
    } as Pick<Project, "settings">;
    expect(isContainerShot({ id: "shot-i2v" }, project)).toBe(true);
  });

  it("returns false when the shot id does not match", () => {
    const project = {
      settings: { betaI2vShotId: "shot-i2v" }
    } as Pick<Project, "settings">;
    expect(isContainerShot({ id: "shot-real" }, project)).toBe(false);
  });

  it("returns false when the project has never used image-to-video", () => {
    const project = { settings: {} } as Pick<Project, "settings">;
    expect(isContainerShot({ id: "shot-real" }, project)).toBe(false);
  });

  it("returns false when the project is undefined", () => {
    expect(isContainerShot({ id: "shot-real" }, undefined)).toBe(false);
  });
});
