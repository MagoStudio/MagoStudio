import { describe, expect, it } from "vitest";

import { getShotBlockedClauseLabelKey } from "./getShotBlockedClauseLabelKey";

describe("getShotBlockedClauseLabelKey", () => {
  it("maps the reasons the backend sends today", () => {
    expect(getShotBlockedClauseLabelKey("disabled")).toBe(
      "script_project.shot_blocked_disabled.label"
    );
    expect(getShotBlockedClauseLabelKey("no image")).toBe(
      "script_project.shot_blocked_no_image.label"
    );
  });

  it("falls back to generic copy for a reason it does not know", () => {
    expect(getShotBlockedClauseLabelKey("something new")).toBe(
      "script_project.shot_blocked_unavailable.label"
    );
  });

  it("does not match a differently capitalised reason", () => {
    expect(getShotBlockedClauseLabelKey("Disabled")).toBe(
      "script_project.shot_blocked_unavailable.label"
    );
  });

  it("still answers a clause when the reason is absent", () => {
    expect(getShotBlockedClauseLabelKey(null)).toBe(
      "script_project.shot_blocked_unavailable.label"
    );
    expect(getShotBlockedClauseLabelKey(undefined)).toBe(
      "script_project.shot_blocked_unavailable.label"
    );
  });
});
