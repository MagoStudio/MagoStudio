import { describe, expect, it } from "vitest";

import { withTimelineId } from "./withTimelineId";

describe("withTimelineId", () => {
  it("adds and removes a timeline id without touching the original set", () => {
    const original = new Set(["a"]);
    expect(withTimelineId("b", true)(original)).toEqual(new Set(["a", "b"]));
    expect(withTimelineId("a", false)(original)).toEqual(new Set());
    expect(original).toEqual(new Set(["a"]));
  });

  it("keeps the same set when nothing changes, so React skips the update", () => {
    const original = new Set(["a"]);
    expect(withTimelineId("a", true)(original)).toBe(original);
  });
});
