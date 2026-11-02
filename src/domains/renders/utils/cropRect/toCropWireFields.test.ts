import { describe, expect, it } from "vitest";

import { toCropWireFields } from "./toCropWireFields";

describe("toCropWireFields", () => {
  it("emits integer crop_coordinates and source_video_dimensions for a meaningful crop", () => {
    const result = toCropWireFields({
      crop: { x: 0.5, y: 0, width: 0.5, height: 1 },
      sourceWidth: 1920,
      sourceHeight: 1080
    });

    expect(result).toEqual({
      crop_coordinates: { top_left: [960, 0], bottom_right: [1920, 1080] },
      source_video_dimensions: [1920, 1080]
    });
  });

  it("emits nothing when there is no crop", () => {
    expect(
      toCropWireFields({
        crop: undefined,
        sourceWidth: 1920,
        sourceHeight: 1080
      })
    ).toEqual({});
  });

  it("emits nothing for a full-frame crop", () => {
    expect(
      toCropWireFields({
        crop: { x: 0, y: 0, width: 1, height: 1 },
        sourceWidth: 1920,
        sourceHeight: 1080
      })
    ).toEqual({});
  });

  it("emits nothing for a zero-area crop", () => {
    expect(
      toCropWireFields({
        crop: { x: 0.5, y: 0.5, width: 0, height: 0 },
        sourceWidth: 1920,
        sourceHeight: 1080
      })
    ).toEqual({});
  });

  it("emits nothing when source dimensions are missing", () => {
    expect(
      toCropWireFields({
        crop: { x: 0.5, y: 0, width: 0.5, height: 1 },
        sourceWidth: undefined,
        sourceHeight: undefined
      })
    ).toEqual({});
  });
});
