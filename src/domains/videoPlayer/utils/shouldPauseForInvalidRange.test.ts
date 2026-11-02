import { Layer } from "@schemas/layer";
import { describe, it, expect } from "vitest";

import { shouldPauseForInvalidRange } from "./shouldPauseForInvalidRange";

describe("shouldPauseForInvalidRange", () => {
  const createMockLayer = (
    id: string,
    duration: number = 100,
    timelineOffset: number = 0
  ): Layer =>
    ({
      id,
      clips: [
        {
          asset: {
            data: {
              duration
            }
          },
          data: {
            timeline_offset: timelineOffset
          }
        }
      ]
    }) as Layer;

  describe("when selectedLayers is empty", () => {
    it("should return true", () => {
      const result = shouldPauseForInvalidRange([], { start: 0, end: 100 });
      expect(result).toBe(true);
    });
  });

  describe("when selectedLayers is null/undefined", () => {
    it("should return true for null", () => {
      const result = shouldPauseForInvalidRange(null as any, {
        start: 0,
        end: 100
      });
      expect(result).toBe(true);
    });
  });

  describe("when no valid video tracks exist", () => {
    it("should return true for tracks with duration <= 1", () => {
      const layers = [createMockLayer("1", 1), createMockLayer("2", 0)];
      const result = shouldPauseForInvalidRange(layers, { start: 0, end: 100 });
      expect(result).toBe(true);
    });
  });

  describe("when globalPlayableFrameRange is invalid", () => {
    it("should return true when start is Infinity", () => {
      const layers = [createMockLayer("1", 100)];
      const result = shouldPauseForInvalidRange(layers, {
        start: Infinity,
        end: 100
      });
      expect(result).toBe(true);
    });

    it("should return true when end is -Infinity", () => {
      const layers = [createMockLayer("1", 100)];
      const result = shouldPauseForInvalidRange(layers, {
        start: 0,
        end: -Infinity
      });
      expect(result).toBe(true);
    });
  });

  describe("when range is too short to be playable", () => {
    it("should return true for range with length <= 1", () => {
      const layers = [createMockLayer("1", 100)];
      const result = shouldPauseForInvalidRange(layers, { start: 5, end: 6 });
      expect(result).toBe(true);
    });

    it("should return true for range with length exactly 1", () => {
      const layers = [createMockLayer("1", 100)];
      const result = shouldPauseForInvalidRange(layers, { start: 5, end: 5 });
      expect(result).toBe(true);
    });
  });

  describe("when conditions are valid for playback", () => {
    it("should return false for valid layers and playable range", () => {
      const layers = [createMockLayer("1", 100)];
      const result = shouldPauseForInvalidRange(layers, { start: 0, end: 50 });
      expect(result).toBe(false);
    });

    it("should return false for multiple valid layers", () => {
      const layers = [
        createMockLayer("1", 100, 0),
        createMockLayer("2", 80, 10)
      ];
      const result = shouldPauseForInvalidRange(layers, { start: 0, end: 50 });
      expect(result).toBe(false);
    });
  });
});
