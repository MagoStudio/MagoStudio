import { CutShot } from "@schemas/scriptProject";

import { doesShotContributeToCut } from "./countShotsContributingToCut";
import { isCutShotVersionRendering } from "./isCutShotVersionRendering";
import { resolveCutShotVideo } from "./resolveCutShotVideo";
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
  versionAssetId: string | null;
  isClipPlayable: boolean;
  doesClipHaveRender: boolean;
  isClipRendering: boolean;
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
    const { videoUrl, videoAssetId, posterUrl } = resolveCutShotVideo(cutShot);
    const measuredSeconds = videoAssetId
      ? durationSecondsByAssetId[videoAssetId]
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
      posterUrl,
      videoUrl,
      assetId: videoAssetId,
      versionAssetId: cutShot.asset_id,
      isClipPlayable: !!videoUrl,
      doesClipHaveRender:
        doesShotContributeToCut(cutShot) && !cutShot.isSceneHiddenUntilDubLands,
      isClipRendering:
        !!cutShot.isSceneHiddenUntilDubLands ||
        (!doesShotContributeToCut(cutShot) &&
          cutShot.versions.some(isCutShotVersionRendering)),
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
