import { useImageAssets } from "@domains/asset/useImageAssets";
import { BulkRendersRunStatus } from "@schemas/bulkRendersRun";

import { useBulkRendersRunDetail } from "./data/useBulkRendersRunDetail";
import { useBulkRendersRunProgress } from "./data/useBulkRendersRunProgress";
import { useBulkRendersRunSteps } from "./data/useBulkRendersRunSteps";
import { buildBulkRendersRunImageResultUrlByAssetId } from "./utils/buildBulkRendersRunImageResultUrlByAssetId";
import {
  IMAGE_CHAIN_TOOL_NAMES,
  VIDEO_CHAIN_TOOL_NAMES
} from "./utils/bulkRendersRunToolChains";
import {
  BulkRendersRunShotImageCardState,
  deriveBulkRendersRunShotImageCardState
} from "./utils/deriveBulkRendersRunShotImageCardState";
import {
  BulkRendersRunShotImageTilePresentation,
  deriveBulkRendersRunShotImageTilePresentation
} from "./utils/deriveBulkRendersRunShotImageTilePresentation";
import {
  BulkRendersRunAggregatePhase,
  deriveBulkRendersRunShotPhases
} from "./utils/deriveBulkRendersRunShotPhases";
import {
  BulkRendersRunShotStepProgress,
  deriveBulkRendersRunShotStepProgress
} from "./utils/deriveBulkRendersRunShotStepProgress";
import {
  BulkRendersRunShotVideoCardState,
  deriveBulkRendersRunShotVideoCardState
} from "./utils/deriveBulkRendersRunShotVideoCardState";
import {
  BulkRendersRunShotVideoReferenceFrameTilePresentation,
  deriveBulkRendersRunShotVideoReferenceFrameTilePresentation
} from "./utils/deriveBulkRendersRunShotVideoReferenceFrameTilePresentation";
import { isBulkRendersRunStatusFailed } from "./utils/isBulkRendersRunStatusFailed";
import { isBulkRendersRunStatusTerminal } from "./utils/isBulkRendersRunStatusTerminal";
import { resolveBulkRendersRunAssetRequestInFlight } from "./utils/resolveBulkRendersRunAssetRequestInFlight";
import {
  BulkRendersRunShotImageSettings,
  resolveBulkRendersRunShotImageSettings
} from "./utils/resolveBulkRendersRunShotImageSettings";
import { resolveBulkRendersRunShotResultAssetId } from "./utils/resolveBulkRendersRunShotResultAssetId";
import { resolveBulkRendersRunShotVideoReferenceFrameAssetId } from "./utils/resolveBulkRendersRunShotVideoReferenceFrameAssetId";
import {
  BulkRendersRunShotVideoResultRender,
  resolveBulkRendersRunShotVideoResultRender
} from "./utils/resolveBulkRendersRunShotVideoResultRender";
import {
  BulkRendersRunShotVideoSettings,
  resolveBulkRendersRunShotVideoSettings
} from "./utils/resolveBulkRendersRunShotVideoSettings";

export interface BulkRendersRunViewShot {
  shotId: string;
  imageChainProgress: BulkRendersRunShotStepProgress;
  videoChainProgress: BulkRendersRunShotStepProgress;
  imageCardState: BulkRendersRunShotImageCardState;
  imageTilePresentation: BulkRendersRunShotImageTilePresentation;
  imageResultUrl: string | undefined;
  imageSettings: BulkRendersRunShotImageSettings;
  videoCardState: BulkRendersRunShotVideoCardState;
  videoResultRender: BulkRendersRunShotVideoResultRender | undefined;
  videoReferenceFrameUrl: string | undefined;
  videoReferenceFrameTilePresentation: BulkRendersRunShotVideoReferenceFrameTilePresentation;
  videoSettings: BulkRendersRunShotVideoSettings;
}

export interface BulkRendersRunView {
  isLoading: boolean;
  isError: boolean;
  name: string | null;
  status: BulkRendersRunStatus | null;
  aggregatePhase: BulkRendersRunAggregatePhase;
  shots: BulkRendersRunViewShot[];
}

