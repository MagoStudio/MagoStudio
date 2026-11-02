import { RenderStats } from "@domains/project/interface";
import { QueueItem } from "@hooks/queue/interface";
import { Project } from "@schemas/project";
import { ProjectCut, ProjectState } from "@schemas/scriptProject";

import { buildScriptProjectStatsSummary } from "./buildScriptProjectStatsSummary";
import { estimateCloudRenderCredits } from "./estimateCloudRenderCredits";
import { estimateLocalMagoCloudCredits } from "./estimateLocalMagoCloudCredits";

export type OriginAwareScriptProjectStatsSummary = {
  assetCount: number;
  assetImageCount: number;
  sequenceCount: number;
  shotCount: number;
  renderedVideoCount: number;
  estimatedCloudImageCredits: number;
  estimatedCloudVideoCredits: number;
  magoCloudCredits: number;
  isMagoCloudCostEstimated: boolean;
  localRenderSeconds: number;
  magoCloudH3MaxEquivalentCredits: number;
};

type BuildOriginAwareScriptProjectStatsSummaryArgs = {
  projectState?: ProjectState;
  cut?: ProjectCut;
  origin?: Project["origin"];
  renderStats?: Record<string, RenderStats>;
  totalCost?: number;
  queueItems?: QueueItem[];
};

export const buildOriginAwareScriptProjectStatsSummary = ({
  projectState,
  cut,
  origin,
  renderStats = {},
  totalCost = 0,
  queueItems = []
}: BuildOriginAwareScriptProjectStatsSummaryArgs): OriginAwareScriptProjectStatsSummary => {
  const isCloudProject = origin === "cloud";
  const isLocalProject = origin === "local";
  const sharedSummary = buildScriptProjectStatsSummary({ projectState, cut });

  const successfulLocalRenderSeconds = Object.values(renderStats).reduce(
    (seconds, render) =>
      render.success && render.cost <= 0
        ? seconds + render.render_time_in_seconds
        : seconds,
    0
  );
  const durableLocalRenderedVideoCount = Object.entries(renderStats).filter(
    ([key, render]) => key.startsWith("local-script-") && render.success
  ).length;
  const queuedCloudCredits = queueItems.reduce(
    (credits, item) =>
      item.render_provider === "mago-cloud" &&
      Number.isFinite(item.price) &&
      item.price > 0
        ? credits + item.price
        : credits,
    0
  );
  const recordedCloudCredits = Math.max(
    isCloudProject ? totalCost : 0,
    queuedCloudCredits
  );
  const estimatedCloudCredits = estimateCloudRenderCredits(
    projectState,
    cut,
    origin
  );

  return {
    assetCount: sharedSummary.assetCount,
    assetImageCount: sharedSummary.assetImageCount,
    sequenceCount: sharedSummary.sequenceCount,
    shotCount: sharedSummary.shotCount,
    renderedVideoCount: isLocalProject
      ? Math.max(
          sharedSummary.renderedVideoCount,
          durableLocalRenderedVideoCount
        )
      : sharedSummary.renderedVideoCount,
    estimatedCloudImageCredits: isCloudProject
      ? sharedSummary.estimatedImageCredits
      : 0,
    estimatedCloudVideoCredits: isCloudProject
      ? sharedSummary.estimatedVideoCredits
      : 0,
    magoCloudCredits: Math.max(recordedCloudCredits, estimatedCloudCredits),
    isMagoCloudCostEstimated: estimatedCloudCredits > recordedCloudCredits,
    localRenderSeconds: isLocalProject ? successfulLocalRenderSeconds : 0,
    magoCloudH3MaxEquivalentCredits: isLocalProject
      ? estimateLocalMagoCloudCredits(cut)
      : 0
  };
};
