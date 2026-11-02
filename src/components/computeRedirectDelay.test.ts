import { describe, expect, it } from "vitest";

import { computeRedirectDelay } from "./computeRedirectDelay";

describe("computeRedirectDelay", () => {
  it("returns the remaining time when elapsed is under the minimum beat", () => {
    expect(computeRedirectDelay({ elapsedMs: 400, minBeatMs: 1500 })).toBe(
      1100
    );
  });

  it("returns 0 once elapsed has reached the minimum beat", () => {
    expect(computeRedirectDelay({ elapsedMs: 1500, minBeatMs: 1500 })).toBe(0);
  });

  it("returns 0 once elapsed has exceeded the minimum beat", () => {
    expect(computeRedirectDelay({ elapsedMs: 2000, minBeatMs: 1500 })).toBe(0);
  });

  it("returns the full minimum beat when no time has elapsed", () => {
    expect(computeRedirectDelay({ elapsedMs: 0, minBeatMs: 1500 })).toBe(1500);
  });

  it("clamps a negative elapsed time to the full minimum beat", () => {
    expect(computeRedirectDelay({ elapsedMs: -200, minBeatMs: 1500 })).toBe(
      1500
    );
  });
});
