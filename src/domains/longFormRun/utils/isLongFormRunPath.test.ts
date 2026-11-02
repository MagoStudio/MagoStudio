import { describe, expect, it } from "vitest";

import { isLongFormRunPath } from "./isLongFormRunPath";

describe("isLongFormRunPath", () => {
  it("returns true for a long-form run path", () => {
    expect(isLongFormRunPath("/long-form/some-key")).toBe(true);
  });

  it("returns false for any other path", () => {
    expect(isLongFormRunPath("/project")).toBe(false);
    expect(isLongFormRunPath("/")).toBe(false);
  });
});
