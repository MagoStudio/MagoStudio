import { describe, expect, it } from "vitest";

import { isPlanRunFailed } from "./isPlanRunFailed";

describe("isPlanRunFailed", () => {
  it("is true for every status that means the run did not deliver", () => {
    expect(isPlanRunFailed("FAILED")).toBe(true);
    expect(isPlanRunFailed("CANCELLED")).toBe(true);
    expect(isPlanRunFailed("ERROR")).toBe(true);
  });

  it("is false for a run that completed", () => {
    expect(isPlanRunFailed("COMPLETED")).toBe(false);
  });

  it("is false for a run still going", () => {
    expect(isPlanRunFailed("RUNNING")).toBe(false);
    expect(isPlanRunFailed("PENDING")).toBe(false);
  });

  it("is false when no status has arrived", () => {
    expect(isPlanRunFailed(null)).toBe(false);
    expect(isPlanRunFailed(undefined)).toBe(false);
  });
});
