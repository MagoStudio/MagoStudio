import { Layer } from "@schemas/layer";
import { describe, expect, it } from "vitest";

import { getMaskCropMismatchError } from "./getMaskCropMismatchError";

const makeMaskTrack = (
  cropCoordinates?: {
    top_left: [number, number];
    bottom_right: [number, number];
  },
  sourceVideoDimensions?: [number, number]
): Layer =>
  ({
    id: "mask-track",
    clips: [
      {
        data: {
          crop_coordinates: cropCoordinates,
          source_video_dimensions: sourceVideoDimensions
        }
      }
    ]
  }) as unknown as Layer;

describe("getMaskCropMismatchError", () => {
  it("blocks a cropped render with an uncropped mask", () => {
    const result = getMaskCropMismatchError({
      crop: { x: 0.5, y: 0, width: 0.5, height: 1 },
      inputVideoWidth: 1920,
      inputVideoHeight: 1080,
      maskTrack: makeMaskTrack()
    });

    expect(result).toBe(true);
  });

  it("blocks an uncropped render with a cropped mask", () => {
    const result = getMaskCropMismatchError({
      crop: undefined,
      inputVideoWidth: 1920,
      inputVideoHeight: 1080,
      maskTrack: makeMaskTrack(
        { top_left: [360, 0], bottom_right: [1920, 1080] },
        [1920, 1080]
      )
    });

    expect(result).toBe(true);
  });

  it("allows matching crops", () => {
    const result = getMaskCropMismatchError({
      crop: { x: 0.1875, y: 0, width: 0.8125, height: 1 },
      inputVideoWidth: 1920,
      inputVideoHeight: 1080,
      maskTrack: makeMaskTrack(
        { top_left: [360, 0], bottom_right: [1920, 1080] },
        [1920, 1080]
      )
    });

    expect(result).toBe(false);
  });

  it("allows neither side cropped", () => {
    const result = getMaskCropMismatchError({
      crop: undefined,
      inputVideoWidth: 1920,
      inputVideoHeight: 1080,
      maskTrack: makeMaskTrack()
    });

    expect(result).toBe(false);
  });

  it("blocks when the crops differ", () => {
    const result = getMaskCropMismatchError({
      crop: { x: 0, y: 0, width: 0.5, height: 1 },
      inputVideoWidth: 1920,
      inputVideoHeight: 1080,
      maskTrack: makeMaskTrack(
        { top_left: [360, 0], bottom_right: [1920, 1080] },
        [1920, 1080]
      )
    });

    expect(result).toBe(true);
  });

  it("treats a full-frame render selection as uncropped", () => {
    const result = getMaskCropMismatchError({
      crop: { x: 0, y: 0, width: 1, height: 1 },
      inputVideoWidth: 1920,
      inputVideoHeight: 1080,
      maskTrack: makeMaskTrack()
    });

    expect(result).toBe(false);
  });

  it("returns false without a maskTrack", () => {
    const result = getMaskCropMismatchError({
      crop: undefined,
      inputVideoWidth: 1920,
      inputVideoHeight: 1080,
      maskTrack: undefined
    });

    expect(result).toBe(false);
  });
});
