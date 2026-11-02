import { describe, expect, it } from "vitest";

import { planSettingsCrop } from "./imageRenderService";

const fullHd: [number, number] = [1920, 1080];

describe("planSettingsCrop", () => {
  it("returns null when the settings carry no crop", () => {
    expect(planSettingsCrop({ prompt: "a horse" }, fullHd)).toBeNull();
  });

  it("plans the input crop and the crop-back for a valid box", () => {
    const planned = planSettingsCrop(
      {
        crop_coordinates: { top_left: [960, 0], bottom_right: [1920, 1080] },
        source_video_dimensions: [1920, 1080]
      },
      fullHd
    );

    expect(planned?.plan.requested).toEqual({ x: 960, y: 0, w: 960, h: 1080 });
    expect(planned?.plan.inputCrop).toEqual({ x: 960, y: 0, w: 960, h: 1080 });
    expect(planned?.sourceDimensions).toEqual([1920, 1080]);
  });

  it("returns null for a full-frame box so nothing is cropped", () => {
    const planned = planSettingsCrop(
      {
        crop_coordinates: { top_left: [0, 0], bottom_right: [1920, 1080] },
        source_video_dimensions: [1920, 1080]
      },
      fullHd
    );

    expect(planned).toBeNull();
  });

  it("throws rather than rendering the full frame when the box is malformed", () => {
    expect(() =>
      planSettingsCrop(
        {
          crop_coordinates: {
            top_left: ["0", "0"],
            bottom_right: ["960", "540"]
          },
          source_video_dimensions: [1920, 1080]
        },
        fullHd
      )
    ).toThrow(/malformed/);
  });

  it("throws when the box arrives without the size it was drawn against", () => {
    expect(() =>
      planSettingsCrop(
        { crop_coordinates: { top_left: [0, 0], bottom_right: [960, 540] } },
        fullHd
      )
    ).toThrow(/video size it was drawn against/);
  });

  it("throws when the box was drawn against a different video size", () => {
    expect(() =>
      planSettingsCrop(
        {
          crop_coordinates: { top_left: [0, 0], bottom_right: [640, 360] },
          source_video_dimensions: [1280, 720]
        },
        fullHd
      )
    ).toThrow(/Redraw the crop/);
  });

  it("throws when the input video size is unknown rather than cropping blind", () => {
    expect(() =>
      planSettingsCrop(
        {
          crop_coordinates: { top_left: [0, 0], bottom_right: [960, 540] },
          source_video_dimensions: [1920, 1080]
        },
        [0, 0]
      )
    ).toThrow(/size is unknown/);
  });

  it("throws on a zero-area box", () => {
    expect(() =>
      planSettingsCrop(
        {
          crop_coordinates: { top_left: [100, 100], bottom_right: [100, 100] },
          source_video_dimensions: [1920, 1080]
        },
        fullHd
      )
    ).toThrow();
  });
});
