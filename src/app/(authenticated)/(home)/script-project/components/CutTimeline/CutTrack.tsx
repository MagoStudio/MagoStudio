import { CutTimelineClip } from "@domains/scriptProject/utils/buildCutTimelineClips";

import { CUT_TRACK_CLIP_HEIGHT_PX, CutTrackClip } from "./CutTrackClip";

const FULL_TRACK_PERCENT = 100;

type Props = {
  clips: CutTimelineClip[];
  totalDurationFrames: number;
  activeClipIndex: number;
  isEveryDurationSettled: boolean;
  onDownloadClip: (clip: CutTimelineClip) => void;
};

export const CutTrack: React.FC<Props> = ({
  clips,
  totalDurationFrames,
  activeClipIndex,
  isEveryDurationSettled,
  onDownloadClip
}) => {
  if (!isEveryDurationSettled || totalDurationFrames <= 0) {
    return (
      <div
        className="w-full animate-pulse rounded bg-element-primary"
        style={{ height: CUT_TRACK_CLIP_HEIGHT_PX }}
        data-testid="cut-timeline-track-skeleton"
      />
    );
  }

  return (
    <div
      className="flex w-full items-center gap-0"
      style={{ height: CUT_TRACK_CLIP_HEIGHT_PX }}
      data-testid="cut-timeline-track"
    >
      {clips.map((clip, index) => (
        <CutTrackClip
          key={clip.timelineId}
          clip={clip}
          widthPercent={
            (clip.durationFrames / totalDurationFrames) * FULL_TRACK_PERCENT
          }
          isActive={index === activeClipIndex}
          onDownload={() => onDownloadClip(clip)}
        />
      ))}
    </div>
  );
};
