import { BasicTimeline } from "@components/BasicTimeline";
import { useRef } from "react";

import { TimelineThumbnails } from "./TimelineThumbnails";
import { TrimmingHandles } from "./TrimmingHandles";

interface Props {
  videoDuration: number;
  currentTime: number;
  handleMinTimeChange: (time: number) => void;
  handleMaxTimeChange: (time: number) => void;
  handleBothTimesChange: (newMin: number, newMax: number) => void;
  onTimeChange: (time: number) => void;
  onConfirm: () => void;
  className?: string;
  minTrimTime: number;
  maxTrimTime: number;
  disabled?: boolean;
  videoFile?: File | null;
  fps?: number;
}

export const TrimmingTimeline: React.FC<Props> = ({
  videoDuration,
  currentTime,
  handleMinTimeChange,
  handleMaxTimeChange,
  handleBothTimesChange,
  onTimeChange,
  minTrimTime,
  maxTrimTime,
  disabled = false,
  videoFile,
  fps
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={`flex-1 flex items-start relative isolate px-4 ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      ref={containerRef}
    >
      <BasicTimeline
        timelineRef={timelineRef}
        playheadRef={playheadRef}
        videoDuration={videoDuration}
        currentTime={currentTime}
        onTimeChange={onTimeChange}
        disabled={disabled}
      >
        <TimelineThumbnails
          timelineRef={timelineRef}
          videoFile={videoFile}
          videoDuration={videoDuration}
          fps={fps}
        />
      </BasicTimeline>
      <TrimmingHandles
        timelineRef={timelineRef}
        videoDuration={videoDuration}
        minTrimTime={minTrimTime}
        maxTrimTime={maxTrimTime}
        disabled={disabled}
        handleMinTimeChange={handleMinTimeChange}
        handleMaxTimeChange={handleMaxTimeChange}
        handleBothTimesChange={handleBothTimesChange}
      />
    </div>
  );
};
