import { isCloudMirroredAssetCachedLocally } from "@domains/asset/utils/isCloudMirroredAssetCachedLocally";
import { getTrackAssetId } from "@domains/track/utils/getTrackAssetId";
import { isTrackOwnedByCloud } from "@domains/track/utils/isTrackOwnedByCloud";
import { downloadLayerVideo } from "@hooks/files/downloadFiles";
import { saveLayerDownloadToDisk } from "@hooks/files/saveLayerDownloadToDisk";
import { saveTrackVideoToDisk } from "@hooks/files/saveTrackVideoToDisk";
import { triggerBlobDownload } from "@hooks/files/utils";
import { sanitizeDownloadFilename } from "@hooks/files/utils/sanitizeDownloadFilename";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { Layer } from "@schemas/layer";
import { useToast } from "@store/useToast";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { getLocalDesktopApi, isLocalApp } from "@/platform/localDesktop";

export const useDownloadImageToVideoRender = (
  track: Layer,
  projectId: string | undefined
) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [isDownloadingRenderVideo, setIsDownloadingRenderVideo] =
    useState(false);

  const downloadRenderVideo = async () => {
    setIsDownloadingRenderVideo(true);

    try {
      const fileName = `${sanitizeDownloadFilename(track.name)}.mp4`;
      if (!isLocalApp) {
        const videoBlob = await downloadLayerVideo({ layerId: track.id });
        triggerBlobDownload(videoBlob, fileName);
      } else {
        const isTrackStoredInCloud = await isTrackOwnedByCloud({
          projectId,
          trackId: track.id
        });
        const trackAssetId = getTrackAssetId(track);
        const mirroredTrackAsset =
          isTrackStoredInCloud && trackAssetId
            ? await getLocalDesktopApi().assets.get(trackAssetId)
            : null;
        const isCloudRenderVideoOnlyInCloud =
          isTrackStoredInCloud &&
          !isCloudMirroredAssetCachedLocally(mirroredTrackAsset);
        if (isCloudRenderVideoOnlyInCloud) {
          await saveLayerDownloadToDisk({
            layerId: track.id,
            kind: "video",
            suggestedName: fileName
          });
        } else {
          await saveTrackVideoToDisk({ track, fileName });
        }
      }
      trackingUtils.exportActions.exportMedias({
        trackId: track.id,
        assetId: getTrackAssetId(track) ?? "",
        trackOrder: track.layer_order,
        trigger: "track_download_icon",
        exportType: "video"
      });
    } catch {
      showToast({
        message: t("projectTimeline.imageToVideo.downloadFailed.label")
      });
    } finally {
      setIsDownloadingRenderVideo(false);
    }
  };

  return { downloadRenderVideo, isDownloadingRenderVideo };
};
