import { calcMagoV9RenderTimeSeconds } from "@models/video/minimaxReferenceVideoModel";
import { VideoEngine } from "@models/video/types";
import { calcMagoNativeRenderCredits } from "@utils/calcMagoNativeRenderCredits";

import {
  MINIMAX_H3_MAX_SHOT_RENDER_ENGINE,
  ShotRenderEngine
} from "../constants";

import {
  MinimaxResolutionTier,
  findNearestMinimaxResolutionTier
} from "./findNearestMinimaxResolutionTier";
import { roundHalfToEven } from "./roundHalfToEven";
import { SHOT_FPS } from "./snapShotFrames";

const estimateV9ShotRenderCredits = ({
  outputSize,
  shotFrames
}: {
  outputSize: [number, number];
  shotFrames: number;
}): number => {
  const longEdgePx = Math.max(outputSize[0], outputSize[1]);

  if (longEdgePx <= 0 || shotFrames <= 0) return 0;

  return calcMagoNativeRenderCredits(
    VideoEngine.minimax_reference,
    calcMagoV9RenderTimeSeconds({
      longEdgePx,
      requestedFrameCount: shotFrames
    })
  );
};

const MINIMAX_CREDITS_PER_SECOND_BY_TIER: Record<
  MinimaxResolutionTier,
  number
> = {
  "480P": 102,
  "768P": 164,
  "1080P": 327
};

const MINIMAX_FREE_REFERENCE_PIXELS = 4096;
const MINIMAX_PIXELS_PER_REFERENCE_IMAGE = 1024;
const MINIMAX_EXTRA_PIXEL_USD_PER_KILOPIXEL = 0.02;
const MINIMAX_USD_PER_CREDIT_BATCH = 0.18144;
const MINIMAX_CREDITS_PER_USD_BATCH = 370;
const MINIMAX_EXTRA_REFERENCE_CREDIT_RATE =
  (MINIMAX_EXTRA_PIXEL_USD_PER_KILOPIXEL / 1000) *
  (MINIMAX_CREDITS_PER_USD_BATCH / MINIMAX_USD_PER_CREDIT_BATCH);

const estimateMinimaxShotRenderCredits = ({
  outputSize,
  shotFrames,
  referenceImageCount
}: {
  outputSize: [number, number];
  shotFrames: number;
  referenceImageCount: number;
}): number => {
  const shortEdgePx = Math.min(outputSize[0], outputSize[1]);

  if (shortEdgePx <= 0 || shotFrames <= 0) return 0;

  const billedSeconds = roundHalfToEven(shotFrames / SHOT_FPS);
  const tier = findNearestMinimaxResolutionTier(shortEdgePx);
  const extraReferencePixels = Math.max(
    0,
    referenceImageCount * MINIMAX_PIXELS_PER_REFERENCE_IMAGE -
      MINIMAX_FREE_REFERENCE_PIXELS
  );

  const credits =
    billedSeconds * MINIMAX_CREDITS_PER_SECOND_BY_TIER[tier] +
    extraReferencePixels * MINIMAX_EXTRA_REFERENCE_CREDIT_RATE;

  return Math.ceil(credits);
};

const estimateSeedanceShotRenderCredits = (
  outputSize: [number, number],
  shotFrames: number
): number => {
  const shortEdge = Math.min(...outputSize);
  if (shortEdge <= 0 || shotFrames <= 0) return 0;
  const tiers = [
    { edge: 480, rate: 252 },
    { edge: 720, rate: 566 },
    { edge: 1080, rate: 1274 }
  ];
  const tier = tiers.reduce((nearest, candidate) =>
    Math.abs(candidate.edge - shortEdge) < Math.abs(nearest.edge - shortEdge)
      ? candidate
      : nearest
  );
  return roundHalfToEven(shotFrames / SHOT_FPS) * tier.rate;
};

export const estimateShotRenderCredits = ({
  shotEngine,
  outputSize,
  shotFrames,
  referenceImageCount
}: {
  shotEngine: ShotRenderEngine;
  outputSize: [number, number];
  shotFrames: number;
  referenceImageCount: number;
}): number =>
  shotEngine === VideoEngine.seedance_2_5
    ? estimateSeedanceShotRenderCredits(outputSize, shotFrames)
    : shotEngine === MINIMAX_H3_MAX_SHOT_RENDER_ENGINE
      ? estimateMinimaxShotRenderCredits({
          outputSize,
          shotFrames,
          referenceImageCount
        })
      : estimateV9ShotRenderCredits({ outputSize, shotFrames });
