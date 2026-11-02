import { zipBlobs } from "@app/services/zip/zipBlobs";
import { TimelineShotEntry } from "@domains/project/useProjectTimelineData";
import { selectPinnedClips } from "@domains/project/utils/selectTimelineDownloadClips";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { activeTimelineDownloadsAtom } from "@store/atoms";
import { useToast } from "@store/useToast";
import { useSetAtom } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { downloadTrackVideoForProject } from "./downloadTrackVideoForProject";
import { triggerBlobDownload } from "./utils";
import { sanitizeDownloadFilename } from "./utils/sanitizeDownloadFilename";

interface UseDownloadPinnedClipsParams {
  shots: TimelineShotEntry[];
  pinnedTrackIds: Record<string, string>;
  projectName: string;
  projectId: string | undefined;
}

export const useDownloadPinnedClips = ({
  shots,
  pinnedTrackIds,
  projectName,
  projectId
}: UseDownloadPinnedClipsParams) => {
  const { t } = useTranslation();
  const { showToast, showHintToast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const setActiveDownloads = useSetAtom(activeTimelineDownloadsAtom);

  const clips = selectPinnedClips(shots, pinnedTrackIds);
  const canDownload = clips.length > 0;

  const downloadPinnedClips = async () => {
    if (isDownloading || !canDownload) return;

    try {
      setIsDownloading(true);
      setActiveDownloads((count) => count + 1);
      showHintToast(
        t("notifications.timeline_pinned_download_started.description")
      );

      const entries = await Promise.all(
        clips.map(async (clip) => {
          const blob = await downloadTrackVideoForProject({
            projectId,
            trackId: clip.layerId,
            assetId: clip.assetId
          });
          const data = new Uint8Array(await blob.arrayBuffer());
          return {
            name: `${sanitizeDownloadFilename(clip.shotName)}.mp4`,
            data
          };
        })
      );

      const archive = await zipBlobs(entries);
      triggerBlobDownload(
        archive,
        `${sanitizeDownloadFilename(projectName)}_pinned.zip`
      );

      trackingUtils.exportActions.downloadTimelineClips({
        projectId,
        exportType: "timeline_pinned_zip",
        clipCount: clips.length
      });

      showHintToast(
        t("notifications.timeline_pinned_download_succeeded.description")
      );
    } catch (error) {
      console.error("Error downloading pinned clips:", error);
      showToast({
        message: t("notifications.timeline_pinned_download_failed.description")
      });
    } finally {
      setIsDownloading(false);
      setActiveDownloads((count) => Math.max(0, count - 1));
    }
  };

  return { downloadPinnedClips, isDownloading, canDownload };
};
