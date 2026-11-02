import { describe, expect, it } from "vitest";

import { formatPlanTimestamp } from "./formatPlanTimestamp";

describe("formatPlanTimestamp", () => {
  it("returns null for null or undefined input", () => {
    expect(formatPlanTimestamp(null)).toBeNull();
    expect(formatPlanTimestamp(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(formatPlanTimestamp("")).toBeNull();
  });

  it("returns the original string when the timestamp cannot be parsed", () => {
    expect(formatPlanTimestamp("not-a-date")).toBe("not-a-date");
  });

  it("returns a locale-formatted string for a valid ISO timestamp", () => {
    const result = formatPlanTimestamp("2024-05-04T12:00:00Z");
    expect(result).not.toBeNull();
    expect(result).not.toBe("2024-05-04T12:00:00Z");
  });
});
