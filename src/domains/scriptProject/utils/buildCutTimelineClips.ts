import { CutShot } from "@schemas/scriptProject";

import { doesShotContributeToCut } from "./countShotsContributingToCut";
import { SHOT_FPS } from "./snapShotFrames";
import { hasShotRenderFailed } from "./summariseShotRenderState";

export interface CutTimelineClip {
  timelineId: string;
  sequenceId: number | null;
  shotIndex: number;
  heading: string | null;
  posterUrl: string | null;
  videoUrl: string | null;
  assetId: string | null;
  isClipPlayable: boolean;
  doesClipHaveRender: boolean;
  hasClipRenderFailed: boolean;
  isClipDurationMeasured: boolean;
  durationFrames: number;
  startFrame: number;
}

export interface CutTimelineLayout {
  clips: CutTimelineClip[];
  totalDurationFrames: number;
}

export const buildCutTimelineClips = (
  cutShots: CutShot[],
  durationSecondsByAssetId: Record<string, number>,
  fallbackDurationFrames: number
): CutTimelineLayout => {
  const safeFallbackFrames = Math.max(1, Math.round(fallbackDurationFrames));
  const orderedCutShots = [...cutShots].sort(
    (left, right) => left.shot_index - right.shot_index
  );

  let startFrame = 0;
  const clips = orderedCutShots.map((cutShot) => {
    const measuredSeconds = cutShot.asset_id
      ? durationSecondsByAssetId[cutShot.asset_id]
      : undefined;
    const isClipDurationMeasured =
      typeof measuredSeconds === "number" && measuredSeconds > 0;
    const durationFrames = isClipDurationMeasured
      ? Math.max(1, Math.round(measuredSeconds * SHOT_FPS))
      : safeFallbackFrames;

    const clip: CutTimelineClip = {
      timelineId: cutShot.timeline_id,
      sequenceId: cutShot.sequence_id,
      shotIndex: cutShot.shot_index,
      heading: cutShot.heading ?? null,
      posterUrl: cutShot.poster_url,
      videoUrl: cutShot.url,
      assetId: cutShot.asset_id,
      isClipPlayable: !!cutShot.url,
      doesClipHaveRender: doesShotContributeToCut(cutShot),
      hasClipRenderFailed: hasShotRenderFailed(cutShot),
      isClipDurationMeasured,
      durationFrames,
      startFrame
    };

    startFrame += durationFrames;
    return clip;
  });

  return { clips, totalDurationFrames: startFrame };
};
