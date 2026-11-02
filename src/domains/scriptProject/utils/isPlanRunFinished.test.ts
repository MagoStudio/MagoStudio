import { describe, expect, it } from "vitest";

import { isPlanRunFinished } from "./isPlanRunFinished";

describe("isPlanRunFinished", () => {
  it("is true for every terminal status", () => {
    expect(isPlanRunFinished("COMPLETED")).toBe(true);
    expect(isPlanRunFinished("FAILED")).toBe(true);
    expect(isPlanRunFinished("PAUSED")).toBe(true);
    expect(isPlanRunFinished("CANCELLED")).toBe(true);
    expect(isPlanRunFinished("ERROR")).toBe(true);
  });

  it("is false while the run is still going", () => {
    expect(isPlanRunFinished("PENDING")).toBe(false);
    expect(isPlanRunFinished("RUNNING")).toBe(false);
  });

  it("is false before the first poll answers, so nothing advances early", () => {
    expect(isPlanRunFinished(undefined)).toBe(false);
    expect(isPlanRunFinished(null)).toBe(false);
  });
});
