import { describe, expect, it } from "vitest";

import { hasPreservableValue } from "./hasPreservableValue";

describe("hasPreservableValue", () => {
  it("treats a non-empty string as preservable", () => {
    expect(hasPreservableValue("a cat riding a bike")).toBe(true);
  });

  it("treats an empty string as not preservable", () => {
    expect(hasPreservableValue("")).toBe(false);
  });

  it("treats a whitespace-only string as not preservable", () => {
    expect(hasPreservableValue("   ")).toBe(false);
    expect(hasPreservableValue("\n\t ")).toBe(false);
  });

  it("treats undefined as not preservable", () => {
    expect(hasPreservableValue(undefined)).toBe(false);
  });

  it("keeps non-string defined values preservable", () => {
    expect(hasPreservableValue(0)).toBe(true);
    expect(hasPreservableValue(false)).toBe(true);
    expect(hasPreservableValue(null)).toBe(true);
    expect(hasPreservableValue([])).toBe(true);
  });
});
