import { describe, expect, it } from "vitest";

import {
  formatHistoryMutation,
  getNavigationKind
} from "./classifyOnboardingReload";

describe("getNavigationKind", () => {
  it.each(["reload", "navigate", "back_forward", "prerender"] as const)(
    "passes through the known kind %s",
    (kind) => {
      expect(getNavigationKind(kind)).toBe(kind);
    }
  );

  it("maps unknown or missing types to 'unknown'", () => {
    expect(getNavigationKind(undefined)).toBe("unknown");
    expect(getNavigationKind("something-else")).toBe("unknown");
  });
});

describe("formatHistoryMutation", () => {
  it("renders a compact single-line summary", () => {
    expect(
      formatHistoryMutation({
        method: "replaceState",
        url: "/project?projectId=abc&via=partner",
        stackTop: "at https://r.wdfl.co/rw.js:1:23"
      })
    ).toBe(
      "replaceState /project?projectId=abc&via=partner @ at https://r.wdfl.co/rw.js:1:23"
    );
  });
});
