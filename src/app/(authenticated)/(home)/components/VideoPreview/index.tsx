import { AssetDownloadIndicator } from "@components/AssetDownloadIndicator";
import { Text } from "@components/Text";
import { DOWNLOAD_PRIORITY } from "@domains/asset/mediaDownloads";
import { useAssetDownloadState } from "@domains/asset/useAssetDownloadPriority";
import { useVideoAsset } from "@domains/asset/useVideoAsset";
import { useResolvedQueueStatus } from "@domains/queue/useResolvedQueueStatus";
import { formatETA } from "@domains/queue/utils/formatEta";
import { useFilteredAndSortedTracks } from "@domains/track/useFilteredAndSortedTracks";
import { useGetVideoTrackReadiness } from "@domains/track/useGetVideoTrackReadiness";
import { getTimelineOffset } from "@domains/track/utils/frameCoordinates";
import { getOutputBiggestSide } from "@domains/track/utils/getOutputBiggestSide";
import { getTrackAssetData } from "@domains/track/utils/getTrackAssetData";
import { getTrackAssetId } from "@domains/track/utils/getTrackAssetId";
import { getTrackClip } from "@domains/track/utils/getTrackClip";
import { getTrackRenderSettings } from "@domains/track/utils/getTrackRenderSettings";
import { shouldShowCroppedRenderComposite } from "@domains/track/utils/shouldShowCroppedRenderComposite";
import { CroppedRenderCompositeView } from "@home/components/VideoPreview/CroppedRenderCompositeView";
import { PreviewMessage } from "@home/components/VideoPreview/PreviewMessage";
import { VideoPreviewWithControlNets } from "@home/components/VideoPreview/VideoPreviewWithControlNets";
import { AssetStatus } from "@schemas/asset";
import { Layer, LayerType } from "@schemas/layer";
import {
  currentVideoFrameAtom,
  videosLoadingAtom,
  viewModeAtom
} from "@store/atoms";
import { useAtomValue, useSetAtom } from "jotai";
import { isNumber } from "lodash";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { getQueueStatusLabel } from "../status/getQueueStatusLabel";

const MAX_4K_RESOLUTION = 4096;

interface Props {
  selectedTrack: Layer | undefined;
  switcherContainer?: HTMLDivElement | null;
  selectedVideoType?: string;
  onSelectedVideoTypeChange?: (value: string) => void;
}

