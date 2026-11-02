import { describe, expect, it } from "vitest";

import { buildPrefixedStorageKey } from "./buildPrefixedStorageKey";

describe("buildPrefixedStorageKey", () => {
  it("joins the prefix with user, project and shot for a shot scope", () => {
    expect(
      buildPrefixedStorageKey("shot-crop", {
        level: "shot",
        userId: "u1",
        projectId: "p1",
        shotId: "s1"
      })
    ).toBe("shot-crop-u1-p1-s1");
  });

  it("joins the prefix with the user id alone for a user scope", () => {
    expect(
      buildPrefixedStorageKey("storage", { level: "user", userId: "u1" })
    ).toBe("storage-u1");
  });

  it("keeps a prefix that already contains dashes intact", () => {
    expect(
      buildPrefixedStorageKey("input-track-id", {
        level: "shot",
        userId: "u1",
        projectId: "p1",
        shotId: "s1"
      })
    ).toBe("input-track-id-u1-p1-s1");
  });

  it("returns the bare prefix for a device scope", () => {
    expect(
      buildPrefixedStorageKey("mago-preview-muted", { level: "device" })
    ).toBe("mago-preview-muted");
  });

  it("returns undefined instead of collapsing absent identifiers to empty strings", () => {
    expect(
      buildPrefixedStorageKey("input-track-id", {
        level: "shot",
        userId: "",
        projectId: "",
        shotId: ""
      })
    ).toBeUndefined();
  });

  it("returns undefined when only the shot id is missing", () => {
    expect(
      buildPrefixedStorageKey("img2img-settings", {
        level: "shot",
        userId: "u1",
        projectId: "p1",
        shotId: undefined
      })
    ).toBeUndefined();
  });
});
