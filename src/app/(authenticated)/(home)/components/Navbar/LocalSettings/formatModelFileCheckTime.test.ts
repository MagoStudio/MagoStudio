import { describe, expect, it } from "vitest";

import { formatModelFileCheckTime } from "./formatModelFileCheckTime";

describe("formatModelFileCheckTime", () => {
  it("formats the check time as a medium date with a short time in the given language", () => {
    const checkedAt = "2026-11-11T12:40:00.000Z";
    expect(formatModelFileCheckTime(checkedAt, "en")).toBe(
      new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(checkedAt))
    );
    expect(formatModelFileCheckTime(checkedAt, "en")).toContain("2026");
  });
});
