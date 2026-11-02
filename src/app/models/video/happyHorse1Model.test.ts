import {
  PrepareRenderSettingsContext,
  VideoSettings
} from "@models/video/types";
import { describe, it, expect } from "vitest";

import { happyHorse1Model } from "./happyHorse1Model";

const calc = (settings: VideoSettings, frames: number) =>
  happyHorse1Model.calcEstimatedRenderTime(settings, frames).impactToShow;

describe("happyHorse1Model", () => {
  describe("calcEstimatedRenderTime", () => {
    it("720p: 120 frames at 24fps = 5s → 1400 credits", () => {
      const result = calc(
        { fps: 24, resolution: "720p" } as VideoSettings,
        120
      );
      expect(result).toBe(1400);
    });

    it("1080p: 120 frames at 24fps = 5s → 2800 credits", () => {
      const result = calc(
        { fps: 24, resolution: "1080p" } as VideoSettings,
        120
      );
      expect(result).toBe(2800);
    });

    it("rounds up partial seconds", () => {
      const result = calc(
        { fps: 24, resolution: "720p" } as VideoSettings,
        108
      );
      expect(result).toBe(Math.ceil((108 / 24) * 280));
    });

    it("caps duration at 15 seconds (720p)", () => {
      const result = calc(
        { fps: 24, resolution: "720p" } as VideoSettings,
        24 * 20
      );
      expect(result).toBe(15 * 280);
    });

    it("caps duration at 15 seconds (1080p)", () => {
      const result = calc(
        { fps: 30, resolution: "1080p" } as VideoSettings,
        30 * 20
      );
      expect(result).toBe(15 * 560);
    });

    it("defaults to 720p rate when resolution is missing", () => {
      const result = calc({ fps: 24 } as VideoSettings, 120);
      expect(result).toBe(1400);
    });

    it("at exactly 15 seconds yields full uncapped price", () => {
      const result = calc(
        { fps: 24, resolution: "720p" } as VideoSettings,
        24 * 15
      );
      expect(result).toBe(15 * 280);
    });

    it("15s and 16s yield identical price (cap is inclusive of 15)", () => {
      const at15 = calc(
        { fps: 24, resolution: "1080p" } as VideoSettings,
        24 * 15
      );
      const at16 = calc(
        { fps: 24, resolution: "1080p" } as VideoSettings,
        24 * 16
      );
      expect(at15).toBe(at16);
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

    it("includes only the spec-defined fields and audio_setting=origin", () => {
      const result = happyHorse1Model.formatValuesForBackend!(
        {
          prompt: "a horse running",
          resolution: "720p"
        } as VideoSettings,
        context
      );
      expect(result.prompt).toBe("a horse running");
      expect(result.fps).toBe(24);
      expect(result.resolution).toBe("720p");
      expect(result.audio_setting).toBe("origin");
      expect(result.durationInSeconds).toBe(121 / 24);
      expect(result.frameRangeSeconds).toEqual([0, 5]);
    });

    it("renames reference_frame sources to reference_image_ids when provided", () => {
      const result = happyHorse1Model.formatValuesForBackend!(
        {
          prompt: "test",
          resolution: "720p"
        } as VideoSettings,
        {
          ...context,
          sources: [
            { asset_id: "uuid1", type: "reference_frame" },
            { asset_id: "uuid2", type: "reference_frame" }
          ]
        }
      );
      expect(result.reference_image_ids).toEqual(["uuid1", "uuid2"]);
      expect(result.image_ids).toBeUndefined();
    });

    it("omits reference_image_ids and strips image_ids when empty", () => {
      const result = happyHorse1Model.formatValuesForBackend!(
        {
          prompt: "test",
          resolution: "720p",
          image_ids: []
        } as VideoSettings,
        context
      );
      expect("reference_image_ids" in result).toBe(true);
      expect(result.reference_image_ids).toBeUndefined();
      expect("image_ids" in result).toBe(false);
    });

    it("omits reference_image_ids when image_ids is all empty strings", () => {
      const result = happyHorse1Model.formatValuesForBackend!(
        {
          prompt: "test",
          resolution: "720p",
          image_ids: ["", "", ""]
        } as VideoSettings,
        context
      );
      expect(result.reference_image_ids).toBeUndefined();
    });

    it("filters out sources entries with an empty asset_id", () => {
      const result = happyHorse1Model.formatValuesForBackend!(
        {
          prompt: "test",
          resolution: "720p"
        } as VideoSettings,
        {
          ...context,
          sources: [
            { asset_id: "uuid1", type: "reference_frame" },
            { asset_id: "", type: "reference_frame" },
            { asset_id: "uuid3", type: "reference_frame" }
          ]
        }
      );
      expect(result.reference_image_ids).toEqual(["uuid1", "uuid3"]);
    });

    it("always sends audio_setting='origin' regardless of images", () => {
      const withImages = happyHorse1Model.formatValuesForBackend!(
        {
          prompt: "test",
          resolution: "720p",
          image_ids: ["uuid1"]
        } as VideoSettings,
        context
      );
      const withoutImages = happyHorse1Model.formatValuesForBackend!(
        { prompt: "test", resolution: "720p" } as VideoSettings,
        context
      );
      expect(withImages.audio_setting).toBe("origin");
      expect(withoutImages.audio_setting).toBe("origin");
    });

    it("strips seed and enable_safety_checker even when present in form state", () => {
      const result = happyHorse1Model.formatValuesForBackend!(
        {
          prompt: "test",
          resolution: "720p",
          seed: 42,
          enable_safety_checker: false
        } as VideoSettings,
        context
      );
      expect("seed" in result).toBe(false);
      expect("enable_safety_checker" in result).toBe(false);
    });

    it("does not inject magov2-shared fields not used by HH (max_size, steps, etc.)", () => {
      const result = happyHorse1Model.formatValuesForBackend!(
        { prompt: "test", resolution: "720p" } as VideoSettings,
        context
      );
      expect(result.max_size).toBeUndefined();
      expect(result.steps).toBeUndefined();
      expect(result.upscale_chunk_size).toBeUndefined();
      expect(result.width).toBeUndefined();
      expect(result.height).toBeUndefined();
      expect(result.aspect_ratio).toBeUndefined();
      expect(result.duration).toBeUndefined();
    });
  });

  describe("formatValuesForFrontend", () => {
    const toFrontend = happyHorse1Model.formatValuesForFrontend!;

    it("maps reference_image_ids back to image_ids", () => {
      const result = toFrontend({
        prompt: "test",
        resolution: "720p",
        reference_image_ids: ["uuid1", "uuid2", "uuid3"]
      } as VideoSettings);
      expect(result.image_ids).toEqual(["uuid1", "uuid2", "uuid3"]);
      expect("reference_image_ids" in result).toBe(false);
    });

    it("handles a single reference image", () => {
      const result = toFrontend({
        reference_image_ids: ["only-one"]
      } as VideoSettings);
      expect(result.image_ids).toEqual(["only-one"]);
    });

    it("handles the max-5 reference images", () => {
      const fiveIds = Array.from({ length: 5 }, (_, i) => `uuid${i + 1}`);
      const result = toFrontend({
        reference_image_ids: fiveIds
      } as VideoSettings);
      expect(result.image_ids).toEqual(fiveIds);
    });

    it("returns empty image_ids when reference_image_ids is undefined", () => {
      const result = toFrontend({
        prompt: "test",
        resolution: "720p"
      } as VideoSettings);
      expect(result.image_ids).toEqual([]);
      expect("reference_image_ids" in result).toBe(false);
    });

    it("returns empty image_ids when reference_image_ids is an empty array", () => {
      const result = toFrontend({
        reference_image_ids: []
      } as VideoSettings);
      expect(result.image_ids).toEqual([]);
      expect("reference_image_ids" in result).toBe(false);
    });

    it("preserves other fields unchanged", () => {
      const result = toFrontend({
        prompt: "a horse",
        resolution: "1080p",
        reference_image_ids: ["a"]
      } as VideoSettings);
      expect(result.prompt).toBe("a horse");
      expect(result.resolution).toBe("1080p");
    });

    it("round-trip: formatValuesForBackend → formatValuesForFrontend preserves image_ids", () => {
      const context = {
        inputVideoWidth: 1920,
        inputVideoHeight: 1080,
        frameRange: [0, 120] as [number, number],
        fps: 24,
        sources: []
      };
      const original = {
        prompt: "test",
        resolution: "720p"
      } as VideoSettings;
      const onWire = happyHorse1Model.formatValuesForBackend!(original, {
        ...context,
        sources: [
          { asset_id: "a", type: "reference_frame" },
          { asset_id: "b", type: "reference_frame" },
          { asset_id: "c", type: "reference_frame" }
        ]
      });
      const back = toFrontend(onWire);
      expect(back.image_ids).toEqual(["a", "b", "c"]);
      expect("reference_image_ids" in back).toBe(false);
    });

    it("round-trip yields empty image_ids when none were uploaded", () => {
      const context = {
        inputVideoWidth: 1920,
        inputVideoHeight: 1080,
        frameRange: [0, 120] as [number, number],
        fps: 24,
        sources: []
      };
      const original = {
        prompt: "test",
        resolution: "720p",
        image_ids: []
      } as VideoSettings;
      const onWire = happyHorse1Model.formatValuesForBackend!(
        original,
        context
      );
      const back = toFrontend(onWire);
      expect("reference_image_ids" in back).toBe(false);
      expect(back.image_ids).toEqual([]);
    });
  });

  describe("onValueChange", () => {
    it("appends @Image1 when first reference image is uploaded", () => {
      const result = happyHorse1Model.onValueChange!("image_ids", ["uuid1"], {
        prompt: "test prompt"
      } as VideoSettings);
      expect(result?.prompt).toBe("test prompt @Image1");
    });

    it("appends @Image1..@Image5 on a blank prompt when all 5 slots filled", () => {
      const fiveIds = Array.from({ length: 5 }, (_, i) => `uuid${i + 1}`);
      const result = happyHorse1Model.onValueChange!("image_ids", fiveIds, {
        prompt: ""
      } as VideoSettings);
      expect(result?.prompt).toBe("@Image1 @Image2 @Image3 @Image4 @Image5");
    });

    it("does not duplicate existing tags", () => {
      const result = happyHorse1Model.onValueChange!("image_ids", ["uuid1"], {
        prompt: "test @Image1"
      } as VideoSettings);
      expect(result).toBeUndefined();
    });

    it("returns undefined for non-image_ids changes", () => {
      const result = happyHorse1Model.onValueChange!("resolution", "1080p", {
        prompt: "test"
      } as VideoSettings);
      expect(result).toBeUndefined();
    });
  });

  describe("prompt customValidation (derives from sources, not legacy allValues.image_ids)", () => {
    const promptSetting =
      happyHorse1Model.settingsGroups[0].sections[0].settings[0];
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
        {} as VideoSettings,
        referenceFrameSources()
      );
      expect(result).toBeNull();
    });

    it("returns error when @Image1 referenced but no image uploaded", () => {
      const result = validate(
        "test @Image1",
        {} as VideoSettings,
        referenceFrameSources()
      );
      expect(result).toContain("@Image1");
    });

    it("returns null when @Image1 referenced and image uploaded only in sources", () => {
      const result = validate(
        "test @Image1",
        { image_ids: [] } as unknown as VideoSettings,
        referenceFrameSources("uuid1")
      );
      expect(result).toBeNull();
    });

    it("returns error for @Image6 (above HH cap of 5)", () => {
      const result = validate(
        "test @Image6",
        {} as VideoSettings,
        referenceFrameSources("a", "b", "c", "d", "e", "f")
      );
      expect(result).toContain("@Image6");
      expect(result).toContain("not supported");
    });

    it("returns error for @Image5 without fifth image", () => {
      const result = validate(
        "test @Image5",
        {} as VideoSettings,
        referenceFrameSources("uuid1", "uuid2", "uuid3", "uuid4")
      );
      expect(result).toContain("@Image5");
    });

    it("handles case-insensitive @IMAGE1", () => {
      const result = validate(
        "test @IMAGE1",
        {} as VideoSettings,
        referenceFrameSources("uuid1")
      );
      expect(result).toBeNull();
    });

    it("returns null when all five uploaded images are referenced (boundary)", () => {
      const result = validate(
        "test @Image1 @Image2 @Image3 @Image4 @Image5",
        {} as VideoSettings,
        referenceFrameSources("a", "b", "c", "d", "e")
      );
      expect(result).toBeNull();
    });

    it("returns error when five images are uploaded but only @Image5 is referenced", () => {
      const result = validate(
        "test @Image5",
        {} as VideoSettings,
        referenceFrameSources("a", "b", "c", "d", "e")
      );
      expect(result).toBe("Add @Image1 to your prompt or remove the image");
    });

    it("rejects @Image10 (double-digit above cap)", () => {
      const result = validate(
        "test @Image10",
        {} as VideoSettings,
        referenceFrameSources("a", "b", "c", "d", "e")
      );
      expect(result).toContain("@Image10");
      expect(result).toContain("not supported");
    });

    it("rejects case-insensitive @IMAGE7 above cap", () => {
      const result = validate(
        "test @IMAGE7",
        {} as VideoSettings,
        referenceFrameSources("a", "b", "c", "d", "e")
      );
      expect(result).toContain("not supported");
    });
  });
});
