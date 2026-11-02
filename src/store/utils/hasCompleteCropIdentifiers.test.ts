import { describe, expect, it } from "vitest";

import { hasCompleteCropIdentifiers } from "./hasCompleteCropIdentifiers";

describe("hasCompleteCropIdentifiers", () => {
  it("returns true when userId, projectId and shotId are all present", () => {
    expect(
      hasCompleteCropIdentifiers({
        userId: "u1",
        projectId: "p1",
        shotId: "s1"
      })
    ).toBe(true);
  });

  it("returns false when userId is empty", () => {
    expect(
      hasCompleteCropIdentifiers({ userId: "", projectId: "p1", shotId: "s1" })
    ).toBe(false);
  });

  it("returns false when projectId is empty", () => {
    expect(
      hasCompleteCropIdentifiers({ userId: "u1", projectId: "", shotId: "s1" })
    ).toBe(false);
  });

  it("returns false when shotId is empty", () => {
    expect(
      hasCompleteCropIdentifiers({ userId: "u1", projectId: "p1", shotId: "" })
    ).toBe(false);
  });

  it("returns false when all identifiers are empty", () => {
    expect(
      hasCompleteCropIdentifiers({ userId: "", projectId: "", shotId: "" })
    ).toBe(false);
  });
});
