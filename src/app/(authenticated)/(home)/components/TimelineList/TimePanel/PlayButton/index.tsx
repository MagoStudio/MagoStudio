import { CircularProgress } from "@components/CircularProgress";
import { PlayButton as DesignSystemPlayButton } from "@components/PlayButton";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useDisablePlayButton } from "@domains/videoPlayer/useDisablePlayButton";
import { useGlobalPlayableFrameRange } from "@domains/videoPlayer/useGlobalPlayableFrameRange";
import { trackingWithProjectId } from "@hooks/tracking/trackingUtils";
import { activeHotkeyAtom, isPlayingAtom } from "@store/atoms";
import { useAtomValue, useAtom } from "jotai";
import { useHotkeys } from "react-hotkeys-hook";
import { useTranslation } from "react-i18next";

const isValidPlaybackRange = (start: number, end: number): boolean => {
  if (start === Infinity || end === -Infinity) return false;
  return end - start > 1;
};

const shouldDisablePlayButton = (
  disablePlayButton: boolean,
  start: number,
  end: number
): boolean => {
  return disablePlayButton || !isValidPlaybackRange(start, end);
};

export const PlayButton: React.FC = () => {
  const { t } = useTranslation();
  const selectedProjectId = useSelectedProjectId();
  const { disablePlayButton, isDownloading } = useDisablePlayButton();
  const { globalPlayableFrameRange } = useGlobalPlayableFrameRange();
  const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom);
  const activeScope = useAtomValue(activeHotkeyAtom);

  const isRangeValid = isValidPlaybackRange(
    globalPlayableFrameRange.start,
    globalPlayableFrameRange.end
  );

  const isPlayDisabled = shouldDisablePlayButton(
    disablePlayButton,
    globalPlayableFrameRange.start,
    globalPlayableFrameRange.end
  );

  const handlePlayToggle = () => {
    if (isPlayDisabled) return;

    if (!isRangeValid) {
      setIsPlaying(false);
      return;
    }
    setIsPlaying(!isPlaying);
    trackingWithProjectId.timelineActions.playButton(selectedProjectId);
  };

  useHotkeys(
    "space",
    (event) => {
      event.preventDefault();
      handlePlayToggle();
    },
    {
      enableOnFormTags: false,
      enabled: activeScope === "projectView"
    },
    [handlePlayToggle, activeScope]
  );

  return (
    <div className="pointer-events-auto">
      {isDownloading ? (
        <div className="w-track-widget h-timeline-header flex items-center justify-center">
          <CircularProgress aria-label={t("status.downloading_asset.label")} />
        </div>
      ) : (
        <DesignSystemPlayButton
          aria-label={isPlaying ? "Pause" : "Play"}
          variant="standalone"
          isPlaying={isPlaying}
          isDisabled={isPlayDisabled}
          onPress={handlePlayToggle}
          className="w-track-widget h-timeline-header"
        />
      )}
    </div>
  );
};