export const useBulkRendersRunView = (
  bulkRunId: string | undefined
): BulkRendersRunView => {
  const {
    data: progress,
    isLoading: isProgressLoading,
    isError: isProgressError
  } = useBulkRendersRunProgress(bulkRunId);

  const isBulkRendersRunActive = progress
    ? !isBulkRendersRunStatusTerminal(progress.status)
    : !isProgressError;

  const {
    data: steps,
    isLoading: isStepsLoading,
    isError: isStepsError
  } = useBulkRendersRunSteps({
    bulkRunId,
    isBulkRendersRunActive
  });

  const { data: detail } = useBulkRendersRunDetail(bulkRunId);

  const shotIds = progress?.input_settings?.timeline_ids ?? [];
  const resolvedSteps = steps ?? [];
  const hasRunFailed = isBulkRendersRunStatusFailed(progress?.status);

  const { aggregate: aggregatePhase } = deriveBulkRendersRunShotPhases({
    shotIds,
    steps: resolvedSteps,
    hasRunFailed
  });
  const imageChainProgressByShotId = deriveBulkRendersRunShotStepProgress({
    shotIds,
    steps: resolvedSteps,
    chainToolNames: IMAGE_CHAIN_TOOL_NAMES
  });
  const videoChainProgressByShotId = deriveBulkRendersRunShotStepProgress({
    shotIds,
    steps: resolvedSteps,
    chainToolNames: VIDEO_CHAIN_TOOL_NAMES
  });

  const shotCardDerivations = shotIds.map((shotId) => {
    const shotSteps = resolvedSteps.filter(
      (step) => step.timeline_id === shotId
    );

    return {
      shotId,
      imageCardState: deriveBulkRendersRunShotImageCardState(shotSteps),
      imageResultAssetId: resolveBulkRendersRunShotResultAssetId(shotSteps),
      videoCardState: deriveBulkRendersRunShotVideoCardState(shotSteps),
      videoResultRender: resolveBulkRendersRunShotVideoResultRender(shotSteps),
      videoReferenceFrameAssetId:
        resolveBulkRendersRunShotVideoReferenceFrameAssetId(shotSteps)
    };
  });

  const readyImageResultAssetIds = shotCardDerivations
    .filter((shot) => shot.imageCardState === "ready")
    .map((shot) => shot.imageResultAssetId)
    .filter((assetId): assetId is string => !!assetId);
  const videoReferenceFrameAssetIds = shotCardDerivations
    .map((shot) => shot.videoReferenceFrameAssetId)
    .filter((assetId): assetId is string => !!assetId);
  const imageAssetIdsToResolveSet = new Set([
    ...readyImageResultAssetIds,
    ...videoReferenceFrameAssetIds
  ]);
  const imageAssetIdsToResolve = [...imageAssetIdsToResolveSet];

  const { data: resolvedImageAssets, isLoading: isResolvingRunImageAssets } =
    useImageAssets({
      assetIds: imageAssetIdsToResolve,
      enabled: imageAssetIdsToResolve.length > 0
    });
  const imageResultUrlByAssetId =
    buildBulkRendersRunImageResultUrlByAssetId(resolvedImageAssets);

  return {
    isLoading: isProgressLoading || isStepsLoading,
    isError: isProgressError || isStepsError,
    name: progress?.name ?? null,
    status: progress?.status ?? null,
    aggregatePhase,
    shots: shotCardDerivations.map((shot) => {
      const {
        shotId,
        imageCardState,
        imageResultAssetId,
        videoCardState,
        videoReferenceFrameAssetId
      } = shot;

      const imageResultUrl = imageResultAssetId
        ? imageResultUrlByAssetId.get(imageResultAssetId)
        : undefined;
      const videoReferenceFrameUrl = videoReferenceFrameAssetId
        ? imageResultUrlByAssetId.get(videoReferenceFrameAssetId)
        : undefined;
      const isImageResultRequestInFlight =
        resolveBulkRendersRunAssetRequestInFlight({
          assetId: imageResultAssetId,
          resolvedUrl: imageResultUrl,
          requestedAssetIds: imageAssetIdsToResolveSet,
          isAssetBatchLoading: isResolvingRunImageAssets
        });
      const isVideoReferenceFrameRequestInFlight =
        resolveBulkRendersRunAssetRequestInFlight({
          assetId: videoReferenceFrameAssetId,
          resolvedUrl: videoReferenceFrameUrl,
          requestedAssetIds: imageAssetIdsToResolveSet,
          isAssetBatchLoading: isResolvingRunImageAssets
        });

      return {
        shotId,
        imageChainProgress: imageChainProgressByShotId[shotId],
        videoChainProgress: videoChainProgressByShotId[shotId],
        imageCardState,
        imageTilePresentation: deriveBulkRendersRunShotImageTilePresentation({
          cardState: imageCardState,
          hasResolvedImage: !!imageResultUrl,
          isAssetRequestInFlight: isImageResultRequestInFlight
        }),
        imageResultUrl,
        imageSettings: resolveBulkRendersRunShotImageSettings({
          shotId,
          runImg2ImgSettings: detail?.input_data?.img2img_settings,
          shotOverridesById: detail?.input_data?.shot_overrides
        }),
        videoCardState,
        videoResultRender: shot.videoResultRender,
        videoReferenceFrameUrl,
        videoReferenceFrameTilePresentation:
          deriveBulkRendersRunShotVideoReferenceFrameTilePresentation({
            hasReferenceFrameAssetId: !!videoReferenceFrameAssetId,
            hasResolvedReferenceFrame: !!videoReferenceFrameUrl,
            isAssetRequestInFlight: isVideoReferenceFrameRequestInFlight
          }),
        videoSettings: resolveBulkRendersRunShotVideoSettings({
          shotId,
          runVideoSettings: detail?.input_data?.video_settings,
          shotOverridesById: detail?.input_data?.shot_overrides
        })
      };
    })
  };
};
