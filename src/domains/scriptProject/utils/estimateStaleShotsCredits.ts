import { ShotState } from "@schemas/scriptProject";

import { ShotRenderEngine } from "../constants";

import { countShotReferenceImages } from "./countShotReferenceImages";
import { estimateShotRenderCredits } from "./estimateShotRenderCredits";
import { resolveShotRenderFrames } from "./resolveShotRenderFrames";

/** What the shots about to render will cost, priced one Shot at a time.
 *
 * Multiplying one Shot's price by the count only held while every Shot in a project rendered
 * at the same length. An atomic cast gives each beat its own, so a project of short reaction
 * beats and long action beats has no single per-Shot price to multiply. */
export const estimateStaleShotsCredits = ({
  staleShots,
  shotEngine,
  outputSize,
  projectShotFrames,
  attemptsPerShot
}: {
  staleShots: ShotState[];
  shotEngine: ShotRenderEngine;
  outputSize: [number, number];
  projectShotFrames: number;
  attemptsPerShot: number;
}): number =>
  staleShots.reduce((totalCredits, shot) => {
    const shotFrames = resolveShotRenderFrames({
      shotDurationSeconds: shot.duration_s,
      projectShotFrames,
      shotEngine
    });
    const referenceImageCount = countShotReferenceImages(shot, {
      isContinuationSent: Boolean(shot.sequential?.enabled)
    });

    return (
      totalCredits +
      (shotEngine === VideoEngine.seedance_2_5 ? 1 : attemptsPerShot) *
        estimateShotRenderCredits({
          shotEngine,
          outputSize,
          shotFrames,
          referenceImageCount
        })
    );
  }, 0);
import { VideoEngine } from "@models/video/types";
