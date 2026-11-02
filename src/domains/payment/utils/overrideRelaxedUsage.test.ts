import { BalanceWithComputedFields } from "@domains/payment/interface";
import { describe, expect, it } from "vitest";

import { overrideRelaxedUsage } from "./overrideRelaxedUsage";

const baseBalance = {
  relaxed_usage: null,
  latest_subscription: { features: {} }
} as unknown as BalanceWithComputedFields;

const noOverride = {
  dayUsedPct: null,
  dayResetAt: null,
  weekUsedPct: null,
  weekResetAt: null
};

describe("overrideRelaxedUsage", () => {
  it("is a no-op when neither percentage is set", () => {
    const result = overrideRelaxedUsage(baseBalance, {
      ...noOverride,
      dayResetAt: "2026-06-22T20:00"
    });
    expect(result).toBe(baseBalance);
  });

  it("injects day_used_pct without a reset", () => {
    const result = overrideRelaxedUsage(baseBalance, {
      ...noOverride,
      dayUsedPct: 100
    });
    expect(result.relaxed_usage?.day_used_pct).toBe(100);
    expect(result.relaxed_usage?.day_reset_at).toBeUndefined();
  });

  it("converts the daily reset datetime to Unix seconds", () => {
    const result = overrideRelaxedUsage(baseBalance, {
      ...noOverride,
      dayUsedPct: 42,
      dayResetAt: "2026-06-22T20:00"
    });
    expect(result.relaxed_usage?.day_used_pct).toBe(42);
    expect(result.relaxed_usage?.day_reset_at).toBe(
      Math.floor(new Date("2026-06-22T20:00").getTime() / 1000)
    );
  });

  it("injects weekly usage and reset independently of daily", () => {
    const result = overrideRelaxedUsage(baseBalance, {
      ...noOverride,
      weekUsedPct: 100,
      weekResetAt: "2026-06-24T08:00"
    });
    expect(result.relaxed_usage?.week_used_pct).toBe(100);
    expect(result.relaxed_usage?.week_reset_at).toBe(
      Math.floor(new Date("2026-06-24T08:00").getTime() / 1000)
    );
    expect(result.relaxed_usage?.day_used_pct).toBeUndefined();
  });

  it("injects both daily and weekly when both are set", () => {
    const result = overrideRelaxedUsage(baseBalance, {
      dayUsedPct: 30,
      dayResetAt: "2026-06-22T20:00",
      weekUsedPct: 80,
      weekResetAt: "2026-06-24T08:00"
    });
    expect(result.relaxed_usage?.day_used_pct).toBe(30);
    expect(result.relaxed_usage?.week_used_pct).toBe(80);
  });
});
