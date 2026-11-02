import { describe, expect, it } from "vitest";

import { formatETA } from "./formatEta";

describe("formatETA", () => {
  it("returns an empty string for undefined or zero", () => {
    expect(formatETA(undefined)).toBe("");
    expect(formatETA(0)).toBe("");
  });

  it("formats a sub-hour duration as HH:MM:SS", () => {
    expect(formatETA(90_000)).toBe(" 00:01:30");
  });

  it("formats an hour-plus duration", () => {
    expect(formatETA(3_661_000)).toBe(" 01:01:01");
  });

  it("prefixes the day count past 24h", () => {
    expect(formatETA(90_000_000)).toBe("1d 01:00:00");
  });
});
