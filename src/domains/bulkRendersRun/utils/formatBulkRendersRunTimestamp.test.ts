import { describe, expect, it } from "vitest";

import { formatBulkRendersRunTimestamp } from "./formatBulkRendersRunTimestamp";

describe("formatBulkRendersRunTimestamp", () => {
  it("formats an ISO timestamp as time then date", () => {
    expect(formatBulkRendersRunTimestamp("2026-07-29T12:15:00")).toBe(
      "12:15 29.07.2026"
    );
  });
});
