import { describe, expect, it } from "vitest";

import { getCheckoutOutcome } from "./getCheckoutOutcome";

const params = (query: string) => new URLSearchParams(query);

describe("getCheckoutOutcome", () => {
  it("reports no outcome when the query is empty", () => {
    expect(getCheckoutOutcome(params(""))).toBeNull();
  });

  it("reports success when success is exactly true", () => {
    expect(getCheckoutOutcome(params("success=true"))).toBe("success");
  });

  it("reports canceled when canceled is exactly true", () => {
    expect(getCheckoutOutcome(params("canceled=true"))).toBe("canceled");
  });

  it("ignores any value other than the literal true", () => {
    expect(getCheckoutOutcome(params("success=1"))).toBeNull();
    expect(getCheckoutOutcome(params("canceled=yes"))).toBeNull();
    expect(getCheckoutOutcome(params("success=false"))).toBeNull();
  });

  it("prefers success when both flags are present", () => {
    expect(getCheckoutOutcome(params("success=true&canceled=true"))).toBe(
      "success"
    );
  });

  it("reports no outcome when another tab owns the redirect", () => {
    expect(getCheckoutOutcome(params("success=true&tab=plans"))).toBeNull();
    expect(getCheckoutOutcome(params("canceled=true&tab=plans"))).toBeNull();
  });

  it("accepts the redirect when it names the credits tab", () => {
    expect(getCheckoutOutcome(params("success=true&tab=credits"))).toBe(
      "success"
    );
  });
});
