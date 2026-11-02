import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { MINIMAX_H3_MAX_SHOT_RENDER_ENGINE } from "../constants";

import { estimateShotRenderCredits } from "./estimateShotRenderCredits";

const OUTPUT_SIZE_768P: [number, number] = [1368, 768];
const OUTPUT_SIZE_1080P: [number, number] = [1920, 1080];
const FIVE_SECOND_SHOT_FRAMES = 124;
const FIVE_AND_A_HALF_SECOND_SHOT_FRAMES = 132;
const SIX_SECOND_DEFAULT_SHOT_FRAMES = 158;

describe("estimateShotRenderCredits", () => {
  it.each([
    [OUTPUT_SIZE_768P, 5 * 566],
    [OUTPUT_SIZE_1080P, 5 * 1274]
  ])("prices Seedance 2.5 at its canvas tier", (outputSize, expected) => {
    expect(
      estimateShotRenderCredits({
        shotEngine: VideoEngine.seedance_2_5,
        outputSize: outputSize as [number, number],
        shotFrames: FIVE_SECOND_SHOT_FRAMES,
        referenceImageCount: 9
      })
    ).toBe(expected);
  });
  it("prices a 5 s 768p Shot on v9.1.0 (Slow)", () => {
    expect(
      estimateShotRenderCredits({
        shotEngine: VideoEngine.minimax_reference,
        outputSize: OUTPUT_SIZE_768P,
        shotFrames: FIVE_SECOND_SHOT_FRAMES,
        referenceImageCount: 0
      })
    ).toBe(405);
  });

  it("prices the same Shot on minimax_h3_max (Fast)", () => {
    expect(
      estimateShotRenderCredits({
        shotEngine: MINIMAX_H3_MAX_SHOT_RENDER_ENGINE,
        outputSize: OUTPUT_SIZE_768P,
        shotFrames: FIVE_SECOND_SHOT_FRAMES,
        referenceImageCount: 0
      })
    ).toBe(820);
  });

  it("charges nothing extra for exactly four reference images", () => {
    expect(
      estimateShotRenderCredits({
        shotEngine: MINIMAX_H3_MAX_SHOT_RENDER_ENGINE,
        outputSize: OUTPUT_SIZE_768P,
        shotFrames: FIVE_SECOND_SHOT_FRAMES,
        referenceImageCount: 4
      })
    ).toBe(820);
  });

  it("charges Fast for reference images beyond four", () => {
    expect(
      estimateShotRenderCredits({
        shotEngine: MINIMAX_H3_MAX_SHOT_RENDER_ENGINE,
        outputSize: OUTPUT_SIZE_768P,
        shotFrames: FIVE_SECOND_SHOT_FRAMES,
        referenceImageCount: 5
      })
    ).toBe(862);
  });

  it("rounds Fast's length to whole seconds at the project's 6 s default", () => {
    expect(
      estimateShotRenderCredits({
        shotEngine: MINIMAX_H3_MAX_SHOT_RENDER_ENGINE,
        outputSize: OUTPUT_SIZE_768P,
        shotFrames: SIX_SECOND_DEFAULT_SHOT_FRAMES,
        referenceImageCount: 0
      })
    ).toBe(1148);
  });

  it("rounds a Fast half-second tie to the even second", () => {
    expect(
      estimateShotRenderCredits({
        shotEngine: MINIMAX_H3_MAX_SHOT_RENDER_ENGINE,
        outputSize: OUTPUT_SIZE_768P,
        shotFrames: FIVE_AND_A_HALF_SECOND_SHOT_FRAMES,
        referenceImageCount: 0
      })
    ).toBe(984);
  });

  it("prices a 5 s 1080p Shot on Slow", () => {
    expect(
      estimateShotRenderCredits({
        shotEngine: VideoEngine.minimax_reference,
        outputSize: OUTPUT_SIZE_1080P,
        shotFrames: FIVE_SECOND_SHOT_FRAMES,
        referenceImageCount: 0
      })
    ).toBe(814);
  });

  it("prices a 5 s 1080p Shot on Fast", () => {
    expect(
      estimateShotRenderCredits({
        shotEngine: MINIMAX_H3_MAX_SHOT_RENDER_ENGINE,
        outputSize: OUTPUT_SIZE_1080P,
        shotFrames: FIVE_SECOND_SHOT_FRAMES,
        referenceImageCount: 0
      })
    ).toBe(1635);
  });

  it.each([
    { longEdgePx: 2000, shotFrames: 56, expectedCredits: 424 },
    { longEdgePx: 1280, shotFrames: 124, expectedCredits: 355 },
    { longEdgePx: 2000, shotFrames: 124, expectedCredits: 887 }
  ])(
    "applies the 30% Mago-cloud discount on Slow: $longEdgePx px × $shotFrames frames → $expectedCredits",
    ({ longEdgePx, shotFrames, expectedCredits }) => {
      expect(
        estimateShotRenderCredits({
          shotEngine: VideoEngine.minimax_reference,
          outputSize: [longEdgePx, longEdgePx],
          shotFrames,
          referenceImageCount: 0
        })
      ).toBe(expectedCredits);
    }
  );

  it("returns nothing to show when a dimension or the frame count is missing", () => {
    expect(
      estimateShotRenderCredits({
        shotEngine: VideoEngine.minimax_reference,
        outputSize: [0, 0],
        shotFrames: FIVE_SECOND_SHOT_FRAMES,
        referenceImageCount: 0
      })
    ).toBe(0);
    expect(
      estimateShotRenderCredits({
        shotEngine: MINIMAX_H3_MAX_SHOT_RENDER_ENGINE,
        outputSize: OUTPUT_SIZE_768P,
        shotFrames: 0,
        referenceImageCount: 0
      })
    ).toBe(0);
  });
});
