import { VideoEngine } from "@models/video/types";

import { ShotRenderEngine } from "../constants";

import { roundHalfToEven } from "./roundHalfToEven";
import { SHOT_FPS, snapShotSecondsToFrames } from "./snapShotFrames";

/** The frame count this Shot actually renders at.
 *
 * A Shot carries its own `duration_s` once an atomic cast calibrated it or a user set one;
 * otherwise it renders at the project-wide length. Mirrors what the backend's shot generation does
 * with `duration_s` server-side, so the row cannot claim a length the render will not use. */
export const resolveShotRenderFrames = ({
  shotDurationSeconds,
  projectShotFrames,
  shotEngine
}: {
  shotDurationSeconds: number | null | undefined;
  projectShotFrames: number;
  shotEngine?: ShotRenderEngine;
}): number => {
  const hasOwnDuration =
    typeof shotDurationSeconds === "number" && shotDurationSeconds > 0;

  if (shotEngine === VideoEngine.seedance_2_5) {
    const seconds = hasOwnDuration
      ? shotDurationSeconds
      : projectShotFrames / SHOT_FPS;
    return roundHalfToEven(seconds) * SHOT_FPS;
  }

  if (!hasOwnDuration) return projectShotFrames;

  return snapShotSecondsToFrames(shotDurationSeconds);
};
