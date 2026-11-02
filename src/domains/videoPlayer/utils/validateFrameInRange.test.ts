import { describe, it, expect } from "vitest";

import {
  validateFrameInRange,
  clampFrameToRange
} from "./validateFrameInRange";

describe("validateFrameInRange", () => {
  it("should return true for frame within range", () => {
    expect(validateFrameInRange(5, 0, 10)).toBe(true);
    expect(validateFrameInRange(0, 0, 10)).toBe(true);
    expect(validateFrameInRange(10, 0, 10)).toBe(true);
  });

  it("should return false for frame outside range", () => {
    expect(validateFrameInRange(-1, 0, 10)).toBe(false);
    expect(validateFrameInRange(11, 0, 10)).toBe(false);
  });

  it("should return false for invalid range", () => {
    expect(validateFrameInRange(5, Infinity, -Infinity)).toBe(false);
    expect(validateFrameInRange(5, Infinity, 10)).toBe(false);
    expect(validateFrameInRange(5, 0, -Infinity)).toBe(false);
  });
});

describe("clampFrameToRange", () => {
  it("should return frame if within range", () => {
    expect(clampFrameToRange(5, 0, 10)).toBe(5);
    expect(clampFrameToRange(0, 0, 10)).toBe(0);
    expect(clampFrameToRange(10, 0, 10)).toBe(10);
  });

  it("should clamp frame to start if below range", () => {
    expect(clampFrameToRange(-5, 0, 10)).toBe(0);
    expect(clampFrameToRange(-1, 5, 15)).toBe(5);
  });

  it("should clamp frame to end if above range", () => {
    expect(clampFrameToRange(15, 0, 10)).toBe(10);
    expect(clampFrameToRange(20, 5, 15)).toBe(15);
  });

  it("should return 0 for invalid range", () => {
    expect(clampFrameToRange(5, Infinity, -Infinity)).toBe(0);
    expect(clampFrameToRange(5, Infinity, 10)).toBe(0);
    expect(clampFrameToRange(5, 0, -Infinity)).toBe(0);
  });
});
