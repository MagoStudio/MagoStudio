import { MouseEvent, RefObject } from "react";

export const calculateTimelinePosition = (
  event: { clientX: number },
  timelineRef: RefObject<HTMLDivElement | null>,
  videoDuration: number
) => {
  if (!timelineRef.current) {
    return { position: 0, time: 0 };
  }

  const rect = timelineRef.current.getBoundingClientRect();
  const position = (event.clientX - rect.left) / rect.width;
  const clampedPosition = Math.max(0, Math.min(1, position));
  const time = clampedPosition * videoDuration;

  return { position: clampedPosition, time };
};

export const createPlayheadMouseHandler = ({
  timelineRef,
  videoDuration,
  onTimeChange
}: {
  timelineRef: RefObject<HTMLDivElement | null>;
  videoDuration: number;
  onTimeChange: (time: number) => void;
}) => {
  return (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      const { time } = calculateTimelinePosition(
        moveEvent,
        timelineRef,
        videoDuration
      );
      if (!timelineRef.current) return;

      onTimeChange(time);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };
};
