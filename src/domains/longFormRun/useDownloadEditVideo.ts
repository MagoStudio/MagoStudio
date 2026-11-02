import {
  joinVideosIntoOne,
  NotJoinableVideosError
} from "@app/services/mediaBunny";
import { getTrackAssetId } from "@domains/track/utils/getTrackAssetId";
import { downloadTrackVideoForProject } from "@hooks/files/downloadTrackVideoForProject";
import { triggerBlobDownload } from "@hooks/files/utils";
import { sanitizeDownloadFilename } from "@hooks/files/utils/sanitizeDownloadFilename";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { Layer } from "@schemas/layer";
import { useToast } from "@store/useToast";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { LongFormRunViewShot } from "./useLongFormRunView";

interface ReadyLongFormRunViewShot extends LongFormRunViewShot {
  readyRenderTrack: Layer;
}

const isReadyLongFormRunViewShot = (
  shot: LongFormRunViewShot
): shot is ReadyLongFormRunViewShot => !!shot.readyRenderTrack;

export const useDownloadEditVideo = (
  shots: LongFormRunViewShot[],
  projectName: string | undefined
) => {
  const { t } = useTranslation();
  const { showToast, showHintToast } = useToast();
  const [isDownloadingEditVideo, setIsDownloadingEditVideo] = useState(false);
  const isDownloadInFlightRef = useRef(false);

  const areAllShotsRendered =
    shots.length > 0 && shots.every(isReadyLongFormRunViewShot);
  const canDownloadEditVideo = areAllShotsRendered && !!projectName;

  const downloadEditVideo = async () => {
    if (isDownloadInFlightRef.current || !canDownloadEditVideo) return;

    isDownloadInFlightRef.current = true;
    setIsDownloadingEditVideo(true);

    try {
      showHintToast(t("longForm.downloadEdit.started.label"));

      const readyShots = shots.filter(isReadyLongFormRunViewShot);
      const videoBlobs = await Promise.all(
        readyShots.map((shot) =>
          downloadTrackVideoForProject({
            projectId: shot.readyRenderTrack.project_id,
            trackId: shot.readyRenderTrack.id,
            assetId: getTrackAssetId(shot.readyRenderTrack)
          })
        )
      );

      const joinedVideo = await joinVideosIntoOne(videoBlobs);
      const downloadFilename = `${sanitizeDownloadFilename(projectName ?? "")}_edit.mp4`;
      triggerBlobDownload(joinedVideo, downloadFilename);

      trackingUtils.exportActions.downloadLongFormEditVideo({
        shotCount: readyShots.length
      });

      showHintToast(t("longForm.downloadEdit.succeeded.label"));
    } catch (error) {
      if (error instanceof NotJoinableVideosError) {
        showToast({ message: t("longForm.downloadEdit.notJoinable.label") });
      } else {
        showToast({ message: t("longForm.downloadEdit.failed.label") });
      }
    } finally {
      isDownloadInFlightRef.current = false;
      setIsDownloadingEditVideo(false);
    }
  };

  return { downloadEditVideo, isDownloadingEditVideo, canDownloadEditVideo };
};
