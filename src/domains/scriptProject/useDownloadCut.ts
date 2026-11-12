import { zipBlobs } from "@app/services/zip/zipBlobs";
import { fetchFileBypassingPlaybackCache } from "@app/utils/files/fetchFileBypassingPlaybackCache";
import { triggerBlobDownload } from "@hooks/files/utils";
import { CutShot } from "@schemas/scriptProject";
import { useToast } from "@store/useToast";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { buildCutDownloadName } from "./utils/buildCutDownloadNames";
import { buildCutExportFileName } from "./utils/buildCutExportFileName";
import { resolveCutShotVideo } from "./utils/resolveCutShotVideo";

export const useDownloadCut = (
  cutShots: CutShot[],
  projectName?: string | null
) => {
  const { t } = useTranslation();
  const { showErrorToast } = useToast();
  const [isDownloadingCut, setIsDownloadingCut] = useState(false);

  const downloadableShots = cutShots.filter(
    (cutShot) => !!resolveCutShotVideo(cutShot).videoUrl
  );

  /* Checked rather than assumed: a signed asset URL expires, and a 403's XML body saved under a
   * shot's name is a file the user cannot play and cannot diagnose. */
  const fetchShotVideo = async (url: string): Promise<Response> => {
    const response = await fetchFileBypassingPlaybackCache(url);
    if (!response.ok) {
      throw new Error(
        `Downloading a shot failed with status ${response.status}`
      );
    }
    return response;
  };

  const downloadOneShot = async (cutShot: CutShot) => {
    const { videoUrl } = resolveCutShotVideo(cutShot);
    if (!videoUrl) return;
    try {
      const response = await fetchShotVideo(videoUrl);
      triggerBlobDownload(await response.blob(), buildCutDownloadName(cutShot));
    } catch {
      showErrorToast({
        message: t("script_project.download_shot_failed.label"),
        onRetry: () => void downloadOneShot(cutShot)
      });
    }
  };

  const downloadCut = async () => {
    if (downloadableShots.length === 0) return;
    setIsDownloadingCut(true);
    try {
      const entries = await Promise.all(
        downloadableShots.map(async (cutShot) => {
          const response = await fetchShotVideo(
            resolveCutShotVideo(cutShot).videoUrl!
          );
          return {
            name: buildCutDownloadName(cutShot),
            data: new Uint8Array(await response.arrayBuffer())
          };
        })
      );
      triggerBlobDownload(
        await zipBlobs(entries),
        buildCutExportFileName(projectName, "zip")
      );
    } catch {
      showErrorToast({
        message: t("script_project.download_cut_failed.label"),
        onRetry: () => void downloadCut()
      });
    } finally {
      setIsDownloadingCut(false);
    }
  };

  return {
    downloadCut,
    downloadOneShot,
    isDownloadingCut,
    downloadableShotCount: downloadableShots.length
  };
};
