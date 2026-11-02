import {
  IMAGE_SEQUENCE_EXPORT,
  PrepareRenderSettingsContext,
  VideoSettings
} from "@models/video/types";
import { describe, it, expect } from "vitest";

import { magoV7_0_0RenderModel } from "./magoV7_0_0VideoModel";

const calc = (settings: VideoSettings, frames: number) =>
  magoV7_0_0RenderModel.calcEstimatedRenderTime(settings, frames).impactToShow;

const CONTEXT: PrepareRenderSettingsContext = {
  inputVideoWidth: 1920,
  inputVideoHeight: 1080,
  frameRange: [0, 99],
  fps: 24,
  sources: []
};

const toBackend = (settings: VideoSettings) =>
  magoV7_0_0RenderModel.formatValuesForBackend!(settings, CONTEXT);

describe("magoV7_0_0RenderModel", () => {
  describe("calcEstimatedRenderTime — real fit", () => {
    it("1280 output size, 100 frames", () => {
      expect(calc({ max_size: 1280 } as VideoSettings, 100)).toBe(267);
    });

    it("scales with output size", () => {
      expect(calc({ max_size: 1920 } as VideoSettings, 100)).toBeGreaterThan(
        calc({ max_size: 1280 } as VideoSettings, 100)
      );
    });

    it("scales with the frame range length", () => {
      expect(calc({ max_size: 1280 } as VideoSettings, 200)).toBeGreaterThan(
        calc({ max_size: 1280 } as VideoSettings, 100)
      );
    });

    it("is not discounted (v7.0.0 is not in the fastmode/promo discount set)", () => {
      expect(calc({ max_size: 1280 } as VideoSettings, 100)).toBe(267);
    });
  });

  describe("formatValuesForBackend — forces EXR 16-bit output", () => {
    it("sets image_sequence_export to EXR 16-bit", () => {
      const result = toBackend({ max_size: 1280 } as VideoSettings);
      expect(result.image_sequence_export).toBe(
        IMAGE_SEQUENCE_EXPORT.EXR_16BIT
      );
    });

    it("overrides a user-selected PNG value with EXR 16-bit", () => {
      const result = toBackend({
        image_sequence_export: IMAGE_SEQUENCE_EXPORT.PNG
      } as VideoSettings);
      expect(result.image_sequence_export).toBe(
        IMAGE_SEQUENCE_EXPORT.EXR_16BIT
      );
    });

    it("preserves the other form settings", () => {
      const result = toBackend({
        max_size: 1600,
        v7_chunk_size: 60,
        v7_chunk_overlap: 12
      } as VideoSettings);
      expect(result.max_size).toBe(1600);
      expect(result.v7_chunk_size).toBe(60);
      expect(result.v7_chunk_overlap).toBe(12);
    });
  });
});
