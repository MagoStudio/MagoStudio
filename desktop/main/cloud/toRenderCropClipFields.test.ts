import { describe, expect, test } from "vitest";

import { toRenderCropClipFields } from "./toRenderCropClipFields";

describe("toRenderCropClipFields", () => {
  test("copies the crop area and the video size it was drawn against", () => {
    expect(
      toRenderCropClipFields({
        resolution: 700,
        crop_coordinates: { top_left: [10, 20], bottom_right: [410, 320] },
        source_video_dimensions: [1920, 1080]
      })
    ).toEqual({
      crop_coordinates: { top_left: [10, 20], bottom_right: [410, 320] },
      source_video_dimensions: [1920, 1080]
    });
  });

  test("returns nothing for a render without a crop area", () => {
    expect(toRenderCropClipFields({ resolution: 700 })).toEqual({});
  });

  test("returns nothing when the video size is missing, since the crop cannot be placed", () => {
    expect(
      toRenderCropClipFields({
        crop_coordinates: { top_left: [10, 20], bottom_right: [410, 320] }
      })
    ).toEqual({});
  });
});
