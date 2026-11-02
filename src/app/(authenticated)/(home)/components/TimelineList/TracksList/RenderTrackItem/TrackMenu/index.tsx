import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { Menu } from "@components/Menu";
import { MenuItem } from "@components/MenuItem";
import { MenuItemButton } from "@components/MenuItemButton";
import { MenuItemText } from "@components/MenuItemText";
import { MenuList } from "@components/MenuList";
import { useResolvedQueueStatus } from "@domains/queue/useResolvedQueueStatus";
import { isRenderCancelable } from "@domains/queue/utils/isRenderCancelable";
import { useSelectedShot } from "@domains/shot/useSelectedShot";
import { terminalTrackStatuses } from "@domains/track/constants";
import { useDeleteTrackFromProject } from "@domains/track/useDeleteTrackFromProject";
import { useFilteredAndSortedTracks } from "@domains/track/useFilteredAndSortedTracks";
import { useSelectedTrackIds } from "@domains/track/useSelectedTrackIds";
import { useSetSelectedTrackIds } from "@domains/track/useSetSelectedTrackIds";
import { getTrackAssetData } from "@domains/track/utils/getTrackAssetData";
import { useDownloadInfoRichVideo } from "@hooks/files/useDownloadInfoRichVideo";
import {
  isVideoDownloadable,
  areFramesDownloadable,
  areVideoAndFramesDownloadable,
  isEXRDownloadable,
  isEXRRender,
  handleDownloadFrames,
  handleDownloadVideo,
  handleDownloadVideoAndFramesZip,
  handleDownloadEXR
} from "@hooks/files/utils";
import { useQueue } from "@hooks/queue/useQueue";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { Layer } from "@schemas/layer";
import { useToast } from "@store/useToast";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { CopyRenderSettingsMenuItem } from "./CopyRenderSettingsMenuItem";

interface TrackMenuProps {
  track: Layer;
  setIsHiddenWhileDeleting: (isHiddenWhileDeleting: boolean) => void;
}