export const TrackPreviewContainer: React.FC<Props> = ({
  selectedTrack,
  switcherContainer,
  selectedVideoType,
  onSelectedVideoTypeChange
}) => {
  const viewMode = useAtomValue(viewModeAtom);
  const { t } = useTranslation();
  const videosLoading = useAtomValue(videosLoadingAtom);
  const setVideosLoading = useSetAtom(videosLoadingAtom);
  const currentVideoFrame = useAtomValue(currentVideoFrameAtom);

  const isVideoLoading = selectedTrack?.id
    ? videosLoading[selectedTrack.id]
    : false;

  const { isVideoAvailable } = useGetVideoTrackReadiness();

  const {
    data: { videoTrack: inputVideoTrack }
  } = useFilteredAndSortedTracks();

  const showVideoPreview = !!selectedTrack;

  const clip = getTrackClip(selectedTrack);

  const asset = clip?.asset;

  const {
    status: currentQueueItemStatus,
    queueItem: currentQueueItem,
    eta
  } = useResolvedQueueStatus({
    trackId: selectedTrack?.id,
    assetStatus: getTrackAssetData(selectedTrack)?.queue_status
  });

  const formattedEta = formatETA(eta);
  const isAlmostDone = eta !== undefined && eta <= 0;

  const trackAssetId = getTrackAssetId(selectedTrack);
  const downloadState = useAssetDownloadState(trackAssetId);
  const { data: videoAsset } = useVideoAsset({
    assetId: trackAssetId,
    priority: DOWNLOAD_PRIORITY.playback,
    selectedLayerId: selectedTrack?.id,
    enabled: !!trackAssetId && !!selectedTrack?.id
  });

  const videoUrlToUse =
    videoAsset && "urlToUse" in videoAsset ? videoAsset.urlToUse : undefined;
  const isVideoAssetReady = !!videoUrlToUse;

  const frameRangeStart = getTimelineOffset(selectedTrack);
  const clipDuration = clip?.data?.duration;
  const frameRange = isNumber(clipDuration)
    ? ([frameRangeStart, frameRangeStart + clipDuration] as [number, number])
    : undefined;

  const outOfRange =
    asset?.type?.toLocaleUpperCase?.() ===
      LayerType.RENDER.toLocaleUpperCase() &&
    frameRange &&
    (currentVideoFrame < frameRange?.[0] ||
      currentVideoFrame > frameRange?.[1]);

  const setIsLoading = useCallback(
    (isLoading: boolean) => {
      const videoId = selectedTrack?.id || "";
      setVideosLoading((prev) => ({
        ...prev,
        [videoId]: isLoading
      }));
    },
    [selectedTrack?.id, setVideosLoading]
  );

  if (outOfRange) {
    return (
      <PreviewMessage
        message={t(
          "notifications.preview_area_current_frame_outside_of_range.description"
        )}
        variant="text"
      />
    );
  }
  if (downloadState === "failed") {
    return (
      <div className="relative h-full w-full">
        <AssetDownloadIndicator assetId={trackAssetId} />
      </div>
    );
  }

  if (currentQueueItemStatus === AssetStatus.PENDING) {
    const queueLabel = getQueueStatusLabel(currentQueueItem?.display_order, t);
    return (
      <PreviewMessage
        variant={
          currentQueueItem && currentQueueItem.display_order === 0
            ? "loading"
            : "status"
        }
        message={
          currentQueueItem && currentQueueItem.display_order === 0
            ? undefined
            : queueLabel
        }
      />
    );
  }

  if (currentQueueItemStatus === AssetStatus.INQUEUE) {
    const queueLabel = getQueueStatusLabel(currentQueueItem?.display_order, t);
    return <PreviewMessage variant="status" message={queueLabel} />;
  }

  const isVideoNotReady =
    currentQueueItemStatus === AssetStatus.FINISHED && !isVideoAssetReady;

  if (currentQueueItemStatus === AssetStatus.INPROGRESS) {
    return (
      <PreviewMessage
        variant="rendering"
        message={
          isAlmostDone
            ? `${t("status.clip_is_rendering.label")}: ${t("status.still_in_progress.label")}`
            : `${t("status.clip_is_rendering.label")}: ${formattedEta} ${t("status.clip_is_rendering_left.label")}`
        }
      />
    );
  }

  if (isVideoNotReady) {
    return <PreviewMessage variant="loading" />;
  }

  if (!showVideoPreview) {
    return null;
  }

  const renderSettings = getTrackRenderSettings(selectedTrack);
  const outputSize = getTrackAssetData(selectedTrack)?.output_size;
  const biggestOutputSide =
    getOutputBiggestSide(renderSettings, outputSize) ?? 0;
  const isAbove4K = biggestOutputSide > MAX_4K_RESOLUTION;

  const isCroppedRenderComposite = shouldShowCroppedRenderComposite({
    selectedTrack,
    inputVideoTrack
  });

  return (
    <div className="relative h-full w-full">
      {isCroppedRenderComposite && inputVideoTrack ? (
        <CroppedRenderCompositeView
          inputVideoTrack={inputVideoTrack}
          renderTrack={selectedTrack}
        />
      ) : (
        <VideoPreviewWithControlNets
          selectedTrack={selectedTrack}
          isVideoLoading={isVideoLoading}
          isVideoAvailable={isVideoAvailable}
          setIsLoading={setIsLoading}
          switcherContainer={switcherContainer}
          selectedVideoType={selectedVideoType}
          onSelectedVideoTypeChange={onSelectedVideoTypeChange}
        />
      )}
      {isAbove4K && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-element-warning px-3 py-2">
          <Text variant="sm" color="glyph-invert-main">
            {t("notifications.video_above_4k.description")}
          </Text>
        </div>
      )}
    </div>
  );
};
