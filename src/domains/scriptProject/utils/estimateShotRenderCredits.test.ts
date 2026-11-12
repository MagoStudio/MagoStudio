import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { MINIMAX_H3_MAX_SHOT_RENDER_ENGINE } from "../constants";

import { estimateShotRenderCredits } from "./estimateShotRenderCredits";

const OUTPUT_SIZE_768P: [number, number] = [1368, 768];
const OUTPUT_SIZE_1080P: [number, number] = [1920, 1080];
const FIVE_SECOND_SHOT_FRAMES = 124;
const FIVE_AND_A_HALF_SECOND_SHOT_FRAMES = 132;
const SIX_SECOND_DEFAULT_SHOT_FRAMES = 158;
const TEN_SECOND_SHOT_FRAMES = 240;
const FIFTEEN_SECOND_SHOT_FRAMES = 360;
const SQUARE_IMAGE: [number, number] = [1024, 1024];
const WIDE_IMAGE: [number, number] = [1920, 1080];

const squareImages = (count: number) =>
  Array.from({ length: count }, () => SQUARE_IMAGE);
const wideImages = (count: number) =>
  Array.from({ length: count }, () => WIDE_IMAGE);

const priceMinimaxH3Max = ({
  outputSize = OUTPUT_SIZE_768P,
  shotFrames = FIVE_SECOND_SHOT_FRAMES,
  referenceImageSizes = []
}: {
  outputSize?: [number, number];
  shotFrames?: number;
  referenceImageSizes?: ([number, number] | null)[];
}) =>
  estimateShotRenderCredits({
    shotEngine: MINIMAX_H3_MAX_SHOT_RENDER_ENGINE,
    outputSize,
    shotFrames,
    referenceImageSizes
  });

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
        referenceImageSizes: squareImages(9)
      })
    ).toBe(expected);
  });

  it("prices a 5 s 768p Shot on v9.1.0 (Slow)", () => {
    expect(
      estimateShotRenderCredits({
        shotEngine: VideoEngine.minimax_reference,
        outputSize: OUTPUT_SIZE_768P,
        shotFrames: FIVE_SECOND_SHOT_FRAMES,
        referenceImageSizes: []
      })
    ).toBe(405);
  });

  it.each([
    {
      render: "5 s 768P, 1 image",
      shotFrames: FIVE_SECOND_SHOT_FRAMES,
      outputSize: OUTPUT_SIZE_768P,
      referenceImageSizes: squareImages(1),
      expectedCredits: 816
    },
    {
      render: "15 s 1080P, 1 image",
      shotFrames: FIFTEEN_SECOND_SHOT_FRAMES,
      outputSize: OUTPUT_SIZE_1080P,
      referenceImageSizes: squareImages(1),
      expectedCredits: 4895
    },
    {
      render: "10 s 768P, 9 square images",
      shotFrames: TEN_SECOND_SHOT_FRAMES,
      outputSize: OUTPUT_SIZE_768P,
      referenceImageSizes: squareImages(9),
      expectedCredits: 1841
    },
    {
      render: "10 s 768P, 9 images 16:9",
      shotFrames: TEN_SECOND_SHOT_FRAMES,
      outputSize: OUTPUT_SIZE_768P,
      referenceImageSizes: wideImages(9),
      expectedCredits: 2134
    }
  ])(
    "matches the backend's H3 Max price for $render",
    ({ expectedCredits, ...render }) => {
      expect(priceMinimaxH3Max(render)).toBe(expectedCredits);
    }
  );

  it("charges nothing extra for the first 4,096 reference tokens", () => {
    expect(priceMinimaxH3Max({ referenceImageSizes: [] })).toBe(816);
    expect(priceMinimaxH3Max({ referenceImageSizes: squareImages(4) })).toBe(
      816
    );
  });

  it("charges for reference tokens beyond the allowance", () => {
    expect(priceMinimaxH3Max({ referenceImageSizes: squareImages(5) })).toBe(
      858
    );
  });

  it("prices an image of unknown size as square", () => {
    expect(
      priceMinimaxH3Max({ referenceImageSizes: [null, null, null, null, null] })
    ).toBe(858);
  });

  it("rounds H3 Max's length to whole seconds at the project's 6 s default", () => {
    expect(
      priceMinimaxH3Max({ shotFrames: SIX_SECOND_DEFAULT_SHOT_FRAMES })
    ).toBe(1142);
  });

  it("rounds an H3 Max half-second tie to the even second", () => {
    expect(
      priceMinimaxH3Max({ shotFrames: FIVE_AND_A_HALF_SECOND_SHOT_FRAMES })
    ).toBe(979);
  });

  it("prices a 5 s 1080p Shot on Slow", () => {
    expect(
      estimateShotRenderCredits({
        shotEngine: VideoEngine.minimax_reference,
        outputSize: OUTPUT_SIZE_1080P,
        shotFrames: FIVE_SECOND_SHOT_FRAMES,
        referenceImageSizes: []
      })
    ).toBe(814);
  });

  it("prices a 5 s 1080p Shot on H3 Max", () => {
    expect(priceMinimaxH3Max({ outputSize: OUTPUT_SIZE_1080P })).toBe(1632);
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
          referenceImageSizes: []
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
        referenceImageSizes: []
      })
    ).toBe(0);
    expect(priceMinimaxH3Max({ shotFrames: 0 })).toBe(0);
  });
});
