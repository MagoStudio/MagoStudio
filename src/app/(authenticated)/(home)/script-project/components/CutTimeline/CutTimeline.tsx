import { CutTimelineClip } from "@domains/scriptProject/utils/buildCutTimelineClips";
import { useRef } from "react";
import { useResizeObserver } from "usehooks-ts";

import { CutPlayhead } from "./CutPlayhead";
import { CutRuler } from "./CutRuler";
import { CutTrack } from "./CutTrack";

const FULL_TRACK_PERCENT = 100;

type Props = {
  clips: CutTimelineClip[];
  totalDurationFrames: number;
  activeClipIndex: number;
  isCutPlaying: boolean;
  isEveryDurationSettled: boolean;
  playheadRef: React.RefObject<HTMLDivElement | null>;
  onSeekToPercent: (percent: number) => void;
  onDownloadClip: (clip: CutTimelineClip) => void;
};

export const CutTimeline: React.FC<Props> = ({
  clips,
  totalDurationFrames,
  activeClipIndex,
  isCutPlaying,
  isEveryDurationSettled,
  playheadRef,
  onSeekToPercent,
  onDownloadClip
}) => {
  const trackAreaRef = useRef<HTMLDivElement>(null);
  const isScrubbingRef = useRef(false);
  const { width: trackAreaWidth = 0 } = useResizeObserver({
    ref: trackAreaRef as React.RefObject<HTMLElement>
  });

  const seekToPointer = (
    event: React.PointerEvent<HTMLDivElement>,
    trackArea: HTMLDivElement
  ) => {
    const bounds = trackArea.getBoundingClientRect();
    if (bounds.width <= 0) return;
    const percentAcrossTrack =
      ((event.clientX - bounds.left) / bounds.width) * FULL_TRACK_PERCENT;
    onSeekToPercent(
      Math.min(FULL_TRACK_PERCENT, Math.max(0, percentAcrossTrack))
    );
  };

  return (
    <div
      className="flex items-stretch"
      data-testid="script-project-cut-timeline"
    >
      <div
        ref={trackAreaRef}
        className="relative min-w-0 flex-1 cursor-ew-resize touch-none select-none"
        onPointerDown={(event) => {
          if (event.button !== 0 || (event.target as Element).closest("button"))
            return;
          isScrubbingRef.current = true;
          event.currentTarget.setPointerCapture?.(event.pointerId);
          seekToPointer(event, event.currentTarget);
        }}
        onPointerMove={(event) => {
          if (!isScrubbingRef.current) return;
          seekToPointer(event, event.currentTarget);
        }}
        onPointerUp={(event) => {
          if (!isScrubbingRef.current) return;
          seekToPointer(event, event.currentTarget);
          isScrubbingRef.current = false;
          if (event.currentTarget.hasPointerCapture?.(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          isScrubbingRef.current = false;
        }}
      >
        <CutRuler
          totalDurationFrames={totalDurationFrames}
          widthPx={trackAreaWidth}
        />
        <CutTrack
          clips={clips}
          totalDurationFrames={totalDurationFrames}
          activeClipIndex={activeClipIndex}
          isEveryDurationSettled={isEveryDurationSettled}
          onDownloadClip={onDownloadClip}
        />
        <CutPlayhead ref={playheadRef} isCutPlaying={isCutPlaying} />
      </div>
    </div>
  );
};
