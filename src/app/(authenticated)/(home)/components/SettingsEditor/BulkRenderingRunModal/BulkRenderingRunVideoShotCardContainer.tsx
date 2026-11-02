import { useVideoAsset } from "@domains/asset/useVideoAsset";
import { useVideoFrame } from "@domains/asset/useVideoFrame";
import { getVideoAssetUrl } from "@domains/asset/utils/getVideoAssetUrl";
import { BulkRendersRunShotVideoCardState } from "@domains/bulkRendersRun/utils/deriveBulkRendersRunShotVideoCardState";
import { BulkRendersRunShotVideoReferenceFrameTilePresentation } from "@domains/bulkRendersRun/utils/deriveBulkRendersRunShotVideoReferenceFrameTilePresentation";
import { deriveBulkRendersRunShotVideoTilePresentation } from "@domains/bulkRendersRun/utils/deriveBulkRendersRunShotVideoTilePresentation";
import { BulkRendersRunShotVideoResultRender } from "@domains/bulkRendersRun/utils/resolveBulkRendersRunShotVideoResultRender";
import { resolveBulkRendersRunShotVideoResultTileImageUrl } from "@domains/bulkRendersRun/utils/resolveBulkRendersRunShotVideoResultTileImageUrl";

import { BulkRenderingRunVideoShotCard } from "./BulkRenderingRunVideoShotCard";

const RENDER_FIRST_FRAME_NUMBER = 0;

export function BulkRenderingRunVideoShotCardContainer({
  shotId,
  shotName,
  cardState,
  completedStepCount,
  totalStepCount,
  videoResultRender,
  shotPreviewUrl,
  referenceFrameUrl,
  referenceFrameTilePresentation,
  prompt,
  isSettingsOverridden,
  isSettingsRowDisabled,
  isSettingsPanelOpen,
  onOpenSettingsPanel
}: {
  shotId: string;
  shotName: string;
  cardState: BulkRendersRunShotVideoCardState;
  completedStepCount: number;
  totalStepCount: number;
  videoResultRender: BulkRendersRunShotVideoResultRender | undefined;
  shotPreviewUrl: string | undefined;
  referenceFrameUrl: string | undefined;
  referenceFrameTilePresentation: BulkRendersRunShotVideoReferenceFrameTilePresentation;
  prompt: string | undefined;
  isSettingsOverridden: boolean;
  isSettingsRowDisabled: boolean;
  isSettingsPanelOpen: boolean;
  onOpenSettingsPanel: () => void;
}) {
  const isVideoRenderFinished = cardState === "ready";
  const directPosterUrl = videoResultRender?.posterUrl;
  const directVideoUrl = videoResultRender?.videoUrl;

  const { data: videoResultFrameUrl, isLoading: isVideoResultFrameLoading } =
    useVideoFrame({
      assetId: videoResultRender?.renderAssetId,
      fps: videoResultRender?.renderFps,
      frameNumber: RENDER_FIRST_FRAME_NUMBER,
      enabled: isVideoRenderFinished && !directPosterUrl
    });

  const { data: videoResultAsset, isLoading: isVideoResultAssetLoading } =
    useVideoAsset({
      assetId: videoResultRender?.renderAssetId,
      enabled: isVideoRenderFinished && !!videoResultRender && !directVideoUrl
    });

  const resolvedVideoResultFrameUrl = directPosterUrl ?? videoResultFrameUrl;

  const isVideoResultRequestInFlight =
    isVideoRenderFinished &&
    !resolvedVideoResultFrameUrl &&
    (isVideoResultFrameLoading || isVideoResultAssetLoading);

  const resultTileImageUrl = resolveBulkRendersRunShotVideoResultTileImageUrl({
    cardState,
    shotPreviewUrl,
    videoResultFrameUrl: resolvedVideoResultFrameUrl
  });

  return (
    <BulkRenderingRunVideoShotCard
      shotId={shotId}
      shotName={shotName}
      cardState={cardState}
      completedStepCount={completedStepCount}
      totalStepCount={totalStepCount}
      tilePresentation={deriveBulkRendersRunShotVideoTilePresentation({
        cardState,
        hasResolvedVideo: !!resolvedVideoResultFrameUrl,
        isAssetRequestInFlight: isVideoResultRequestInFlight
      })}
      resultThumbnailUrl={resultTileImageUrl}
      resultVideoUrl={directVideoUrl ?? getVideoAssetUrl(videoResultAsset)}
      referenceFrameUrl={referenceFrameUrl}
      referenceFrameTilePresentation={referenceFrameTilePresentation}
      prompt={prompt}
      isSettingsOverridden={isSettingsOverridden}
      isSettingsRowDisabled={isSettingsRowDisabled}
      isSettingsPanelOpen={isSettingsPanelOpen}
      onOpenSettingsPanel={onOpenSettingsPanel}
    />
  );
}
