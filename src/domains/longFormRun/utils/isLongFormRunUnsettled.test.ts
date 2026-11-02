import { describe, expect, it } from "vitest";

import { isLongFormRunUnsettled } from "./isLongFormRunUnsettled";

describe("isLongFormRunUnsettled", () => {
  it("is unsettled while PENDING, RUNNING or PAUSED", () => {
    expect(isLongFormRunUnsettled("PENDING")).toBe(true);
    expect(isLongFormRunUnsettled("RUNNING")).toBe(true);
    expect(isLongFormRunUnsettled("PAUSED")).toBe(true);
  });

  it("is settled once COMPLETED, FAILED or CANCELLED", () => {
    expect(isLongFormRunUnsettled("COMPLETED")).toBe(false);
    expect(isLongFormRunUnsettled("FAILED")).toBe(false);
    expect(isLongFormRunUnsettled("CANCELLED")).toBe(false);
  });

  it("is settled when there is no status yet", () => {
    expect(isLongFormRunUnsettled(undefined)).toBe(false);
  });
});
