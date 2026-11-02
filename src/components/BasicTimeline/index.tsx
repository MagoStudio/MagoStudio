import { cn } from "@utils";
import { MouseEvent, ReactNode, RefObject } from "react";

import { calculateTimelinePosition, createPlayheadMouseHandler } from "./utils";

const PERCENTAGE_MULTIPLIER = 100;

interface BasicTimelineProps {
  timelineRef: RefObject<HTMLDivElement | null>;
  playheadRef: RefObject<HTMLDivElement | null>;
  videoDuration: number;
  currentTime: number;
  onTimeChange: (time: number) => void;
  disabled: boolean;
  children?: ReactNode;
  isFullscreen?: boolean;
}

export const BasicTimeline: React.FC<BasicTimelineProps> = ({
  timelineRef,
  playheadRef,
  videoDuration,
  currentTime,
  onTimeChange,
  disabled,
  children,
  isFullscreen
}) => {
  const playheadPosition =
    videoDuration > 0
      ? (currentTime / videoDuration) * PERCENTAGE_MULTIPLIER
      : 0;

  const handleTimelineClick = (e: MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    const { time } = calculateTimelinePosition(e, timelineRef, videoDuration);
    if (!timelineRef.current) return;

    onTimeChange(time);
  };

  const handlePlayheadMouseDown = (e: MouseEvent) => {
    if (disabled) return;
    createPlayheadMouseHandler({
      timelineRef,
      videoDuration,
      onTimeChange
    })(e);
  };

  return (
    <div
      className={cn(
        "relative w-full h-6 bg-element-primary rounded overflow-hidden",
        isFullscreen ? "px-0 h-8" : "px-4 h-6"
      )}
      ref={timelineRef}
      onClick={handleTimelineClick}
    >
      {children}
      <div
        ref={playheadRef}
        className="absolute top-[3px] cursor-grab w-px h-[calc(100%-6px)] bg-element-error pointer-events-auto active:cursor-grabbing"
        style={{ left: `${playheadPosition}%`, zIndex: 1 }}
        onMouseDown={handlePlayheadMouseDown}
      />
    </div>
  );
};