export const TrackMenu: React.FC<TrackMenuProps> = ({
  track,
  setIsHiddenWhileDeleting
}) => {
  const { t } = useTranslation();
  const [isDownloading, setIsDownloading] = useState(false);

  const selectedTrackIds = useSelectedTrackIds();
  const setSelectedTrackIds = useSetSelectedTrackIds();
  const { data: queue } = useQueue();
  const { data: selectedShot } = useSelectedShot();
  const {
    data: { videoTrack }
  } = useFilteredAndSortedTracks();
  const { handleDeleteTrack } = useDeleteTrackFromProject();

  const { showToast } = useToast();

  const { status, queueItem } = useResolvedQueueStatus({
    trackId: track.id,
    assetStatus: getTrackAssetData(track)?.queue_status
  });

  const isDeletable =
    (!!status && terminalTrackStatuses.includes(status)) ||
    isRenderCancelable({
      status,
      positionInQueue: queueItem?.display_order
    });

  const {
    downloadInfoRichVideo,
    isDownloading: isInfoRichDownloading,
    canDownload: canDownloadInfoRich,
    progress: infoRichProgress
  } = useDownloadInfoRichVideo(track);

  const isEXR = isEXRRender(track);
  const handleDownloadError = () => {
    showToast({
      message: t("notifications.download_failed.description")
    });
  };
  const canDownloadFrames = areFramesDownloadable(track) && !isDownloading;
  const canDownloadVideo = isVideoDownloadable(track) && !isDownloading;
  const canDownloadVideoAndFrames =
    areVideoAndFramesDownloadable(track) && !isDownloading;
  const canDownloadEXR = isEXRDownloadable(track) && !isDownloading;

  const deleteTrackWithRecovery = () => {
    handleDeleteTrack(track, queue).catch((error: unknown) => {
      console.error("Failed to delete track:", error);
      setIsHiddenWhileDeleting(false);
    });
  };

  return (
    <Menu
      className="flex items-center"
      button={
        <IconActionButton
          aria-label={`${track.name} layer menu`}
          icon={<Icon iconSet="16" iconName="menu-dots" />}
          variant="onImage"
          loading={isDownloading || isInfoRichDownloading}
          onPress={() => {
            trackingUtils.trackActions.menu(track.id);
          }}
        />
      }
      placement="bottom-start"
    >
      {({ close }) => (
        <MenuList>
          {isEXR ? (
            <MenuItem>
              <MenuItemButton
                disabled={!canDownloadEXR}
                onClick={async () => {
                  close();
                  await handleDownloadEXR({
                    track,
                    setIsDownloading,
                    onError: handleDownloadError
                  });
                }}
              >
                <MenuItemText
                  title={t("actions.download_as_exr.label")}
                  titleColor={
                    canDownloadEXR ? "glyph-secondary" : "glyph-disabled"
                  }
                />
              </MenuItemButton>
            </MenuItem>
          ) : (
            <MenuItem>
              <MenuItemButton
                disabled={!canDownloadFrames}
                onClick={async () => {
                  close();
                  await handleDownloadFrames({
                    track,
                    trigger: "track_three_dots_dropdown",
                    setIsDownloading,
                    onError: handleDownloadError
                  });
                }}
              >
                <MenuItemText
                  title={t("actions.download_as_png.label")}
                  titleColor={
                    canDownloadFrames ? "glyph-secondary" : "glyph-disabled"
                  }
                />
              </MenuItemButton>
            </MenuItem>
          )}

          <MenuItem>
            <MenuItemButton
              disabled={!canDownloadVideo}
              onClick={async () => {
                close();
                await handleDownloadVideo({
                  projectName: selectedShot?.name || "Untitled",
                  track,
                  trigger: "track_three_dots_dropdown",
                  setIsDownloading,
                  onError: handleDownloadError
                });
              }}
            >
              <MenuItemText
                title="Download as video"
                titleColor={
                  canDownloadVideo ? "glyph-secondary" : "glyph-disabled"
                }
              />
            </MenuItemButton>
          </MenuItem>

          <MenuItem>
            <MenuItemButton
              disabled={!canDownloadVideoAndFrames}
              onClick={async () => {
                close();
                await handleDownloadVideoAndFramesZip({
                  track,
                  setIsDownloading,
                  onError: handleDownloadError
                });
              }}
            >
              <MenuItemText
                title="Download as video and images"
                titleColor={
                  canDownloadVideoAndFrames
                    ? "glyph-secondary"
                    : "glyph-disabled"
                }
              />
            </MenuItemButton>
          </MenuItem>

          <MenuItem>
            <MenuItemButton
              disabled={!canDownloadInfoRich || isInfoRichDownloading}
              onClick={async () => {
                close();
                await downloadInfoRichVideo();
              }}
            >
              <MenuItemText
                title={
                  isInfoRichDownloading
                    ? `${t("actions.download_with_info.label")} (${infoRichProgress}%)`
                    : t("actions.download_with_info.label")
                }
                titleColor={
                  canDownloadInfoRich && !isInfoRichDownloading
                    ? "glyph-secondary"
                    : "glyph-disabled"
                }
              />
            </MenuItemButton>
          </MenuItem>

          <CopyRenderSettingsMenuItem track={track} onClose={close} />

          <MenuItem>
            <MenuItemButton
              aria-label="Delete layer"
              disabled={!isDeletable}
              onClick={async () => {
                setIsHiddenWhileDeleting(true);
                let newSelectedTrackIds = selectedTrackIds.filter(
                  (trackId) => trackId !== track.id
                );

                if (newSelectedTrackIds.length === 0) {
                  newSelectedTrackIds = [videoTrack.id];
                }

                setSelectedTrackIds(newSelectedTrackIds);

                showToast({
                  message: (
                    <span>
                      The <b>{track.name}</b> will be deleted
                    </span>
                  ),
                  onSubmitText: "Delete",
                  onCancelText: "Cancel",
                  ...(isDeletable && { showTimer: false }),
                  onSubmit: () => {
                    deleteTrackWithRecovery();
                    close();
                  },
                  onCancel: () => {
                    setIsHiddenWhileDeleting(false);
                    setSelectedTrackIds([track.id]);
                    close();
                  },
                  onClose: () => {
                    deleteTrackWithRecovery();
                    close();
                  }
                });
              }}
            >
              <MenuItemText title="Delete" titleColor="glyph-error" />
            </MenuItemButton>
          </MenuItem>
        </MenuList>
      )}
    </Menu>
  );
};
