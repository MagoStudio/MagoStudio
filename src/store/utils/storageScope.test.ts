import { describe, expect, it } from "vitest";

import { resolveStorageScopeParts } from "./storageScope";

describe("resolveStorageScopeParts", () => {
  it("returns no parts for a device scope", () => {
    expect(resolveStorageScopeParts({ level: "device" })).toEqual([]);
  });

  it("returns the user id for a user scope", () => {
    expect(resolveStorageScopeParts({ level: "user", userId: "u1" })).toEqual([
      "u1"
    ]);
  });

  it("returns user and project ids in order for a project scope", () => {
    expect(
      resolveStorageScopeParts({
        level: "project",
        userId: "u1",
        projectId: "p1"
      })
    ).toEqual(["u1", "p1"]);
  });

  it("returns user, project and shot ids in order for a shot scope", () => {
    expect(
      resolveStorageScopeParts({
        level: "shot",
        userId: "u1",
        projectId: "p1",
        shotId: "s1"
      })
    ).toEqual(["u1", "p1", "s1"]);
  });

  it("returns undefined when the user id is undefined", () => {
    expect(
      resolveStorageScopeParts({ level: "user", userId: undefined })
    ).toBeUndefined();
  });

  it("returns undefined when the user id is an empty string", () => {
    expect(
      resolveStorageScopeParts({ level: "user", userId: "" })
    ).toBeUndefined();
  });

  it("returns undefined when a project scope is missing the project id", () => {
    expect(
      resolveStorageScopeParts({
        level: "project",
        userId: "u1",
        projectId: undefined
      })
    ).toBeUndefined();
  });

  it("returns undefined when a shot scope is missing the shot id", () => {
    expect(
      resolveStorageScopeParts({
        level: "shot",
        userId: "u1",
        projectId: "p1",
        shotId: undefined
      })
    ).toBeUndefined();
  });

  it("returns undefined when a shot scope is missing every identifier", () => {
    expect(
      resolveStorageScopeParts({
        level: "shot",
        userId: "",
        projectId: "",
        shotId: ""
      })
    ).toBeUndefined();
  });
});
