import { describe, expect, it } from "vitest";

import { toNormalizedCropRectFromWireFields } from "./toNormalizedCropRectFromWireFields";

describe("toNormalizedCropRectFromWireFields", () => {
  it("normalizes absolute wire coordinates against the source dimensions", () => {
    expect(
      toNormalizedCropRectFromWireFields({
        crop_coordinates: { top_left: [360, 0], bottom_right: [1920, 1080] },
        source_video_dimensions: [1920, 1080]
      })
    ).toEqual({ x: 360 / 1920, y: 0, width: 1560 / 1920, height: 1 });
  });

  it("returns undefined when there are no wire fields at all", () => {
    expect(toNormalizedCropRectFromWireFields(undefined)).toBeUndefined();
    expect(toNormalizedCropRectFromWireFields({})).toBeUndefined();
  });

  it("returns undefined when the source dimensions are missing", () => {
    expect(
      toNormalizedCropRectFromWireFields({
        crop_coordinates: { top_left: [0, 0], bottom_right: [100, 100] }
      })
    ).toBeUndefined();
  });

  it("returns undefined when a coordinate pair is not two finite numbers", () => {
    expect(
      toNormalizedCropRectFromWireFields({
        crop_coordinates: {
          top_left: [Number.NaN, 0],
          bottom_right: [100, 100]
        },
        source_video_dimensions: [1920, 1080]
      })
    ).toBeUndefined();
  });

  it("returns undefined when a source dimension is zero or negative", () => {
    expect(
      toNormalizedCropRectFromWireFields({
        crop_coordinates: { top_left: [0, 0], bottom_right: [100, 100] },
        source_video_dimensions: [0, 1080]
      })
    ).toBeUndefined();
  });
});
