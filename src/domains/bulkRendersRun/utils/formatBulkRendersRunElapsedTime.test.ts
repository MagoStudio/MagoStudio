import { describe, expect, it } from "vitest";

import { formatBulkRendersRunElapsedTime } from "./formatBulkRendersRunElapsedTime";

describe("formatBulkRendersRunElapsedTime", () => {
  it("formats a sub-minute elapsed time", () => {
    const elapsed = formatBulkRendersRunElapsedTime({
      startedAt: "2026-07-29T12:00:00Z",
      now: new Date("2026-07-29T12:00:05Z")
    });

    expect(elapsed).toBe("00:00:05");
  });

  it("formats an elapsed time that crosses an hour", () => {
    const elapsed = formatBulkRendersRunElapsedTime({
      startedAt: "2026-07-29T12:00:00Z",
      now: new Date("2026-07-29T13:01:01Z")
    });

    expect(elapsed).toBe("01:01:01");
  });

  it("returns undefined when the run has no start yet", () => {
    const elapsed = formatBulkRendersRunElapsedTime({
      startedAt: null,
      now: new Date("2026-07-29T13:01:01Z")
    });

    expect(elapsed).toBeUndefined();
  });
});
