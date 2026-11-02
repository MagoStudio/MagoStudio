import { ProjectCut, ProjectState } from "@schemas/scriptProject";

import { estimateRenderedImageCredits } from "./estimateRenderedImageCredits";
import { estimateRenderedVideoCredits } from "./estimateRenderedVideoCredits";

export type ScriptProjectStatsSummary = {
  assetCount: number;
  assetImageCount: number;
  sequenceCount: number;
  shotCount: number;
  renderedVideoCount: number;
  estimatedImageCredits: number;
  estimatedVideoCredits: number;
  totalCostInCredits: number;
};

type BuildScriptProjectStatsSummaryArgs = {
  projectState?: ProjectState;
  cut?: ProjectCut;
  totalCostInCredits?: number;
};

const SUCCESSFUL_VERSION_STATUS = "success";

export const buildScriptProjectStatsSummary = ({
  projectState,
  cut,
  totalCostInCredits = 0
}: BuildScriptProjectStatsSummaryArgs): ScriptProjectStatsSummary => {
  const activeShots = (projectState?.shots ?? []).filter(
    (shot) => !shot.dropped
  );
  const droppedShotTimelineIds = new Set(
    (projectState?.shots ?? [])
      .filter((shot) => shot.dropped)
      .map((shot) => shot.timeline_id)
  );
  const activeCutShots = [
    ...(cut?.shots ?? []),
    ...(cut?.hidden_shots ?? [])
  ].filter((shot) => !droppedShotTimelineIds.has(shot.timeline_id));

  const renderedVideoAssetIds = new Set<string>();
  for (const shot of activeCutShots) {
    if (shot.asset_id && shot.url) renderedVideoAssetIds.add(shot.asset_id);
    for (const version of shot.versions) {
      const isVersionRendered =
        version.ready ||
        !!version.url ||
        version.status.toLowerCase() === SUCCESSFUL_VERSION_STATUS;
      if (isVersionRendered) renderedVideoAssetIds.add(version.asset_id);
    }
  }

  return {
    assetCount: projectState?.keys.length ?? 0,
    assetImageCount:
      projectState?.keys.reduce(
        (imageCount, asset) => imageCount + asset.images.length,
        0
      ) ?? 0,
    sequenceCount: new Set(activeShots.map((shot) => shot.sequence_id)).size,
    shotCount: activeShots.length,
    renderedVideoCount: renderedVideoAssetIds.size,
    estimatedImageCredits: estimateRenderedImageCredits(projectState),
    estimatedVideoCredits: estimateRenderedVideoCredits(cut),
    totalCostInCredits
  };
};
