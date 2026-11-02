import { describe, expect, it } from "vitest";

import { minimaxReferenceVideoModel } from "./minimaxReferenceVideoModel";
import { VideoEngine, VideoSettings } from "./types";

describe("minimaxReferenceVideoModel", () => {
  it("registers under the v9.1.0 wire slug as a hidden render", () => {
    expect(minimaxReferenceVideoModel.name).toBe(VideoEngine.minimax_reference);
    expect(VideoEngine.minimax_reference).toBe("v9.1.0");
    expect(minimaxReferenceVideoModel.status).toBe("hidden");
  });

  describe("calcEstimatedRenderTime", () => {
    const creditsFor = (
      renderSettings: Partial<VideoSettings>,
      frameRange: [number, number]
    ) =>
      minimaxReferenceVideoModel.calcEstimatedRenderTime(
        renderSettings as VideoSettings,
        frameRange[1] - frameRange[0] + 1
      ).impactToShow;

    it.each([
      { maxSize: 2000, frameRange: [0, 56] as [number, number], credits: 424 },
      { maxSize: 1280, frameRange: [0, 124] as [number, number], credits: 355 },
      { maxSize: 2000, frameRange: [0, 124] as [number, number], credits: 887 }
    ])(
      "matches the backend's discounted price: max_size $maxSize, frame_range $frameRange → $credits",
      ({ maxSize, frameRange, credits }) => {
        expect(creditsFor({ max_size: maxSize }, frameRange)).toBe(credits);
      }
    );

    it("bills the frame range snapped up onto the v9 grid, like the backend", () => {
      expect(creditsFor({ max_size: 2000 }, [0, 48])).toBe(
        creditsFor({ max_size: 2000 }, [0, 56])
      );
    });

    it("prices on max_size, not the source video's dimensions", () => {
      expect(
        creditsFor({ max_size: 1280, width: 3840, height: 2160 }, [0, 124])
      ).toBe(355);
    });

    it("leaves fps out of the price", () => {
      expect(creditsFor({ max_size: 1280, fps: 30 }, [0, 124])).toBe(355);
    });
  });

  it("passes reference sources straight through to the wire shaper", () => {
    const sources = [{ asset_id: "ref-1", type: "reference_frame" as const }];
    const result = minimaxReferenceVideoModel.formatSourcesForBackend?.(
      {} as VideoSettings,
      {
        frameRange: [0, 120],
        fps: 24,
        sources
      }
    );
    expect(result).toEqual(sources);
  });
});
