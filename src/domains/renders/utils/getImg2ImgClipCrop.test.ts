import { Clip } from "@schemas/clip";
import { describe, expect, it } from "vitest";

import { getImg2ImgClipCrop } from "./getImg2ImgClipCrop";

const makeClip = (settings?: Record<string, unknown>): Clip =>
  ({ data: { settings } }) as unknown as Clip;

describe("getImg2ImgClipCrop", () => {
  it("returns the crop stored on the clip's data.settings", () => {
    const clip = makeClip({
      crop_coordinates: { top_left: [100, 50], bottom_right: [900, 700] },
      source_video_dimensions: [1920, 1080]
    });

    expect(getImg2ImgClipCrop(clip)).toEqual({
      crop_coordinates: { top_left: [100, 50], bottom_right: [900, 700] },
      source_video_dimensions: [1920, 1080]
    });
  });

  it("returns undefined when the clip has no crop", () => {
    expect(getImg2ImgClipCrop(makeClip({ num_images: 1 }))).toBeUndefined();
  });

  it("returns undefined when source_video_dimensions is missing", () => {
    const clip = makeClip({
      crop_coordinates: { top_left: [100, 50], bottom_right: [900, 700] }
    });
    expect(getImg2ImgClipCrop(clip)).toBeUndefined();
  });

  it("returns undefined for an undefined clip", () => {
    expect(getImg2ImgClipCrop(undefined)).toBeUndefined();
  });
});
