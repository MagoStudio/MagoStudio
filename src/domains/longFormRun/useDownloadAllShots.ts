import { ZipEntry, zipBlobs } from "@app/services/zip/zipBlobs";
import { getTrackAssetId } from "@domains/track/utils/getTrackAssetId";
import { downloadTrackVideoForProject } from "@hooks/files/downloadTrackVideoForProject";
import { triggerBlobDownload } from "@hooks/files/utils";
import { Layer } from "@schemas/layer";
import { useToast } from "@store/useToast";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { LongFormRunViewShot } from "./useLongFormRunView";
import { buildShotZipEntryNames } from "./utils/buildShotZipEntryNames";
import { hasEveryShotSettled } from "./utils/hasEveryShotSettled";

const LONG_FORM_SHOTS_ZIP_FILENAME = "long_form_shots.zip";

interface ReadyLongFormRunViewShot extends LongFormRunViewShot {
  readyRenderTrack: Layer;
}

const isReadyLongFormRunViewShot = (
  shot: LongFormRunViewShot
): shot is ReadyLongFormRunViewShot => !!shot.readyRenderTrack;

export const useDownloadAllShots = (shots: LongFormRunViewShot[]) => {
  const { t } = useTranslation();
  const { showToast, showHintToast } = useToast();
  const [isDownloadingAllShots, setIsDownloadingAllShots] = useState(false);
  const isDownloadInFlightRef = useRef(false);

  const readyShots = shots.filter(isReadyLongFormRunViewShot);
  const areAllShotsSettled = hasEveryShotSettled(
    shots.map((shot) => shot.cardState)
  );
  const canDownloadAllShots = areAllShotsSettled && readyShots.length > 0;

  const downloadAllShots = async () => {
    if (isDownloadInFlightRef.current || !canDownloadAllShots) return;

    isDownloadInFlightRef.current = true;
    setIsDownloadingAllShots(true);
    showHintToast(t("longForm.downloadAll.started.label"));

    const entryNames = buildShotZipEntryNames(
      readyShots.map((shot) => shot.label)
    );

    try {
      const fetchedEntries = await Promise.all(
        readyShots.map(async (shot, index): Promise<ZipEntry | undefined> => {
          try {
            const videoBlob = await downloadTrackVideoForProject({
              projectId: shot.readyRenderTrack.project_id,
              trackId: shot.readyRenderTrack.id,
              assetId: getTrackAssetId(shot.readyRenderTrack)
            });
            return {
              name: entryNames[index],
              data: new Uint8Array(await videoBlob.arrayBuffer())
            };
          } catch {
            return undefined;
          }
        })
      );

      const successfulEntries = fetchedEntries.filter(
        (entry): entry is ZipEntry => !!entry
      );

      if (successfulEntries.length === 0) {
        showToast({ message: t("longForm.downloadAll.failed.label") });
        return;
      }

      const archive = await zipBlobs(successfulEntries);
      triggerBlobDownload(archive, LONG_FORM_SHOTS_ZIP_FILENAME);

      if (successfulEntries.length < readyShots.length) {
        showToast({ message: t("longForm.downloadAll.partial.label") });
      } else {
        showHintToast(t("longForm.downloadAll.succeeded.label"));
      }
    } catch {
      showToast({ message: t("longForm.downloadAll.failed.label") });
    } finally {
      isDownloadInFlightRef.current = false;
      setIsDownloadingAllShots(false);
    }
  };

  return {
    downloadAllShots,
    isDownloadingAllShots,
    canDownloadAllShots,
    areAllShotsSettled
  };
};
