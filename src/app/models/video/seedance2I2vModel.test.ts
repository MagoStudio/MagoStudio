import { VideoSettings } from "@models/video/types";
import { describe, it, expect } from "vitest";

import { seedance2I2vModel } from "./seedance2I2vModel";

const calc = (settings: VideoSettings, frames: number) =>
  seedance2I2vModel.calcEstimatedRenderTime(settings, frames).impactToShow;

describe("seedance2I2vModel", () => {
  describe("calcEstimatedRenderTime", () => {
    it("480p: 120 frames at 24fps = 5 seconds → 1375 credits", () => {
      expect(calc({ fps: 24, resolution: "480p" } as VideoSettings, 120)).toBe(
        1375
      );
    });

    it("720p: 120 frames at 24fps = 5 seconds → 3085 credits", () => {
      expect(calc({ fps: 24, resolution: "720p" } as VideoSettings, 120)).toBe(
        3085
      );
    });

    it("1080p: 120 frames at 24fps = 5 seconds → 6945 credits", () => {
      expect(calc({ fps: 24, resolution: "1080p" } as VideoSettings, 120)).toBe(
        6945
      );
    });

    it("4k: 120 frames at 24fps = 5 seconds → 15870 credits", () => {
      expect(calc({ fps: 24, resolution: "4k" } as VideoSettings, 120)).toBe(
        15870
      );
    });

    it("doubles when duration doubles at a fixed resolution", () => {
      const fiveSeconds = calc(
        { fps: 24, resolution: "720p" } as VideoSettings,
        120
      );
      const tenSeconds = calc(
        { fps: 24, resolution: "720p" } as VideoSettings,
        240
      );
      expect(tenSeconds).toBe(fiveSeconds * 2);
    });

    it("rounds up partial seconds", () => {
      const result = calc(
        { fps: 24, resolution: "720p" } as VideoSettings,
        108
      );
      expect(result).toBe(Math.ceil((108 / 24) * 617));
    });

    it("falls back to 24fps and 720p pricing when neither is provided", () => {
      expect(calc({} as VideoSettings, 120)).toBe(3085);
    });
  });

  describe("formatValuesForBackend", () => {
    const context = {
      inputVideoWidth: undefined,
      inputVideoHeight: undefined,
      frameRange: [0, 120],
      fps: 24,
      sources: []
    };

    it("emits image_id, resolution, aspect_ratio, generate_audio, durationInSeconds, frameRangeSeconds and fps", () => {
      const result = seedance2I2vModel.formatValuesForBackend!(
        {
          prompt: "a horse running",
          image_id: "asset-1",
          resolution: "1080p",
          generate_audio: false
        } as VideoSettings,
        context
      );
      expect(result.image_id).toBe("asset-1");
      expect(result.resolution).toBe("1080p");
      expect(result.aspect_ratio).toBe("auto");
      expect(result.generate_audio).toBe(false);
      expect(result.durationInSeconds).toBeCloseTo(5.04, 2);
      expect(result.frameRangeSeconds).toEqual([0, 5]);
      expect(result.fps).toBe(24);
    });

    it("omits end_image_id when not provided", () => {
      const result = seedance2I2vModel.formatValuesForBackend!(
        { prompt: "test", image_id: "asset-1" } as VideoSettings,
        context
      );
      expect(result.end_image_id).toBeUndefined();
    });

    it("omits end_image_id when an empty string", () => {
      const result = seedance2I2vModel.formatValuesForBackend!(
        {
          prompt: "test",
          image_id: "asset-1",
          end_image_id: ""
        } as VideoSettings,
        context
      );
      expect(result.end_image_id).toBeUndefined();
    });

    it("forwards a populated end_image_id", () => {
      const result = seedance2I2vModel.formatValuesForBackend!(
        {
          prompt: "test",
          image_id: "asset-1",
          end_image_id: "asset-2"
        } as VideoSettings,
        context
      );
      expect(result.end_image_id).toBe("asset-2");
    });

    it("defaults generate_audio to true when omitted", () => {
      const result = seedance2I2vModel.formatValuesForBackend!(
        { prompt: "test", image_id: "asset-1" } as VideoSettings,
        context
      );
      expect(result.generate_audio).toBe(true);
    });

    it("defaults resolution to 720p when not provided", () => {
      const result = seedance2I2vModel.formatValuesForBackend!(
        { prompt: "test", image_id: "asset-1" } as VideoSettings,
        context
      );
      expect(result.resolution).toBe("720p");
    });

    it("does not emit a seed key", () => {
      const result = seedance2I2vModel.formatValuesForBackend!(
        { prompt: "test", image_id: "asset-1" } as VideoSettings,
        context
      );
      expect("seed" in result).toBe(false);
    });

    it("sends the user's chosen duration rather than re-deriving it", () => {
      const result = seedance2I2vModel.formatValuesForBackend!(
        {
          prompt: "test",
          image_id: "asset-1",
          durationInSeconds: 5
        } as VideoSettings,
        context
      );
      expect(result.durationInSeconds).toBe(5);
    });

    it("falls back to the frame range when no duration is set", () => {
      const result = seedance2I2vModel.formatValuesForBackend!(
        { prompt: "test", image_id: "asset-1" } as VideoSettings,
        context
      );
      expect(result.durationInSeconds).toBeCloseTo(5.04, 2);
    });
  });
});
