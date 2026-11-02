import { GhostButton } from "@components/GhostButton";
import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { Tooltip } from "@components/Tooltip";
import { useProject } from "@domains/project/useProject";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useResolvedQueueStatus } from "@domains/queue/useResolvedQueueStatus";
import { getTrackAssetData } from "@domains/track/utils/getTrackAssetData";
import { isRenderOutputTrack } from "@domains/track/utils/isRenderOutputTrack";
import { useDownloadSbsVideo } from "@hooks/files/useDownloadSbsVideo";
import {
  areFramesDownloadable,
  handleDownloadFrames,
  handleDownloadVideo,
  isVideoDownloadable
} from "@hooks/files/utils";
import { Layer } from "@schemas/layer";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { TrackMenu } from "../TrackMenu";

import { EditableTrackName } from "./EditableTrackName";
import { RenderStatus } from "./RenderStatus";

interface TrackDetailsProps {
  shouldDisplayDoneIndicator: boolean;
  track: Layer;
  setRenamingTrackId: (id: Layer["id"] | null) => void;
  setIsHiddenWhileDeleting: (isHiddenWhileDeleting: boolean) => void;
  onUseAsInpaintingMask?: () => void;
}

export const TrackDetails: React.FC<TrackDetailsProps> = ({
  shouldDisplayDoneIndicator,
  track,
  setRenamingTrackId,
  setIsHiddenWhileDeleting,
  onUseAsInpaintingMask
}) => {
  const { t } = useTranslation();
  const selectedProjectId = useSelectedProjectId();
  const { data: selectedProject } = useProject(selectedProjectId);

  const hasFrames = track.clips && track.clips.length > 0;
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!selectedProject) {
      throw new Error("No project found");
    }
    if (isVideoDownloadable(track)) {
      await handleDownloadVideo({
        projectName: selectedProject?.name,
        track,
        trigger: "track_download_icon",
        setIsDownloading
      });
    } else if (areFramesDownloadable(track)) {
      await handleDownloadFrames({
        track,
        trigger: "track_download_icon",
        setIsDownloading
      });
    }
  };

  const { isFinished } = useResolvedQueueStatus({
    trackId: track.id,
    assetStatus: getTrackAssetData(track)?.queue_status
  });

  const displayDownloadButton = hasFrames && isFinished;

  const {
    downloadSbsVideo,
    isDownloading: isDownloadingSbsVideo,
    canDownload: canDownloadSbsVideo,
    isCroppedRender: isSbsBlockedByCrop
  } = useDownloadSbsVideo({ trackId: track.id });
  const displaySbsDownloadButton = isRenderOutputTrack(track) && isFinished;

  const sbsDownloadTooltipKey = isSbsBlockedByCrop
    ? "buttonTooltips.download_sbs_video_button_cropped.label"
    : canDownloadSbsVideo
      ? "buttonTooltips.download_sbs_video_button.label"
      : "buttonTooltips.download_sbs_video_button_disabled.label";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-0.5 items-center">
        {onUseAsInpaintingMask && (
          <div className="pointer-events-auto">
            <GhostButton
              colorScheme="white"
              onPress={onUseAsInpaintingMask}
              aria-label={t("inpainting.use_this_mask.label")}
            >
              {t("inpainting.use_this_mask.label")}
            </GhostButton>
          </div>
        )}

        {displayDownloadButton && (
          <div className="pointer-events-auto">
            <Tooltip
              textContent={t("buttonTooltips.download_video_button.label")}
            >
              <IconActionButton
                aria-label={`Download video for track ${track.name}`}
                icon={<Icon iconSet="16" iconName="download" />}
                variant="onImage"
                isDisabled={isDownloading}
                loading={isDownloading}
                onPress={handleDownload}
              />
            </Tooltip>
          </div>
        )}

        {displaySbsDownloadButton && (
          <div className="pointer-events-auto">
            <Tooltip textContent={t(sbsDownloadTooltipKey)}>
              <IconActionButton
                aria-label={t("buttonTooltips.download_sbs_video_button.label")}
                icon={<Icon iconSet="16" iconName="share" />}
                variant="onImage"
                isDisabled={!canDownloadSbsVideo || isDownloadingSbsVideo}
                loading={isDownloadingSbsVideo}
                onPress={downloadSbsVideo}
              />
            </Tooltip>
          </div>
        )}

        <div className="pointer-events-auto">
          <TrackMenu
            track={track}
            setIsHiddenWhileDeleting={setIsHiddenWhileDeleting}
          />
        </div>

        <RenderStatus
          shouldDisplayDoneIndicator={shouldDisplayDoneIndicator}
          track={track}
        />

        <EditableTrackName
          track={track}
          setRenamingTrackId={setRenamingTrackId}
        />
      </div>
    </div>
  );
};
