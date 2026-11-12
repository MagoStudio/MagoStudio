import { describe, expect, it } from "vitest";

import { isComfyVersionAtLeast } from "./isComfyVersionAtLeast";

describe("isComfyVersionAtLeast", () => {
  it("accepts the required version and newer ones", () => {
    for (const reported of ["0.38.0", "v0.38.0", "0.38.2", "0.39.0", "1.0.0"])
      expect(isComfyVersionAtLeast(reported, "0.38.0")).toBe(true);
  });

  it("rejects older versions", () => {
    for (const reported of ["0.37.9", "0.3.68", "0.0.1"])
      expect(isComfyVersionAtLeast(reported, "0.38.0")).toBe(false);
  });

  it("returns null when either version cannot be read", () => {
    expect(isComfyVersionAtLeast("unknown", "0.38.0")).toBeNull();
    expect(isComfyVersionAtLeast("0.38.0", "")).toBeNull();
  });
});
