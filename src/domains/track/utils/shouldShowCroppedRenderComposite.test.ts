import { Layer } from "@schemas/layer";
import { describe, expect, it } from "vitest";

import { shouldShowCroppedRenderComposite } from "./shouldShowCroppedRenderComposite";

const makeTrack = (
  id: string,
  cropCoordinates?: {
    top_left: [number, number];
    bottom_right: [number, number];
  },
  sourceVideoDimensions?: [number, number]
): Layer =>
  ({
    id,
    clips: [
      {
        data: {
          crop_coordinates: cropCoordinates,
          source_video_dimensions: sourceVideoDimensions
        }
      }
    ]
  }) as unknown as Layer;

describe("shouldShowCroppedRenderComposite", () => {
  it("returns true for a selected render track with a stored crop, distinct from the input video", () => {
    const result = shouldShowCroppedRenderComposite({
      selectedTrack: makeTrack(
        "render-1",
        { top_left: [960, 0], bottom_right: [1920, 1080] },
        [1920, 1080]
      ),
      inputVideoTrack: makeTrack("video-1")
    });

    expect(result).toBe(true);
  });

  it("returns false when the selected track has no stored crop", () => {
    const result = shouldShowCroppedRenderComposite({
      selectedTrack: makeTrack("render-1"),
      inputVideoTrack: makeTrack("video-1")
    });

    expect(result).toBe(false);
  });

  it("returns false when the selected track is the input video track itself", () => {
    const track = makeTrack(
      "video-1",
      { top_left: [960, 0], bottom_right: [1920, 1080] },
      [1920, 1080]
    );

    const result = shouldShowCroppedRenderComposite({
      selectedTrack: track,
      inputVideoTrack: track
    });

    expect(result).toBe(false);
  });

  it("returns false when either track is undefined", () => {
    expect(
      shouldShowCroppedRenderComposite({
        selectedTrack: undefined,
        inputVideoTrack: makeTrack("video-1")
      })
    ).toBe(false);
    expect(
      shouldShowCroppedRenderComposite({
        selectedTrack: makeTrack("render-1"),
        inputVideoTrack: undefined
      })
    ).toBe(false);
  });
});
