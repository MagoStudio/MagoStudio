import { describe, expect, it } from "vitest";

import { findNewestRecordedResult } from "./findNewestRecordedResult";

const recordedAt = (iso: string, message: string) => ({
  status: "success" as const,
  message,
  details: { recordedAt: iso }
});

describe("findNewestRecordedResult", () => {
  it("returns the result recorded last", () => {
    expect(
      findNewestRecordedResult([
        recordedAt("2026-11-10T10:00:00.000Z", "older"),
        undefined,
        recordedAt("2026-11-11T10:00:00.000Z", "newer")
      ])?.message
    ).toBe("newer");
  });

  it("returns nothing when no result was recorded", () => {
    expect(findNewestRecordedResult([undefined, undefined])).toBeUndefined();
  });
});
