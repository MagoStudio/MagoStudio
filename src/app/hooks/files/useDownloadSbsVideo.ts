import { composeSbsVideo, EncodingProgress } from "@app/services/mediaBunny";
import { useVideoAsset } from "@domains/asset/useVideoAsset";
import { resolveVideoAssetUrl } from "@domains/asset/utils/resolveVideoAssetUrl";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useSelectedShotId } from "@domains/shot/useSelectedShotId";
import { useFilteredAndSortedTracks } from "@domains/track/useFilteredAndSortedTracks";
import { useGetTracksById } from "@domains/track/useGetTracksById";
import { frameRangeOf } from "@domains/track/utils/frameCoordinates";
import { getTrackAssetData } from "@domains/track/utils/getTrackAssetData";
import { getTrackAssetId } from "@domains/track/utils/getTrackAssetId";
import { getTrackCropSettings } from "@domains/track/utils/getTrackCropSettings";
import { isRenderOutputTrack } from "@domains/track/utils/isRenderOutputTrack";
import { isTrackAssetFinished } from "@domains/track/utils/isTrackAssetFinished";
import { useFpsForShot } from "@domains/videoPlayer/useFpsForShot";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { Layer } from "@schemas/layer";
import { useToast } from "@store/useToast";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { triggerBlobDownload } from "./utils";
import { sanitizeDownloadFilename } from "./utils/sanitizeDownloadFilename";

export const useDownloadSbsVideo = ({ trackId }: { trackId: Layer["id"] }) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const selectedProjectId = useSelectedProjectId();
  const { selectedShotId } = useSelectedShotId();

  const { data: filteredTracks } = useFilteredAndSortedTracks();
  const { videoTrack } = filteredTracks;

  const subjectTrack = useGetTracksById({
    trackIds: [trackId],
    selectedProjectId,
    selectedShotId
  }).data[0];

  const isRenderTrack = isRenderOutputTrack(subjectTrack);
  const isFinished = isTrackAssetFinished(subjectTrack);
  const isCroppedRender = !!getTrackCropSettings(subjectTrack);

  const inputVideoAssetQuery = useVideoAsset({
    assetId: getTrackAssetId(videoTrack),
    selectedLayerId: videoTrack?.id,
    enabled: false
  });

  const renderVideoAssetQuery = useVideoAsset({
    assetId: getTrackAssetId(subjectTrack),
    selectedLayerId: subjectTrack?.id,
    enabled: false
  });

  const frameRange = subjectTrack ? frameRangeOf(subjectTrack) : [0, 0];
  const trackName = subjectTrack?.name;
  const videoSize = getTrackAssetData(subjectTrack)?.size;
  const { fps } = useFpsForShot();

  const videoRatio = videoSize
    ? videoSize[0] && videoSize[1] && videoSize[0] > videoSize[1]
      ? "16:9"
      : "9:16"
    : undefined;

  const canDownload =
    !!subjectTrack &&
    isRenderTrack &&
    isFinished &&
    !isCroppedRender &&
    !!frameRange &&
    !!videoRatio &&
    !!trackName &&
    !!fps &&
    frameRange.length === 2;

  const downloadSbsVideo = async () => {
    if (!subjectTrack || !frameRange || !videoRatio) {
      console.warn("Missing required data for SBS video download");
      return;
    }

    try {
      setIsDownloading(true);
      setProgress(0);

      const [inputVideoResult, renderVideoResult] = await Promise.all([
        inputVideoAssetQuery.refetch(),
        renderVideoAssetQuery.refetch()
      ]);

      const inputVideoUrl = resolveVideoAssetUrl(inputVideoResult.data);
      const renderVideoUrl = resolveVideoAssetUrl(renderVideoResult.data);

      if (!inputVideoUrl || !renderVideoUrl) {
        throw new Error(
          "Missing input or render video url for SBS video download"
        );
      }

      const videoBlob = await composeSbsVideo({
        inputVideoUrl,
        renderVideoUrl,
        startFrame: frameRange[0],
        endFrame: frameRange[1],
        fps,
        onProgress: (progressInfo: EncodingProgress) => {
          setProgress(progressInfo.percentage);
        }
      });

      triggerBlobDownload(
        videoBlob,
        `${sanitizeDownloadFilename(trackName)}_sbs_comparison.mp4`
      );

      trackingUtils.exportActions.downloadSbsVideo({
        trackId,
        videoRatio
      });
    } catch (error) {
      console.error("Error downloading SBS video:", error);
      showToast({
        message: t("notifications.sbs_video_download_failed.description")
      });
    } finally {
      setIsDownloading(false);
      setProgress(0);
    }
  };
  return {
    downloadSbsVideo,
    isDownloading,
    canDownload,
    isCroppedRender,
    progress
  };
};
