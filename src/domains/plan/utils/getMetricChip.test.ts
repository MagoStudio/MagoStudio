import { describe, expect, it } from "vitest";

import { getMetricChip } from "./getMetricChip";

describe("getMetricChip", () => {
  it("returns pass for COMPLETED + pass true", () => {
    expect(getMetricChip({ status: "COMPLETED", pass: true }, "pass")).toEqual({
      kind: "pass",
      details: { status: "COMPLETED", pass: true }
    });
  });

  it("returns fail for COMPLETED + pass false", () => {
    expect(
      getMetricChip({ status: "COMPLETED", pass: false }, "pass")?.kind
    ).toBe("fail");
  });

  it("returns unscored for FAILED status (eval call failed, render is fine)", () => {
    expect(getMetricChip({ status: "FAILED", pass: null }, "pass")?.kind).toBe(
      "unscored"
    );
  });

  it("reads vid_pass for video metrics", () => {
    expect(
      getMetricChip({ status: "COMPLETED", vid_pass: true }, "vid_pass")?.kind
    ).toBe("pass");
  });

  it("falls back to the boolean pass flag when status is absent", () => {
    expect(getMetricChip({ pass: false }, "pass")?.kind).toBe("fail");
  });

  it("returns undefined for missing or non-object metrics", () => {
    expect(getMetricChip(undefined, "pass")).toBeUndefined();
    expect(getMetricChip(null, "pass")).toBeUndefined();
    expect(getMetricChip("nope", "pass")).toBeUndefined();
  });

  it("returns undefined when there is no status and no pass flag", () => {
    expect(getMetricChip({ score: 0.9 }, "pass")).toBeUndefined();
  });
});
