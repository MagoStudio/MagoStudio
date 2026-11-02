import { describe, expect, it } from "vitest";

import { buildStoryboardSheetToken } from "./buildStoryboardSheetToken";

describe("buildStoryboardSheetToken", () => {
  it("writes the Shot's timeline id with underscores, the way the backend stores tokens", () => {
    expect(
      buildStoryboardSheetToken("918b3792-7240-4b5c-b8c0-786ebe61cbb8")
    ).toBe("storyboard_918b3792_7240_4b5c_b8c0_786ebe61cbb8");
  });
});
