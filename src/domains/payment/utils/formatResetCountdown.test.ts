import { afterEach, describe, expect, it, vi } from "vitest";

import { formatResetCountdownHours } from "./formatResetCountdown";

const nowMs = 1_750_000_000_000;
const nowSeconds = nowMs / 1000;

afterEach(() => {
  vi.useRealTimers();
});

describe("formatResetCountdownHours", () => {
  it("uses Date.now() by default (production single-arg call path)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(nowMs);
    expect(formatResetCountdownHours(nowSeconds + 8 * 3600)).toBe(8);
  });

  it("rounds up partial hours", () => {
    expect(formatResetCountdownHours(nowSeconds + 7.5 * 3600, nowMs)).toBe(8);
  });

  it("returns whole hours exactly", () => {
    expect(formatResetCountdownHours(nowSeconds + 12 * 3600, nowMs)).toBe(12);
  });

  it("never returns a negative value for a past reset", () => {
    expect(formatResetCountdownHours(nowSeconds - 3600, nowMs)).toBe(0);
  });

  it("rounds a sub-hour remainder up to 1", () => {
    expect(formatResetCountdownHours(nowSeconds + 60, nowMs)).toBe(1);
  });
});
