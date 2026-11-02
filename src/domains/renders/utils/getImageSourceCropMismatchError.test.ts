import { SourceImage } from "@domains/renders/types";
import { Layer } from "@schemas/layer";
import { describe, expect, it } from "vitest";

import { getImageSourceCropMismatchError } from "./getImageSourceCropMismatchError";

const CROP_RIGHT_HALF = { x: 0.5, y: 0, width: 0.5, height: 1 };

const makeTrackWithCrop = (
  assetId: string,
  cropCoordinates: {
    top_left: [number, number];
    bottom_right: [number, number];
  },
  sourceVideoDimensions: [number, number]
): Layer =>
  ({
    id: `track-${assetId}`,
    clips: [
      {
        asset_id: assetId,
        data: {
          crop_coordinates: cropCoordinates,
          source_video_dimensions: sourceVideoDimensions
        }
      }
    ]
  }) as unknown as Layer;

describe("getImageSourceCropMismatchError", () => {
  it("returns false when there is no stylize frame source", () => {
    expect(
      getImageSourceCropMismatchError({
        crop: CROP_RIGHT_HALF,
        inputVideoWidth: 1920,
        inputVideoHeight: 1080,
        sources: [],
        tracks: []
      })
    ).toBe(false);
  });

  it("accepts an image with no crop against a cropped render (no api rejection)", () => {
    const sources: SourceImage[] = [
      { asset_id: "upload-1", type: "reference_frame" }
    ];
    expect(
      getImageSourceCropMismatchError({
        crop: CROP_RIGHT_HALF,
        inputVideoWidth: 1920,
        inputVideoHeight: 1080,
        sources,
        tracks: []
      })
    ).toBe(false);
  });

  it("blocks when the source-stamped crop differs from the render crop", () => {
    const sources: SourceImage[] = [
      {
        asset_id: "frame-1",
        type: "key_frame",
        index: 0,
        crop_coordinates: { top_left: [0, 0], bottom_right: [960, 1080] },
        source_video_dimensions: [1920, 1080]
      }
    ];
    expect(
      getImageSourceCropMismatchError({
        crop: CROP_RIGHT_HALF,
        inputVideoWidth: 1920,
        inputVideoHeight: 1080,
        sources,
        tracks: []
      })
    ).toBe(true);
  });

  it("allows when the source-stamped crop matches the render crop", () => {
    const sources: SourceImage[] = [
      {
        asset_id: "frame-1",
        type: "key_frame",
        index: 0,
        crop_coordinates: { top_left: [960, 0], bottom_right: [1920, 1080] },
        source_video_dimensions: [1920, 1080]
      }
    ];
    expect(
      getImageSourceCropMismatchError({
        crop: CROP_RIGHT_HALF,
        inputVideoWidth: 1920,
        inputVideoHeight: 1080,
        sources,
        tracks: []
      })
    ).toBe(false);
  });

  it("blocks when the image is cropped but the render is not", () => {
    const sources: SourceImage[] = [
      {
        asset_id: "frame-1",
        type: "key_frame",
        index: 0,
        crop_coordinates: { top_left: [960, 0], bottom_right: [1920, 1080] },
        source_video_dimensions: [1920, 1080]
      }
    ];
    expect(
      getImageSourceCropMismatchError({
        crop: undefined,
        inputVideoWidth: 1920,
        inputVideoHeight: 1080,
        sources,
        tracks: []
      })
    ).toBe(true);
  });

  it("matches a style_reference entry (V5.0.0's Stylize first frame slot)", () => {
    const sources: SourceImage[] = [
      {
        asset_id: "frame-1",
        type: "style_reference",
        crop_coordinates: { top_left: [0, 0], bottom_right: [960, 1080] },
        source_video_dimensions: [1920, 1080]
      }
    ];
    expect(
      getImageSourceCropMismatchError({
        crop: CROP_RIGHT_HALF,
        inputVideoWidth: 1920,
        inputVideoHeight: 1080,
        sources,
        tracks: []
      })
    ).toBe(true);
  });

  it("falls back to the originating track's crop when the source has none stamped", () => {
    const sources: SourceImage[] = [
      { asset_id: "render-1", type: "reference_frame" }
    ];
    const tracks = [
      makeTrackWithCrop(
        "render-1",
        { top_left: [0, 0], bottom_right: [960, 1080] },
        [1920, 1080]
      )
    ];
    expect(
      getImageSourceCropMismatchError({
        crop: CROP_RIGHT_HALF,
        inputVideoWidth: 1920,
        inputVideoHeight: 1080,
        sources,
        tracks
      })
    ).toBe(true);
  });
});
