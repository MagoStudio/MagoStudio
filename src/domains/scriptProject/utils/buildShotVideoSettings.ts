import { VideoEngine } from "@models/video/types";

import { ShotRenderEngine } from "../constants";

import { toWholeSecondShotFrameRange } from "./toWholeSecondShotFrameRange";

export const buildShotVideoSettings = ({
  shotEngine,
  frameRange,
  maxQualityRetries
}: {
  shotEngine: ShotRenderEngine;
  frameRange: [number, number];
  maxQualityRetries: number;
}): {
  engine: ShotRenderEngine;
  prompt_rewrite: "mago";
  frame_range: [number, number];
  max_quality_retries: number;
} => {
  const isIntegratedSeedanceShotEngine =
    shotEngine === VideoEngine.seedance_2_5;
  const shotEngineSupportsQualityRetries = !isIntegratedSeedanceShotEngine;
  return {
    engine: shotEngine,
    prompt_rewrite: "mago",
    frame_range: isIntegratedSeedanceShotEngine
      ? toWholeSecondShotFrameRange(frameRange)
      : frameRange,
    max_quality_retries: shotEngineSupportsQualityRetries
      ? maxQualityRetries
      : 0
  };
};
