import { calculateTimelinePosition } from "@components/BasicTimeline/utils";
import { RefObject } from "react";

interface CreateSelectorMouseHandlerParams {
  direction: "left" | "right";
  timelineRef: RefObject<HTMLDivElement | null>;
  videoDuration: number;
  handleMinTimeChange: (time: number) => void;
  handleMaxTimeChange: (time: number) => void;
}

export const createSelectorMouseHandler = ({
  direction,
  timelineRef,
  videoDuration,
  handleMinTimeChange,
  handleMaxTimeChange
}: CreateSelectorMouseHandlerParams) => {
  return (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const { time: newTime } = calculateTimelinePosition(
        moveEvent,
        timelineRef,
        videoDuration
      );
      if (!timelineRef.current) return;

      let adjustedTime = newTime;

      if (direction === "left") {
        handleMinTimeChange(adjustedTime);
      } else {
        handleMaxTimeChange(adjustedTime);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };
};

interface CreateCenterHandleMouseHandlerParams {
  timelineRef: RefObject<HTMLDivElement | null>;
  videoDuration: number;
  handleBothTimesChange: (newMin: number, newMax: number) => void;
  minTrimTime: number;
  maxTrimTime: number;
}

export const createCenterHandleMouseHandler = ({
  timelineRef,
  videoDuration,
  handleBothTimesChange,
  minTrimTime,
  maxTrimTime
}: CreateCenterHandleMouseHandlerParams) => {
  return (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const selectionWidth = maxTrimTime - minTrimTime;

    const { time: startTime } = calculateTimelinePosition(
      e,
      timelineRef,
      videoDuration
    );

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const { time: newTime } = calculateTimelinePosition(
        moveEvent,
        timelineRef,
        videoDuration
      );
      if (!timelineRef.current) return;

      const delta = newTime - startTime;

      let newMin = minTrimTime + delta;
      let newMax = maxTrimTime + delta;

      if (newMin < 0) {
        newMin = 0;
        newMax = selectionWidth;
      } else if (newMax > videoDuration) {
        newMax = videoDuration;
        newMin = videoDuration - selectionWidth;
      }

      handleBothTimesChange(newMin, newMax);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };
};
