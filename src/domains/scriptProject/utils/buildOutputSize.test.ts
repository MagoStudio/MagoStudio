import { describe, expect, it } from "vitest";

import { buildOutputSize, matchOutputSize } from "./buildOutputSize";

describe("buildOutputSize", () => {
  it("reads the resolution as the short edge, for landscape and portrait alike", () => {
    expect(buildOutputSize("16:9", "768p")).toEqual([1368, 768]);
    expect(buildOutputSize("9:16", "768p")).toEqual([768, 1368]);
  });

  it("handles the squarer ratios", () => {
    expect(buildOutputSize("4:3", "768p")).toEqual([1024, 768]);
    expect(buildOutputSize("3:4", "768p")).toEqual([768, 1024]);
    expect(buildOutputSize("1:1", "768p")).toEqual([768, 768]);
  });

  it("scales with the resolution", () => {
    expect(buildOutputSize("16:9", "480p")).toEqual([856, 480]);
    expect(buildOutputSize("16:9", "720p")).toEqual([1280, 720]);
    expect(buildOutputSize("16:9", "1080p")).toEqual([1920, 1080]);
  });

  it("always returns multiples of 8, which the models require", () => {
    for (const ratio of ["16:9", "9:16", "4:3", "3:4", "1:1"] as const) {
      for (const resolution of ["768p", "1080p"] as const) {
        const [width, height] = buildOutputSize(ratio, resolution);
        expect(width % 8).toBe(0);
        expect(height % 8).toBe(0);
      }
    }
  });
});

describe("matchOutputSize", () => {
  it("recognises a size the controls produced", () => {
    expect(matchOutputSize([1920, 1080])).toEqual({
      aspectRatioId: "16:9",
      resolutionId: "1080p"
    });
  });

  it("matches the nearest aspect and tier for a size set elsewhere", () => {
    expect(matchOutputSize([1234, 567])).toEqual({
      aspectRatioId: "16:9",
      resolutionId: "480p"
    });
  });

  it("falls back to the default when the project has no size yet", () => {
    expect(matchOutputSize(undefined)).toEqual({
      aspectRatioId: "9:16",
      resolutionId: "720p"
    });
  });

  it("keeps every offered size on the 8px grid", () => {
    const aspectRatioIds = ["16:9", "9:16", "4:3", "3:4", "1:1"] as const;
    const resolutionIds = ["768p", "1080p"] as const;

    for (const aspectRatioId of aspectRatioIds) {
      for (const resolutionId of resolutionIds) {
        const [width, height] = buildOutputSize(aspectRatioId, resolutionId);
        expect(width % 8).toBe(0);
        expect(height % 8).toBe(0);
        expect(Math.min(width, height)).toBeGreaterThanOrEqual(768);
      }
    }
  });
});
