import { describe, expect, it } from "vitest";

import { formatCreditCount } from "./formatCreditCount";

describe("formatCreditCount", () => {
  it("leaves counts below a thousand unseparated", () => {
    expect(formatCreditCount(0)).toBe("0");
    expect(formatCreditCount(681)).toBe("681");
    expect(formatCreditCount(999)).toBe("999");
  });

  it("separates thousands with a comma", () => {
    expect(formatCreditCount(1000)).toBe("1,000");
    expect(formatCreditCount(57625)).toBe("57,625");
  });

  it("separates every group above a thousand", () => {
    expect(formatCreditCount(199995)).toBe("199,995");
    expect(formatCreditCount(1000000)).toBe("1,000,000");
    expect(formatCreditCount(1234567890)).toBe("1,234,567,890");
  });

  it("keeps at most one decimal place", () => {
    expect(formatCreditCount(4.25)).toBe("4.3");
    expect(formatCreditCount(1234.56)).toBe("1,234.6");
  });

  it("formats numeric strings", () => {
    expect(formatCreditCount("199995")).toBe("199,995");
  });

  it("returns non-numeric strings untouched", () => {
    expect(formatCreditCount("")).toBe("");
    expect(formatCreditCount("unlimited")).toBe("unlimited");
  });

  it("returns an empty string for a non-finite number", () => {
    expect(formatCreditCount(Number.NaN)).toBe("");
    expect(formatCreditCount(Number.POSITIVE_INFINITY)).toBe("");
  });
});
