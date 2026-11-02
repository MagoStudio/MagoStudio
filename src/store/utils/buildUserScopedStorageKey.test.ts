import { describe, expect, it } from "vitest";

import { buildUserScopedStorageKey } from "./buildUserScopedStorageKey";

describe("buildUserScopedStorageKey", () => {
  it("puts the user id before the name for a user scope", () => {
    expect(
      buildUserScopedStorageKey("isUnlimitedModeEnabled", {
        level: "user",
        userId: "u1"
      })
    ).toBe("u1:isUnlimitedModeEnabled");
  });

  it("appends the project id after the name for a project scope", () => {
    expect(
      buildUserScopedStorageKey("lastViewedTimelineId", {
        level: "project",
        userId: "u1",
        projectId: "p1"
      })
    ).toBe("u1:lastViewedTimelineId:p1");
  });

  it("appends project then shot after the name for a shot scope", () => {
    expect(
      buildUserScopedStorageKey("projectSettings", {
        level: "shot",
        userId: "u1",
        projectId: "p1",
        shotId: "s1"
      })
    ).toBe("u1:projectSettings:p1:s1");
  });

  it("returns the bare name for a device scope", () => {
    expect(
      buildUserScopedStorageKey("mago-preview-muted", { level: "device" })
    ).toBe("mago-preview-muted");
  });

  it("returns undefined when the user has not resolved", () => {
    expect(
      buildUserScopedStorageKey("signUpTracked", {
        level: "user",
        userId: undefined
      })
    ).toBeUndefined();
  });

  it("returns undefined rather than interpolating an absent project id", () => {
    expect(
      buildUserScopedStorageKey("projectSettings", {
        level: "shot",
        userId: "u1",
        projectId: undefined,
        shotId: undefined
      })
    ).toBeUndefined();
  });
});
