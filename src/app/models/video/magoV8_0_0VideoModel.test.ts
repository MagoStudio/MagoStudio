import { VideoSettings } from "@models/video/types";
import { describe, it, expect } from "vitest";

import { magoV8_0_0RenderModel } from "./magoV8_0_0VideoModel";
import { flattenSettingsGroups } from "./utils/flattenSettingsGroups";

const calc = (settings: VideoSettings, frames: number) =>
  magoV8_0_0RenderModel.calcEstimatedRenderTime(settings, frames).impactToShow;

describe("magoV8_0_0RenderModel", () => {
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
  });

  describe("output format — standard frames, no forced EXR", () => {
    it("does not define a formatValuesForBackend that pins EXR output", () => {
      expect(magoV8_0_0RenderModel.formatValuesForBackend).toBeUndefined();
    });

    it("exposes no image_sequence_export setting", () => {
      const keys = flattenSettingsGroups(magoV8_0_0RenderModel).flatMap(
        (section) => section.settings.map((s) => s.key)
      );
      expect(keys).not.toContain("image_sequence_export");
    });
  });
});
