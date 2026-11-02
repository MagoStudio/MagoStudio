import {
  PrepareRenderSettingsContext,
  VideoSettings
} from "@models/video/types";
import { describe, it, expect } from "vitest";

import { seedance2_5Model } from "./seedance2_5Model";

const calc = (settings: VideoSettings, frames: number) =>
  seedance2_5Model.calcEstimatedRenderTime(settings, frames).impactToShow;

describe("seedance2_5Model", () => {
  describe("calcEstimatedRenderTime", () => {
    it("720p: 5-second range → 2830 credits", () => {
      const result = calc(
        { fps: 24, resolution: "720p" } as VideoSettings,
        120
      );
      expect(result).toBe(2830);
    });

    it("480p: 5-second range → 1260 credits", () => {
      const result = calc(
        { fps: 24, resolution: "480p" } as VideoSettings,
        120
      );
      expect(result).toBe(1260);
    });

    it("1080p: 5-second range → 6370 credits", () => {
      const result = calc(
        { fps: 24, resolution: "1080p" } as VideoSettings,
        120
      );
      expect(result).toBe(6370);
    });

    it("rounds a 5.4-second duration down to 5 seconds before multiplying, not the fractional product", () => {
      const result = calc({ fps: 10, resolution: "720p" } as VideoSettings, 54);
      expect(result).toBe(2830);
      expect(result).not.toBe(Math.ceil(5.4 * 566));
    });

    it("rounds a 5.6-second duration up to 6 seconds before multiplying", () => {
      const result = calc({ fps: 10, resolution: "720p" } as VideoSettings, 56);
      expect(result).toBe(Math.ceil(6 * 566));
    });

    it("falls back to 24fps and 720p pricing when neither is provided", () => {
      const result = calc({} as VideoSettings, 120);
      expect(result).toBe(2830);
    });
  });

  describe("formatValuesForBackend", () => {
    const context: PrepareRenderSettingsContext = {
      inputVideoWidth: 1920,
      inputVideoHeight: 1080,
      frameRange: [0, 120],
      fps: 24,
      sources: []
    };

    it("emits resolution, aspect_ratio, generate_audio, durationInSeconds, frameRangeSeconds and fps", () => {
      const result = seedance2_5Model.formatValuesForBackend!(
        { prompt: "test" } as VideoSettings,
        context
      );
      expect(result.fps).toBe(24);
      expect(result.resolution).toBe("720p");
      expect(result.aspect_ratio).toBe("auto");
      expect(result.generate_audio).toBe(false);
      expect(result.durationInSeconds).toBe(121 / 24);
      expect(result.frameRangeSeconds).toEqual([0, 5]);
    });

    it("does not add width, height or max_size (unlike Seedance 2.0)", () => {
      const result = seedance2_5Model.formatValuesForBackend!(
        { prompt: "test" } as VideoSettings,
        context
      );
      expect(result.width).toBeUndefined();
      expect(result.height).toBeUndefined();
      expect(result.max_size).toBeUndefined();
    });

    it("forwards a user-selected resolution", () => {
      const result = seedance2_5Model.formatValuesForBackend!(
        { prompt: "test", resolution: "1080p" } as VideoSettings,
        context
      );
      expect(result.resolution).toBe("1080p");
    });

    it("forwards a user-selected aspect ratio", () => {
      const result = seedance2_5Model.formatValuesForBackend!(
        { prompt: "test", aspect_ratio: "16:9" } as VideoSettings,
        context
      );
      expect(result.aspect_ratio).toBe("16:9");
    });

    it("forwards generate_audio when enabled", () => {
      const result = seedance2_5Model.formatValuesForBackend!(
        { prompt: "test", generate_audio: true } as VideoSettings,
        context
      );
      expect(result.generate_audio).toBe(true);
    });

    it("includes image_ids derived from reference_frame sources when provided", () => {
      const result = seedance2_5Model.formatValuesForBackend!(
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

    it("omits image_ids when no reference image is uploaded", () => {
      const result = seedance2_5Model.formatValuesForBackend!(
        { prompt: "test", image_ids: [] } as VideoSettings,
        context
      );
      expect(result.image_ids).toBeUndefined();
    });

    it("caps image_ids at 9 even when 10 reference_frame sources survived a model switch", () => {
      const tenSources = Array.from({ length: 10 }, (_, index) => ({
        asset_id: `uuid${index + 1}`,
        type: "reference_frame" as const
      }));

      const result = seedance2_5Model.formatValuesForBackend!(
        { prompt: "test" } as VideoSettings,
        { ...context, sources: tenSources }
      );

      expect(result.image_ids).toHaveLength(9);
      expect(result.image_ids).toEqual([
        "uuid1",
        "uuid2",
        "uuid3",
        "uuid4",
        "uuid5",
        "uuid6",
        "uuid7",
        "uuid8",
        "uuid9"
      ]);
    });
  });

  describe("onValueChange", () => {
    it("appends @Image1 tag when first image is uploaded", () => {
      const result = seedance2_5Model.onValueChange!("image_ids", ["uuid1"], {
        prompt: "test prompt"
      } as VideoSettings);
      expect(result?.prompt).toBe("test prompt @Image1");
    });

    it("returns undefined for non-image_ids changes", () => {
      const result = seedance2_5Model.onValueChange!("resolution", "480p", {
        prompt: "test"
      } as VideoSettings);
      expect(result).toBeUndefined();
    });
  });

  describe("prompt customValidation (derives from sources, not legacy allValues.image_ids)", () => {
    const promptSetting =
      seedance2_5Model.settingsGroups[0].sections[0].settings[0];
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

    it("returns null when @Image1 is in prompt and image is uploaded", () => {
      const result = validate(
        "test @Image1",
        { image_ids: [] } as unknown as VideoSettings,
        referenceFrameSources("uuid1")
      );
      expect(result).toBeNull();
    });
  });
});
