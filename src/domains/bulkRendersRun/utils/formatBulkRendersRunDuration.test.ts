import { describe, expect, it } from "vitest";

import { formatBulkRendersRunDuration } from "./formatBulkRendersRunDuration";

describe("formatBulkRendersRunDuration", () => {
  it("formats a sub-minute duration", () => {
    expect(
      formatBulkRendersRunDuration({
        startedAt: "2026-07-29T12:00:00Z",
        finishedAt: "2026-07-29T12:00:45Z"
      })
    ).toBe("0m 45s");
  });

  it("formats a duration that crosses an hour as accumulated minutes, not hours", () => {
    expect(
      formatBulkRendersRunDuration({
        startedAt: "2026-07-29T12:00:00Z",
        finishedAt: "2026-07-29T13:02:05Z"
      })
    ).toBe("62m 05s");
  });

  it("returns undefined when the start time is absent", () => {
    expect(
      formatBulkRendersRunDuration({
        startedAt: null,
        finishedAt: "2026-07-29T12:00:45Z"
      })
    ).toBeUndefined();
  });

  it("returns undefined when the finish time is absent", () => {
    expect(
      formatBulkRendersRunDuration({
        startedAt: "2026-07-29T12:00:00Z",
        finishedAt: null
      })
    ).toBeUndefined();
  });
});
