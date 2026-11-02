import { TRACK_WIDTH_WITHOUT_BORDER } from "@config/constants";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useShotMaxFrames } from "@domains/shot/useShotMaxFrames";
import { useFilteredAndSortedTracks } from "@domains/track/useFilteredAndSortedTracks";
import { getTrackAssetData } from "@domains/track/utils/getTrackAssetData";
import { getTrackDuration } from "@domains/track/utils/getTrackDuration";
import { useFpsForShot } from "@domains/videoPlayer/useFpsForShot";
import { trackingWithProjectId } from "@hooks/tracking/trackingUtils";
import { currentVideoFrameAtom, isPlayingAtom } from "@store/atoms";
import { cn } from "@utils";
import { useAtomValue, useSetAtom } from "jotai";

import { NotchTickRenderer } from "./NotchTickRenderer";
import {
  generateRulerTicks,
  getRulerUnitMode,
  type RulerTick
} from "./rulerTicks";

const DEFAULT_TIMELINE_FRAMES = 200;
const DEFAULT_FPS = 24;
const NO_RULER_TICKS: RulerTick[] = [];

type Props = {
  disabled?: boolean;
  height: number;
};

const dotTickHeight = 16;
const notchHeight = 10;

export const Ruler: React.FC<Props> = ({ disabled, height }) => {
  const selectedProjectId = useSelectedProjectId();

  const isPlaying = useAtomValue(isPlayingAtom);
  const setCurrentVideoFrame = useSetAtom(currentVideoFrameAtom);

  const shotMaxFrames = useShotMaxFrames();
  const {
    data: tracksData,
    isLoading,
    isFetching
  } = useFilteredAndSortedTracks();
  const { fps: fallbackShotFps } = useFpsForShot();

  const effectiveTimelineMaxFrames = disabled
    ? DEFAULT_TIMELINE_FRAMES
    : shotMaxFrames;

  const sourceVideoDurationFrames = getTrackDuration(tracksData?.videoTrack);
  const isSourceVideoInfoLoading =
    Boolean(isLoading) ||
    Boolean(isFetching) ||
    sourceVideoDurationFrames === undefined ||
    sourceVideoDurationFrames === null;

  const assetFps = getTrackAssetData(tracksData?.videoTrack)?.fps;
  const rulerFps = assetFps ?? fallbackShotFps ?? DEFAULT_FPS;

  const notchesAndTicks = isSourceVideoInfoLoading
    ? NO_RULER_TICKS
    : generateRulerTicks({
        durationFrames: effectiveTimelineMaxFrames,
        fps: rulerFps,
        widthPx: TRACK_WIDTH_WITHOUT_BORDER,
        mode: getRulerUnitMode({
          durationFrames: effectiveTimelineMaxFrames,
          fps: rulerFps
        })
      });

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isPlaying) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;

    const framePerPixel =
      effectiveTimelineMaxFrames / TRACK_WIDTH_WITHOUT_BORDER;
    const clickedFrame = Math.round(clickX * framePerPixel);

    const frame = Math.max(
      0,
      Math.min(clickedFrame, effectiveTimelineMaxFrames)
    );

    setCurrentVideoFrame(frame);

    trackingWithProjectId.timelineActions.timelineRuler(
      frame,
      selectedProjectId
    );
  };

  return (
    <div
      className={cn(
        "relative overflow-visible text-glyph-tertiary w-[calc(var(--width-timeline-tools)-8px)]",
        disabled && "pointer-events-none"
      )}
      style={{ height }}
      onClick={handleClick}
    >
      <svg
        width={TRACK_WIDTH_WITHOUT_BORDER}
        height={height}
        className="absolute bottom-0 left-0 w-full pointer-events-none overflow-visible"
      >
        <NotchTickRenderer
          rulerHeight={height}
          dotTickHeight={dotTickHeight}
          notchesAndTicks={notchesAndTicks}
          notchHeight={notchHeight}
        />
      </svg>
    </div>
  );
};
