import { Layer } from "@schemas/layer";
import { describe, expect, it } from "vitest";

import { getTrackCropSettings } from "./getTrackCropSettings";

describe("getTrackCropSettings", () => {
  it("returns the stored crop when the clip carries crop data", () => {
    const track: Partial<Layer> = {
      clips: [
        {
          data: {
            crop_coordinates: {
              top_left: [360, 0],
              bottom_right: [1920, 1080]
            },
            source_video_dimensions: [1920, 1080]
          }
        } as Layer["clips"][0]
      ]
    };

    expect(getTrackCropSettings(track as Layer)).toEqual({
      cropCoordinates: { topLeft: [360, 0], bottomRight: [1920, 1080] },
      sourceVideoDimensions: [1920, 1080]
    });
  });

  it("returns undefined when the clip carries no crop fields", () => {
    const track: Partial<Layer> = {
      clips: [{ data: {} } as Layer["clips"][0]]
    };

    expect(getTrackCropSettings(track as Layer)).toBeUndefined();
  });

  it("returns undefined for an undefined track", () => {
    expect(getTrackCropSettings(undefined)).toBeUndefined();
  });

  it("returns undefined without throwing for a track with no clips", () => {
    expect(
      getTrackCropSettings({ clips: [] } as Partial<Layer> as Layer)
    ).toBeUndefined();
  });
});
