import { describe, it, expect } from "vitest";

import { snapToClosestValidBounds } from "./snapToClosestValidBounds";

describe("snapToClosestValidBounds", () => {
  it.each([
    {
      description: "should return the same range",
      range: [10, 20] as [number, number],
      inputTrackOffset: 0,
      inputTrackDuration: 30,
      expected: [10, 20] as [number, number]
    },
    {
      description: "should return the same range when exactly at bounds",
      range: [5, 15] as [number, number],
      inputTrackOffset: 5,
      inputTrackDuration: 10,
      expected: [5, 15] as [number, number]
    },
    {
      description: "should snap min to validMin and preserve range length",
      range: [5, 15] as [number, number],
      inputTrackOffset: 10,
      inputTrackDuration: 20,
      expected: [10, 20] as [number, number]
    },
    {
      description:
        "should snap min to validMin and cap max at validMax if range is too long",
      range: [0, 50] as [number, number],
      inputTrackOffset: 10,
      inputTrackDuration: 20,
      expected: [10, 30] as [number, number]
    },
    {
      description: "should handle negative min values",
      range: [-5, 5] as [number, number],
      inputTrackOffset: 0,
      inputTrackDuration: 20,
      expected: [0, 10] as [number, number]
    },
    {
      description: "should snap max to validMax and preserve range length",
      range: [20, 30] as [number, number],
      inputTrackOffset: 0,
      inputTrackDuration: 25,
      expected: [15, 25] as [number, number]
    },
    {
      description:
        "should snap max to validMax and set min to validMin if range is too long",
      range: [20, 100] as [number, number],
      inputTrackOffset: 10,
      inputTrackDuration: 20,
      expected: [10, 30] as [number, number]
    },
    {
      description: "should handle max exceeding validMax by large margin",
      range: [10, 100] as [number, number],
      inputTrackOffset: 0,
      inputTrackDuration: 50,
      expected: [0, 50] as [number, number]
    },
    {
      description: "should snap to validMin when both are before valid range",
      range: [0, 5] as [number, number],
      inputTrackOffset: 10,
      inputTrackDuration: 20,
      expected: [10, 15] as [number, number]
    },
    {
      description:
        "should snap to validMin when range spans across valid range",
      range: [0, 100] as [number, number],
      inputTrackOffset: 10,
      inputTrackDuration: 20,
      expected: [10, 30] as [number, number]
    },
    {
      description: "should handle zero-length range",
      range: [5, 5] as [number, number],
      inputTrackOffset: 10,
      inputTrackDuration: 20,
      expected: [10, 10] as [number, number]
    },
    {
      description: "should handle zero duration input track",
      range: [10, 20] as [number, number],
      inputTrackOffset: 15,
      inputTrackDuration: 0,
      expected: [15, 15] as [number, number]
    },
    {
      description: "should handle input track at zero offset",
      range: [-5, 5] as [number, number],
      inputTrackOffset: 0,
      inputTrackDuration: 10,
      expected: [0, 10] as [number, number]
    },
    {
      description: "should handle very large offset values",
      range: [1000, 1010] as [number, number],
      inputTrackOffset: 2000,
      inputTrackDuration: 100,
      expected: [2000, 2010] as [number, number]
    },
    {
      description: "should handle dragging left handle before clip start",
      range: [30, 60] as [number, number],
      inputTrackOffset: 50,
      inputTrackDuration: 50,
      expected: [50, 80] as [number, number]
    },
    {
      description: "should handle dragging right handle past clip end",
      range: [70, 120] as [number, number],
      inputTrackOffset: 50,
      inputTrackDuration: 50,
      expected: [50, 100] as [number, number]
    },
    {
      description: "should handle selecting entire timeline beyond clip",
      range: [0, 200] as [number, number],
      inputTrackOffset: 50,
      inputTrackDuration: 50,
      expected: [50, 100] as [number, number]
    },
    {
      description: "should handle small range selection before clip",
      range: [10, 15] as [number, number],
      inputTrackOffset: 50,
      inputTrackDuration: 100,
      expected: [50, 55] as [number, number]
    }
  ])(
    "$description",
    ({ range, inputTrackOffset, inputTrackDuration, expected }) => {
      const result = snapToClosestValidBounds(
        range,
        inputTrackOffset,
        inputTrackDuration
      );
      expect(result).toEqual(expected);
    }
  );
});
