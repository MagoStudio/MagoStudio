import { ShotState } from "@schemas/scriptProject";

import { getShotDurationBounds, ShotRenderEngine } from "../constants";

import { framesToSeconds } from "./snapShotFrames";

export const isShotDurationOutOfBounds = (
  shot: ShotState,
  projectShotFrames: number,
  shotEngine?: ShotRenderEngine
): boolean => {
  const bounds = getShotDurationBounds(shotEngine);
  const effectiveDurationSeconds =
    typeof shot.duration_s === "number" && shot.duration_s > 0
      ? shot.duration_s
      : framesToSeconds(projectShotFrames);

  return (
    effectiveDurationSeconds < bounds.minSeconds ||
    effectiveDurationSeconds > bounds.maxSeconds
  );
};
