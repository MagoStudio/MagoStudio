import { describe, expect, it } from "vitest";

import { summarizeLatestFileCheck } from "./summarizeLatestFileCheck";

const checkedAt = "2026-11-11T12:40:00.000Z";

describe("summarizeLatestFileCheck", () => {
  it("summarizes which check ran, its outcome and when", () => {
    expect(
      summarizeLatestFileCheck({
        status: "success",
        message: "Loaded",
        details: { action: "load", recordedAt: checkedAt }
      })
    ).toEqual({ kind: "load", outcome: "passed", checkedAt });
  });

  it("reads mismatches and errors as failed, unknown results as inconclusive", () => {
    const outcomeOf = (
      status: "mismatch" | "error" | "unknown" | "unsupported"
    ) =>
      summarizeLatestFileCheck({
        status,
        message: status,
        details: { action: "compatibility", recordedAt: checkedAt }
      })?.outcome;
    expect(outcomeOf("mismatch")).toBe("failed");
    expect(outcomeOf("error")).toBe("failed");
    expect(outcomeOf("unknown")).toBe("inconclusive");
    expect(outcomeOf("unsupported")).toBe("inconclusive");
  });

  it("returns nothing without a file check or a recorded time", () => {
    expect(summarizeLatestFileCheck(undefined)).toBeNull();
    expect(
      summarizeLatestFileCheck({
        status: "success",
        message: "ok",
        details: { action: "runtime", recordedAt: checkedAt }
      })
    ).toBeNull();
    expect(
      summarizeLatestFileCheck({
        status: "success",
        message: "ok",
        details: { action: "load" }
      })
    ).toBeNull();
  });
});
