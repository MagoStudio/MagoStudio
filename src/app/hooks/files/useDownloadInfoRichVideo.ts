import {
  composeInfoRichVideo,
  EncodingProgress
} from "@app/services/mediaBunny";
import { useImageAsset } from "@domains/asset/useImageAsset";
import { useVideoAsset } from "@domains/asset/useVideoAsset";
import { useProject } from "@domains/project/useProject";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { parseSourcesForFrontend } from "@domains/renders/utils/parseRenderDataForFrontend";
import { frameRangeOf } from "@domains/track/utils/frameCoordinates";
import { getTrackAssetId } from "@domains/track/utils/getTrackAssetId";
import { getTrackRenderSettings } from "@domains/track/utils/getTrackRenderSettings";
import { getTrackSources } from "@domains/track/utils/getTrackSources";
import { isTrackAssetFinished } from "@domains/track/utils/isTrackAssetFinished";
import { useFpsForShot } from "@domains/videoPlayer/useFpsForShot";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { RENDER_MODELS } from "@models/video/constants";
import { Layer, LayerType } from "@schemas/layer";
import { useToast } from "@store/useToast";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { triggerBlobDownload } from "./utils";
import { sanitizeDownloadFilename } from "./utils/sanitizeDownloadFilename";

export const useDownloadInfoRichVideo = (track: Layer) => {
  const { t } = useTranslation();
  const { showToast, showHintToast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const selectedProjectId = useSelectedProjectId();
  const { data: selectedProject } = useProject(selectedProjectId);

  const isRenderTrack =
    track.type.toLowerCase() === LayerType.RENDER.toLowerCase();
  const isFinished = isTrackAssetFinished(track);

  const { data: renderVideoAsset } = useVideoAsset({
    assetId: getTrackAssetId(track),
    selectedLayerId: track.id,
    enabled: isRenderTrack && isFinished
  });

  const renderVideoUrl =
    renderVideoAsset &&
    "urlToUse" in renderVideoAsset &&
    renderVideoAsset.urlToUse
      ? renderVideoAsset.urlToUse
      : renderVideoAsset &&
          "s3_url" in renderVideoAsset &&
          renderVideoAsset.s3_url
        ? renderVideoAsset.s3_url
        : null;

  const renderSettings = getTrackRenderSettings(track);
  const magoEngine = renderSettings?.mago_engine as string | undefined;
  const model = RENDER_MODELS.find((m) => m.name === magoEngine);
  const engineDisplayName = model?.displayName ?? magoEngine ?? "Unknown";

  const controlType = (renderSettings?.control_type as string) ?? undefined;
  const prompt = (renderSettings?.prompt as string) ?? undefined;

  const parsedSources = parseSourcesForFrontend({
    sources: getTrackSources(track),
    render_settings: {
      magov2: renderSettings as Record<string, unknown> | undefined
    }
  });
  const imageRefAssetId =
    parsedSources.find((entry) => entry.type === "reference_frame")?.asset_id ||
    (renderSettings?.image_id as string) ||
    undefined;

  const { data: imageRefAsset } = useImageAsset({
    assetId: imageRefAssetId,
    enabled: !!imageRefAssetId && isRenderTrack && isFinished
  });

  const imageRefUrl =
    imageRefAsset && "urlToUse" in imageRefAsset && imageRefAsset.urlToUse
      ? imageRefAsset.urlToUse
      : imageRefAsset && "s3_url" in imageRefAsset && imageRefAsset.s3_url
        ? imageRefAsset.s3_url
        : undefined;

  const imageRefName =
    imageRefAsset && "asset" in imageRefAsset
      ? (
          imageRefAsset as {
            asset?: {
              name?: string;
            };
          }
        ).asset?.name
      : undefined;
  const frameRange = frameRangeOf(track);
  const trackName = track.name;
  const trackId = track.id;
  const projectName = selectedProject?.name ?? "Untitled";
  const { fps } = useFpsForShot();

  const canDownload =
    isRenderTrack &&
    isFinished &&
    !!frameRange &&
    !!trackId &&
    !!trackName &&
    !!fps &&
    !!renderVideoUrl &&
    frameRange.length === 2;
  const downloadInfoRichVideo = async () => {
    if (!renderVideoUrl || !frameRange || !trackId || !trackName) {
      console.warn("Missing required data for info-rich video download");
      return;
    }

    try {
      setIsDownloading(true);
      setProgress(0);

      showHintToast(
        t("notifications.info_rich_video_download_started.description")
      );

      const videoBlob = await composeInfoRichVideo({
        renderVideoUrl,
        startFrame: frameRange[0],
        endFrame: frameRange[1],
        fps,
        projectName,
        trackName,
        engineDisplayName,
        controlType,
        prompt,
        imageRefName,
        imageRefUrl,
        onProgress: (progressInfo: EncodingProgress) => {
          setProgress(progressInfo.percentage);
        }
      });

      triggerBlobDownload(
        videoBlob,
        `${sanitizeDownloadFilename(trackName)}_info.mp4`
      );
      trackingUtils.exportActions.downloadInfoRichVideo({
        trackId
      });
      showHintToast(
        t("notifications.info_rich_video_download_succeeded.description")
      );
    } catch (error) {
      console.error("Error downloading info-rich video:", error);
      showToast({
        message: t("notifications.info_rich_video_download_failed.description")
      });
    } finally {
      setIsDownloading(false);
      setProgress(0);
    }
  };
  return {
    downloadInfoRichVideo,
    isDownloading,
    canDownload,
    progress
  };
};
