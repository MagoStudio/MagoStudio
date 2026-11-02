import { describe, expect, it } from "vitest";

import { toPositiveSettingNumber } from "./toPositiveSettingNumber";

describe("toPositiveSettingNumber", () => {
  it("passes through a positive number", () => {
    expect(toPositiveSettingNumber(1280)).toBe(1280);
    expect(toPositiveSettingNumber(0.4)).toBe(0.4);
  });

  it("converts a numeric string", () => {
    expect(toPositiveSettingNumber("1280")).toBe(1280);
  });

  it("falls back for a value that is not a positive number", () => {
    expect(toPositiveSettingNumber(undefined)).toBe(0);
    expect(toPositiveSettingNumber(null)).toBe(0);
    expect(toPositiveSettingNumber("wide")).toBe(0);
    expect(toPositiveSettingNumber({})).toBe(0);
    expect(toPositiveSettingNumber([1920, 1080])).toBe(0);
    expect(toPositiveSettingNumber(0)).toBe(0);
    expect(toPositiveSettingNumber(-5)).toBe(0);
    expect(toPositiveSettingNumber(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it("uses the caller's fallback", () => {
    expect(toPositiveSettingNumber(undefined, 8)).toBe(8);
    expect(toPositiveSettingNumber({}, 1280)).toBe(1280);
  });
});
