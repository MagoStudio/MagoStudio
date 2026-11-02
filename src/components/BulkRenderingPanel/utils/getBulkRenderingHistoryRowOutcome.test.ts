import { describe, expect, it } from "vitest";

import { getBulkRenderingHistoryRowOutcome } from "./getBulkRenderingHistoryRowOutcome";

describe("getBulkRenderingHistoryRowOutcome", () => {
  it("marks a cancelled run in the same tone as the row's other statistics", () => {
    expect(getBulkRenderingHistoryRowOutcome("CANCELLED")).toEqual({
      labelKey: "status.cancelled.label",
      tone: "glyph-secondary"
    });
  });

  it("marks a failed run in the error tone", () => {
    expect(getBulkRenderingHistoryRowOutcome("FAILED")).toEqual({
      labelKey: "status.failed.label",
      tone: "glyph-error"
    });
  });

  it.each(["COMPLETED", "RUNNING", "PENDING", "PAUSED"] as const)(
    "marks a %s run with nothing, so only an abnormal end is called out",
    (status) => {
      expect(getBulkRenderingHistoryRowOutcome(status)).toBeUndefined();
    }
  );
});
