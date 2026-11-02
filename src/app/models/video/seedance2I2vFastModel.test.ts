import { VideoSettings } from "@models/video/types";
import { describe, it, expect } from "vitest";

import { seedance2I2vFastModel } from "./seedance2I2vFastModel";

const calc = (settings: VideoSettings, frames: number) =>
  seedance2I2vFastModel.calcEstimatedRenderTime(settings, frames).impactToShow;

describe("seedance2I2vFastModel", () => {
  describe("calcEstimatedRenderTime", () => {
    it("480p: 120 frames at 24fps = 5 seconds → 1100 credits", () => {
      expect(calc({ fps: 24, resolution: "480p" } as VideoSettings, 120)).toBe(
        1100
      );
    });

    it("720p: 120 frames at 24fps = 5 seconds → 2470 credits", () => {
      expect(calc({ fps: 24, resolution: "720p" } as VideoSettings, 120)).toBe(
        2470
      );
    });

    it("falls back to 24fps and 720p pricing when neither is provided", () => {
      expect(calc({} as VideoSettings, 120)).toBe(2470);
    });
  });

  describe("formatValuesForBackend", () => {
    const context = {
      inputVideoWidth: undefined,
      inputVideoHeight: undefined,
      frameRange: [0, 96],
      fps: 24,
      sources: []
    };

    it("emits the expected backend fields", () => {
      const result = seedance2I2vFastModel.formatValuesForBackend!(
        {
          prompt: "a horse running",
          image_id: "asset-1",
          resolution: "480p"
        } as VideoSettings,
        context
      );
      expect(result.image_id).toBe("asset-1");
      expect(result.resolution).toBe("480p");
      expect(result.aspect_ratio).toBe("auto");
      expect(result.generate_audio).toBe(true);
      expect(result.durationInSeconds).toBe(97 / 24);
      expect(result.fps).toBe(24);
    });

    it("does not emit a seed key", () => {
      const result = seedance2I2vFastModel.formatValuesForBackend!(
        { prompt: "test", image_id: "asset-1" } as VideoSettings,
        context
      );
      expect("seed" in result).toBe(false);
    });
  });
});
