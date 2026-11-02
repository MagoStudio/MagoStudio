import {
  PrepareRenderSettingsContext,
  VideoSettings
} from "@models/video/types";
import { describe, it, expect } from "vitest";

import { seedance2Model } from "./seedance2Model";

const calc = (settings: VideoSettings, frames: number) =>
  seedance2Model.calcEstimatedRenderTime(settings, frames).impactToShow;

describe("seedance2Model", () => {
  describe("calcEstimatedRenderTime", () => {
    it("1080p: 120 frames at 24fps = 5 seconds → 4165 credits", () => {
      const result = calc(
        { fps: 24, resolution: "1080p" } as VideoSettings,
        120
      );
      expect(result).toBe(4165);
    });

    it("720p: 120 frames at 24fps = 5 seconds → 1850 credits", () => {
      const result = calc(
        { fps: 24, resolution: "720p" } as VideoSettings,
        120
      );
      expect(result).toBe(1850);
    });

    it("1080p: 120 frames at 30fps = 4 seconds → 3332 credits", () => {
      const result = calc(
        { fps: 30, resolution: "1080p" } as VideoSettings,
        120
      );
      expect(result).toBe(3332);
    });

    it("720p: 120 frames at 30fps = 4 seconds → 1480 credits", () => {
      const result = calc(
        { fps: 30, resolution: "720p" } as VideoSettings,
        120
      );
      expect(result).toBe(1480);
    });

    it("rounds up partial seconds at 720p", () => {
      const result = calc(
        { fps: 24, resolution: "720p" } as VideoSettings,
        108
      );
      expect(result).toBe(Math.ceil((108 / 24) * 370));
    });

    it("uses the raw fractional duration, not Seedance 2.5's round-first formula", () => {
      const result = calc({ fps: 10, resolution: "720p" } as VideoSettings, 54);
      const rawFractionalResult = Math.ceil((54 / 10) * 370);
      const roundFirstResult = Math.ceil(Math.round(54 / 10) * 370);

      expect(result).toBe(rawFractionalResult);
      expect(result).not.toBe(roundFirstResult);
    });

    it("rounds up partial seconds at 1080p", () => {
      const result = calc(
        { fps: 24, resolution: "1080p" } as VideoSettings,
        108
      );
      expect(result).toBe(Math.ceil((108 / 24) * 833));
    });

    it("4k: 120 frames at 24fps = 5 seconds → 9375 credits", () => {
      const result = calc({ fps: 24, resolution: "4k" } as VideoSettings, 120);
      expect(result).toBe(9375);
    });

    it("4k: 120 frames at 30fps = 4 seconds → 7500 credits", () => {
      const result = calc({ fps: 30, resolution: "4k" } as VideoSettings, 120);
      expect(result).toBe(7500);
    });

    it("rounds up partial seconds at 4k", () => {
      const result = calc({ fps: 24, resolution: "4k" } as VideoSettings, 108);
      expect(result).toBe(Math.ceil((108 / 24) * 1875));
    });

    it("falls back to 24fps and 1080p pricing when neither is provided", () => {
      const result = calc({} as VideoSettings, 120);
      expect(result).toBe(4165);
    });
  });

  describe("formatValuesForBackend", () => {
    const context = {
      inputVideoWidth: 1920,
      inputVideoHeight: 1080,
      frameRange: [0, 120],
      fps: 24,
      sources: []
    };

    it("adds computed fields from context", () => {
      const result = seedance2Model.formatValuesForBackend!(
        { prompt: "test" } as VideoSettings,
        context
      );
      expect(result.fps).toBe(24);
      expect(result.width).toBe(1920);
      expect(result.height).toBe(1080);
      expect(result.resolution).toBe("1080p");
      expect(result.aspect_ratio).toBe("auto");
      expect(result.duration).toBe("auto");
      expect(result.durationInSeconds).toBe(121 / 24);
      expect(result.frameRangeSeconds).toEqual([0, 5]);
      expect(result.max_size).toBe(1);
      expect(result.steps).toBe(1);
      expect(result.upscale_chunk_size).toBe(120);
    });

    it("computes offsetInSeconds from non-zero frame start", () => {
      const result = seedance2Model.formatValuesForBackend!(
        { prompt: "test" } as VideoSettings,
        { ...context, frameRange: [48, 168] }
      );
      expect(result.offsetInSeconds).toBe(2);
      expect(result.frameRangeSeconds).toEqual([2, 7]);
    });

    it("includes image_ids derived from reference_frame sources when provided", () => {
      const result = seedance2Model.formatValuesForBackend!(
        { prompt: "test" } as VideoSettings,
        {
          ...context,
          sources: [
            { asset_id: "uuid1", type: "reference_frame" },
            { asset_id: "uuid2", type: "reference_frame" }
          ]
        }
      );
      expect(result.image_ids).toEqual(["uuid1", "uuid2"]);
    });

    it("omits image_ids when empty", () => {
      const result = seedance2Model.formatValuesForBackend!(
        { prompt: "test", image_ids: [] } as VideoSettings,
        context
      );
      expect(result.image_ids).toBeUndefined();
    });

    it("forwards user-selected resolution", () => {
      const result = seedance2Model.formatValuesForBackend!(
        { prompt: "test", resolution: "720p" } as VideoSettings,
        context
      );
      expect(result.resolution).toBe("720p");
    });

    it("forwards 4k resolution to backend", () => {
      const result = seedance2Model.formatValuesForBackend!(
        { prompt: "test", resolution: "4k" } as VideoSettings,
        context
      );
      expect(result.resolution).toBe("4k");
    });

    it("defaults resolution to 1080p when not provided", () => {
      const result = seedance2Model.formatValuesForBackend!(
        { prompt: "test" } as VideoSettings,
        context
      );
      expect(result.resolution).toBe("1080p");
    });
  });

  describe("onValueChange", () => {
    it("appends @Image1 tag when first image is uploaded", () => {
      const result = seedance2Model.onValueChange!("image_ids", ["uuid1"], {
        prompt: "test prompt"
      } as VideoSettings);
      expect(result?.prompt).toBe("test prompt @Image1");
    });

    it("appends @Image2 tag when second image is uploaded", () => {
      const result = seedance2Model.onValueChange!(
        "image_ids",
        ["uuid1", "uuid2"],
        { prompt: "test @Image1" } as VideoSettings
      );
      expect(result?.prompt).toBe("test @Image1 @Image2");
    });

    it("does not duplicate existing tags", () => {
      const result = seedance2Model.onValueChange!("image_ids", ["uuid1"], {
        prompt: "test @Image1"
      } as VideoSettings);
      expect(result).toBeUndefined();
    });

    it("appends all 9 tags when all slots are filled on a blank prompt", () => {
      const nineIds = Array.from({ length: 9 }, (_, i) => `uuid${i + 1}`);
      const result = seedance2Model.onValueChange!("image_ids", nineIds, {
        prompt: ""
      } as VideoSettings);
      expect(result?.prompt).toBe(
        "@Image1 @Image2 @Image3 @Image4 @Image5 @Image6 @Image7 @Image8 @Image9"
      );
    });

    it("skips tags for empty slots in a sparse array", () => {
      const result = seedance2Model.onValueChange!(
        "image_ids",
        ["uuid1", "", "uuid3"],
        { prompt: "" } as VideoSettings
      );
      expect(result?.prompt).toBe("@Image1 @Image3");
    });

    it("returns undefined for non-image_ids changes", () => {
      const result = seedance2Model.onValueChange!("resolution", "480p", {
        prompt: "test"
      } as VideoSettings);
      expect(result).toBeUndefined();
    });
  });

  describe("prompt customValidation (derives from sources, not legacy allValues.image_ids)", () => {
    const promptSetting =
      seedance2Model.settingsGroups[0].sections[0].settings[0];
    const validate = promptSetting.customValidation!;

    const referenceFrameSources = (
      ...assetIds: string[]
    ): PrepareRenderSettingsContext["sources"] =>
      assetIds.map((assetId) => ({
        asset_id: assetId,
        type: "reference_frame" as const
      }));

    it("returns null for valid prompt without image tags", () => {
      const result = validate(
        "test prompt",
        { image_ids: [] } as unknown as VideoSettings,
        referenceFrameSources()
      );
      expect(result).toBeNull();
    });

    it("returns error when @Image1 is in prompt but no image uploaded", () => {
      const result = validate(
        "test @Image1",
        { image_ids: [] } as unknown as VideoSettings,
        referenceFrameSources()
      );
      expect(result).toContain("@Image1");
    });

    it("returns null when @Image1 is in prompt and image is uploaded only in sources", () => {
      const result = validate(
        "test @Image1",
        { image_ids: [] } as unknown as VideoSettings,
        referenceFrameSources("uuid1")
      );
      expect(result).toBeNull();
    });

    it("returns error for @Image3 without third image", () => {
      const result = validate(
        "test @Image3",
        {} as VideoSettings,
        referenceFrameSources("uuid1", "uuid2")
      );
      expect(result).toContain("@Image3");
    });

    it("handles case-insensitive @IMAGE1 with image uploaded", () => {
      const result = validate(
        "test @IMAGE1",
        {} as VideoSettings,
        referenceFrameSources("uuid1")
      );
      expect(result).toBeNull();
    });

    it("returns error for lowercase @image3 without third image", () => {
      const result = validate(
        "test @image3",
        {} as VideoSettings,
        referenceFrameSources("uuid1", "uuid2")
      );
      expect(result).toContain("@Image3");
    });
  });
});
