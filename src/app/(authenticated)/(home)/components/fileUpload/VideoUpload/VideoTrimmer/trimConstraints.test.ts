import { describe, it, expect } from "vitest";

import {
  adjustTrimOnMinChange,
  adjustTrimOnMaxChange
} from "./trimConstraints";

describe("trimConstraints", () => {
  describe("adjustTrimOnMinChange", () => {
    it("should clamp min when getting too close to max (< 1 second)", () => {
      const result = adjustTrimOnMinChange(10, {
        videoDuration: 120.4522,
        currentMin: 5.2,
        currentMax: 10
      });

      expect(result.min).toBe(9);
      expect(result.max).toBe(10);
    });

    it("should clamp min to stay 1 second before max", () => {
      const result = adjustTrimOnMinChange(120, {
        videoDuration: 120.4522,
        currentMin: 100,
        currentMax: 120.3
      });

      expect(result.min).toBe(119.3);
      expect(result.max).toBe(120.3);
    });

    it("should clamp min when too far from max (> 59.9 seconds)", () => {
      const result = adjustTrimOnMinChange(10, {
        videoDuration: 120,
        currentMin: 50,
        currentMax: 80
      });

      expect(result.min).toBe(21);
      expect(result.max).toBe(80);
    });

    it("should clamp min when it would exceed max", () => {
      const result = adjustTrimOnMinChange(31, {
        videoDuration: 120,
        currentMin: 10,
        currentMax: 30
      });

      expect(result.min).toBe(29);
      expect(result.max).toBe(30);
    });

    it("should apply MAX_TRIM_RANGE constraint", () => {
      const result = adjustTrimOnMinChange(0, {
        videoDuration: 120,
        currentMin: 70,
        currentMax: 80
      });

      expect(result.min).toBe(21);
      expect(result.max).toBe(80);
    });

    it("should handle normal range adjustments without changes", () => {
      const result = adjustTrimOnMinChange(20, {
        videoDuration: 120,
        currentMin: 10,
        currentMax: 50
      });

      expect(result.min).toBe(20);
      expect(result.max).toBe(50);
    });

    it("should not allow min to go below 0", () => {
      const result = adjustTrimOnMinChange(-5, {
        videoDuration: 120,
        currentMin: 10,
        currentMax: 30
      });

      expect(result.min).toBe(0);
      expect(result.max).toBe(30);
    });

    it("should not allow min to go below 0 when max is too close to min", () => {
      const result = adjustTrimOnMinChange(-5, {
        videoDuration: 120,
        currentMin: 0,
        currentMax: 1
      });

      expect(result.min).toBe(0);
      expect(result.max).toBe(1);
    });

    it("should not allow min to go below 0 when max is too far from min", () => {
      const result = adjustTrimOnMinChange(-1, {
        videoDuration: 120,
        currentMin: 60,
        currentMax: 70
      });

      expect(result.min).toBe(11);
      expect(result.max).toBe(70);
    });

    it("should handle edge case where min would equal max", () => {
      const result = adjustTrimOnMinChange(30, {
        videoDuration: 120,
        currentMin: 10,
        currentMax: 30
      });

      expect(result.min).toBe(29);
      expect(result.max).toBe(30);
    });
  });

  describe("adjustTrimOnMaxChange", () => {
    it("should clamp max to minimum acceptable value when too close to min", () => {
      const result = adjustTrimOnMaxChange(10, {
        videoDuration: 120,
        currentMin: 10,
        currentMax: 50
      });

      expect(result.min).toBe(10);
      expect(result.max).toBe(11);
    });

    it("should clamp max to maximum acceptable value when too far from min", () => {
      const result = adjustTrimOnMaxChange(100, {
        videoDuration: 120,
        currentMin: 10,
        currentMax: 50
      });

      expect(result.min).toBe(10);
      expect(result.max).toBe(69);
    });

    it("should respect video duration constraints", () => {
      const result = adjustTrimOnMaxChange(130, {
        videoDuration: 120,
        currentMin: 10,
        currentMax: 50
      });

      expect(result.min).toBe(10);
      expect(result.max).toBe(69);
    });

    it("should handle normal range without changes", () => {
      const result = adjustTrimOnMaxChange(40, {
        videoDuration: 120,
        currentMin: 10,
        currentMax: 50
      });

      expect(result.min).toBe(10);
      expect(result.max).toBe(40);
    });

    it("should not allow max to go below min + 1", () => {
      const result = adjustTrimOnMaxChange(-5, {
        videoDuration: 120,
        currentMin: 10,
        currentMax: 50
      });

      expect(result.min).toBe(10);
      expect(result.max).toBe(11);
    });

    it("should handle edge case at video duration limit", () => {
      const result = adjustTrimOnMaxChange(120, {
        videoDuration: 120,
        currentMin: 119,
        currentMax: 120
      });

      expect(result.min).toBe(119);
      expect(result.max).toBe(120);
    });

    it("should handle max being set exactly to min", () => {
      const result = adjustTrimOnMaxChange(10, {
        videoDuration: 120,
        currentMin: 10,
        currentMax: 50
      });

      expect(result.min).toBe(10);
      expect(result.max).toBe(11);
    });

    it("should handle 1-minute video with precision edge case", () => {
      const result = adjustTrimOnMaxChange(60.3, {
        videoDuration: 60.19,
        currentMin: 20,
        currentMax: 45
      });

      expect(result.min).toBe(20);
      expect(result.max).toBe(60.19);
    });
  });
});
