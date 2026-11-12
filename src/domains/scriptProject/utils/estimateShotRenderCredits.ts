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

const MINIMAX_H3_MAX_FAL_USD_PER_OUTPUT_SECOND_BY_TIER: Record<
  MinimaxResolutionTier,
  number
> = {
  "480P": 0.05,
  "768P": 0.08,
  "1080P": 0.16
};
const MINIMAX_H3_MAX_FAL_FREE_REFERENCE_TOKENS = 4096;
const MINIMAX_H3_MAX_FAL_USD_PER_THOUSAND_REFERENCE_TOKENS = 0.02;
const MINIMAX_H3_MAX_FAL_TOKENS_PER_SQUARE_IMAGE = 1024;
const MINIMAX_H3_MAX_FAL_IMAGE_TOKEN_STEP = 32;
const SEEDANCE_2_CREDITS_PER_SECOND = 370;
const SEEDANCE_2_FAL_USD_PER_SECOND = 0.18144;
const FAL_CREDITS_PER_USD =
  SEEDANCE_2_CREDITS_PER_SECOND / SEEDANCE_2_FAL_USD_PER_SECOND;
const IMAGE_TOKEN_ROUNDING_TOLERANCE = 1e-9;

const countMinimaxH3MaxReferenceImageTokens = (
  imageSize: [number, number] | null
): number => {
  if (!imageSize) return MINIMAX_H3_MAX_FAL_TOKENS_PER_SQUARE_IMAGE;
  const aspectRatio = Math.max(...imageSize) / Math.min(...imageSize);
  return (
    Math.ceil(
      (MINIMAX_H3_MAX_FAL_TOKENS_PER_SQUARE_IMAGE * aspectRatio) /
        MINIMAX_H3_MAX_FAL_IMAGE_TOKEN_STEP -
        IMAGE_TOKEN_ROUNDING_TOLERANCE
    ) * MINIMAX_H3_MAX_FAL_IMAGE_TOKEN_STEP
  );
};

const estimateMinimaxShotRenderCredits = ({
  outputSize,
  shotFrames,
  referenceImageSizes
}: {
  outputSize: [number, number];
  shotFrames: number;
  referenceImageSizes: ([number, number] | null)[];
}): number => {
  const shortEdgePx = Math.min(outputSize[0], outputSize[1]);

  if (shortEdgePx <= 0 || shotFrames <= 0) return 0;

  const billedSeconds = roundHalfToEven(shotFrames / SHOT_FPS);
  const tier = findNearestMinimaxResolutionTier(shortEdgePx);
  const imageTokens = referenceImageSizes.reduce(
    (totalTokens, imageSize) =>
      totalTokens + countMinimaxH3MaxReferenceImageTokens(imageSize),
    0
  );
  const billedReferenceTokens = Math.max(
    0,
    imageTokens - MINIMAX_H3_MAX_FAL_FREE_REFERENCE_TOKENS
  );
  const falUsd =
    billedSeconds * MINIMAX_H3_MAX_FAL_USD_PER_OUTPUT_SECOND_BY_TIER[tier] +
    (billedReferenceTokens *
      MINIMAX_H3_MAX_FAL_USD_PER_THOUSAND_REFERENCE_TOKENS) /
      1000;

  return Math.ceil(falUsd * FAL_CREDITS_PER_USD);
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
  referenceImageSizes
}: {
  shotEngine: ShotRenderEngine;
  outputSize: [number, number];
  shotFrames: number;
  referenceImageSizes: ([number, number] | null)[];
}): number =>
  shotEngine === VideoEngine.seedance_2_5
    ? estimateSeedanceShotRenderCredits(outputSize, shotFrames)
    : shotEngine === MINIMAX_H3_MAX_SHOT_RENDER_ENGINE
      ? estimateMinimaxShotRenderCredits({
          outputSize,
          shotFrames,
          referenceImageSizes
        })
      : estimateV9ShotRenderCredits({ outputSize, shotFrames });
