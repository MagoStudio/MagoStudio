import { describe, expect, it } from "vitest";

import { formatMinutesAndSeconds } from "./formatMinutesAndSeconds";

describe("formatMinutesAndSeconds", () => {
  it.each([
    [0, "0:00"],
    [9_999, "0:09"],
    [30_000, "0:30"],
    [120_000, "2:00"],
    [-500, "0:00"]
  ])("formats %i ms as %s", (durationMs, expected) => {
    expect(formatMinutesAndSeconds(durationMs)).toBe(expected);
  });
});
