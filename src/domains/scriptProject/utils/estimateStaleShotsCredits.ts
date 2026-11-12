import { VideoEngine } from "@models/video/types";
import { SheetGroup, ShotState } from "@schemas/scriptProject";

import { ShotRenderEngine } from "../constants";

import { estimateShotRenderCredits } from "./estimateShotRenderCredits";
import { resolveShotReferenceImageSizes } from "./resolveShotReferenceImageSizes";
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
  attemptsPerShot,
  sheetGroups
}: {
  staleShots: ShotState[];
  shotEngine: ShotRenderEngine;
  outputSize: [number, number];
  projectShotFrames: number;
  attemptsPerShot: number;
  sheetGroups: SheetGroup[];
}): number =>
  staleShots.reduce((totalCredits, shot) => {
    const shotFrames = resolveShotRenderFrames({
      shotDurationSeconds: shot.duration_s,
      projectShotFrames,
      shotEngine
    });
    const referenceImageSizes = resolveShotReferenceImageSizes({
      shot,
      sheetGroups,
      outputSize,
      isContinuationSent: Boolean(shot.sequential?.enabled)
    });

    return (
      totalCredits +
      (shotEngine === VideoEngine.seedance_2_5 ? 1 : attemptsPerShot) *
        estimateShotRenderCredits({
          shotEngine,
          outputSize,
          shotFrames,
          referenceImageSizes
        })
    );
  }, 0);
