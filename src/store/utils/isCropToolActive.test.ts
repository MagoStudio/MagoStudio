import { describe, expect, it } from "vitest";

import { isCropToolActive } from "./isCropToolActive";

describe("isCropToolActive", () => {
  it("returns true when a crop is stored", () => {
    expect(isCropToolActive({ x: 0, y: 0, width: 0.5, height: 0.5 })).toBe(
      true
    );
  });

  it("returns false when no crop is stored", () => {
    expect(isCropToolActive(undefined)).toBe(false);
  });
});
