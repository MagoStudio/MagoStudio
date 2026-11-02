import { describe, expect, it } from "vitest";

import { getBulkRenderingHistoryRowErrorSummary } from "./getBulkRenderingHistoryRowErrorSummary";

describe("getBulkRenderingHistoryRowErrorSummary", () => {
  it("reports unavailable when the counts are undefined", () => {
    const summary = getBulkRenderingHistoryRowErrorSummary({
      status: "COMPLETED",
      imageChainErrorCount: undefined,
      videoChainErrorCount: undefined
    });

    expect(summary).toEqual({ status: "unavailable" });
  });

  it("reports unavailable for a cancelled run rather than claiming zero errors", () => {
    const summary = getBulkRenderingHistoryRowErrorSummary({
      status: "CANCELLED",
      imageChainErrorCount: 0,
      videoChainErrorCount: 0
    });

    expect(summary).toEqual({ status: "unavailable" });
  });

  it("still reports a cancelled run's real errors, because they happened before the cancel", () => {
    const summary = getBulkRenderingHistoryRowErrorSummary({
      status: "CANCELLED",
      imageChainErrorCount: 2,
      videoChainErrorCount: 1
    });

    expect(summary).toEqual({
      status: "present",
      imageErrorCount: 2,
      videoErrorCount: 1
    });
  });

  it("reports clear when both counts are zero", () => {
    const summary = getBulkRenderingHistoryRowErrorSummary({
      status: "COMPLETED",
      imageChainErrorCount: 0,
      videoChainErrorCount: 0
    });

    expect(summary).toEqual({ status: "clear" });
  });

  it("reports unavailable for a failed run whose steps recorded no failure", () => {
    const summary = getBulkRenderingHistoryRowErrorSummary({
      status: "FAILED",
      imageChainErrorCount: 0,
      videoChainErrorCount: 0
    });

    expect(summary).toEqual({ status: "unavailable" });
  });

  it("still reports a failed run's real errors, because its steps named them", () => {
    const summary = getBulkRenderingHistoryRowErrorSummary({
      status: "FAILED",
      imageChainErrorCount: 2,
      videoChainErrorCount: 1
    });

    expect(summary).toEqual({
      status: "present",
      imageErrorCount: 2,
      videoErrorCount: 1
    });
  });

  it.each(["RUNNING", "PENDING", "PAUSED"] as const)(
    "reports clear for a %s run whose steps recorded no failure, since history never shows one",
    (status) => {
      const summary = getBulkRenderingHistoryRowErrorSummary({
        status,
        imageChainErrorCount: 0,
        videoChainErrorCount: 0
      });

      expect(summary).toEqual({ status: "clear" });
    }
  );

  it("reports errors when only image errors exist", () => {
    const summary = getBulkRenderingHistoryRowErrorSummary({
      status: "COMPLETED",
      imageChainErrorCount: 2,
      videoChainErrorCount: 0
    });

    expect(summary).toEqual({
      status: "present",
      imageErrorCount: 2,
      videoErrorCount: 0
    });
  });

  it("reports errors when only video errors exist", () => {
    const summary = getBulkRenderingHistoryRowErrorSummary({
      status: "COMPLETED",
      imageChainErrorCount: 0,
      videoChainErrorCount: 3
    });

    expect(summary).toEqual({
      status: "present",
      imageErrorCount: 0,
      videoErrorCount: 3
    });
  });

  it("reports errors when both counts are non-zero", () => {
    const summary = getBulkRenderingHistoryRowErrorSummary({
      status: "COMPLETED",
      imageChainErrorCount: 1,
      videoChainErrorCount: 4
    });

    expect(summary).toEqual({
      status: "present",
      imageErrorCount: 1,
      videoErrorCount: 4
    });
  });
});
