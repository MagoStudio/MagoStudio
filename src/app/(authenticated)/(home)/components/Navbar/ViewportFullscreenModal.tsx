import { Backdrop } from "@components/Backdrop";
import { BasicTimeline } from "@components/BasicTimeline";
import { CircularProgress } from "@components/CircularProgress";
import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { PlayButton } from "@components/PlayButton";
import { Text } from "@components/Text";
import { useSelectedTracks } from "@domains/track/useSelectedTracks";
import { useDisablePlayButton } from "@domains/videoPlayer/useDisablePlayButton";
import { useFpsForShot } from "@domains/videoPlayer/useFpsForShot";
import { useGlobalPlayableFrameRange } from "@domains/videoPlayer/useGlobalPlayableFrameRange";
import { Dialog, DialogPanel } from "@headlessui/react";
import { ViewportToolbar } from "@home/components/VideoPreview/PreviewButtonGroup";
import { currentVideoFrameAtom, isPlayingAtom } from "@store/atoms";
import { useAtom } from "jotai";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

type ViewportFullscreenModalProps = {
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
  trackName?: string;
};

export const ViewportFullscreenModal: React.FC<
  ViewportFullscreenModalProps
> = ({ children, open, onClose, trackName }) => {
  const { t } = useTranslation();
  const { disablePlayButton, isDownloading } = useDisablePlayButton();
  const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom);
  const [currentFrame, setCurrentFrame] = useAtom(currentVideoFrameAtom);
  const { fps } = useFpsForShot();
  const { globalPlayableFrameRange } = useGlobalPlayableFrameRange();
  const timelineRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);

  const hasValidFrameRange =
    globalPlayableFrameRange.start !== Infinity &&
    globalPlayableFrameRange.end !== -Infinity;
  const minFrame = hasValidFrameRange ? globalPlayableFrameRange.start : 0;
  const maxFrame = hasValidFrameRange ? globalPlayableFrameRange.end : 0;
  const durationInFrames = Math.max(maxFrame - minFrame, 0);
  const timelineFps = fps || 1;
  const videoDuration = durationInFrames / timelineFps;
  const clampedFrame = Math.min(Math.max(currentFrame, minFrame), maxFrame);
  const currentTime = (clampedFrame - minFrame) / timelineFps;
  const { data: selectedTracks } = useSelectedTracks();
  const isMultipleViews = selectedTracks?.length > 1;

  return (
    <Dialog
      as="div"
      className="fixed inset-0 z-modal overflow-hidden rounded-3xl"
      open={open}
      onClose={onClose}
    >
      <Backdrop className="bg-surface-modal-backdrop" />
      <div className="fixed inset-4">
        <DialogPanel className="relative z-10 flex h-full w-full flex-col overflow-hidden rounded-3xl bg-black">
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-glyph-invert-main bg-surface-secondary px-4">
            <Text
              component="span"
              variant="sm"
              weight="semibold"
              color="glyph-primary-on-pic"
              className="truncate select-none"
            >
              {trackName}
            </Text>

            <IconActionButton
              aria-label={t("actions.close_fullscreen.label")}
              icon={<Icon iconSet="16" iconName="fullscreen-off" />}
              onPress={onClose}
              size="sm"
              variant="dark"
            />
          </div>

          <ViewportToolbar showFullscreenToggle={false} />

          <div className="relative flex flex-1 min-h-0 w-full items-center justify-center overflow-hidden border-t border-glyph-invert-main">
            {!isMultipleViews && (
              <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
                <div className="rounded-lg bg-glyph-action-main-opacity-20 px-4 py-3 backdrop-blur-xl shadow-glassmorphism">
                  <CircularProgress
                    color="glyph-primary-on-pic"
                    size="sm"
                    aria-label={t("actions.loading_process.label")}
                  />
                </div>
              </div>
            )}
            <div className="relative z-10 h-full w-full overflow-hidden">
              {children}
            </div>
          </div>

          <div className="shrink-0 bg-surface-secondary-opacity-90 px-4 py-3">
            <div className="flex items-center gap-2">
              {isDownloading ? (
                <div className="w-[60px] flex items-center justify-center">
                  <CircularProgress
                    aria-label={t("status.downloading_asset.label")}
                  />
                </div>
              ) : (
                <PlayButton
                  aria-label={
                    isPlaying
                      ? t("actions.pause_video.label")
                      : t("actions.play_video.label")
                  }
                  isPlaying={isPlaying}
                  isDisabled={disablePlayButton}
                  onPress={() => setIsPlaying((prev) => !prev)}
                  className="w-[60px]"
                />
              )}

              <BasicTimeline
                timelineRef={timelineRef}
                playheadRef={playheadRef}
                videoDuration={videoDuration}
                currentTime={currentTime}
                disabled={false}
                isFullscreen
                onTimeChange={(time) => {
                  setIsPlaying(false);
                  const nextFrame = Math.round(minFrame + time * timelineFps);
                  setCurrentFrame(
                    Math.min(Math.max(nextFrame, minFrame), maxFrame)
                  );
                }}
              />
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
