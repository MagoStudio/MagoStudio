import { describe, expect, it } from "vitest";

import { isStoryboardSheetGroup } from "./isStoryboardSheetGroup";

describe("isStoryboardSheetGroup", () => {
  it("recognises a storyboard by its token prefix", () => {
    expect(isStoryboardSheetGroup({ token: "storyboard_918b3792_7240" })).toBe(
      true
    );
  });

  it("leaves cast entities alone, even one whose name mentions a storyboard", () => {
    expect(isStoryboardSheetGroup({ token: "maya" })).toBe(false);
    expect(isStoryboardSheetGroup({ token: "old_storyboard_artist" })).toBe(
      false
    );
  });
});
