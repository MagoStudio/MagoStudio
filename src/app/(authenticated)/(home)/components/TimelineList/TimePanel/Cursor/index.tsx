/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import { TRACK_WIDTH_WITHOUT_BORDER } from "@config/constants";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { useShotMaxFrames } from "@domains/shot/useShotMaxFrames";
import { trackingWithProjectId } from "@hooks/tracking/trackingUtils";
import { currentVideoFrameAtom, isPlayingAtom } from "@store/atoms";
import { cn } from "@utils";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef, useState } from "react";

const OFFSET = 4;
const MAX_CURSOR_POSITION = TRACK_WIDTH_WITHOUT_BORDER - OFFSET;

export const Cursor: React.FC = () => {
  const [draggedPosition, setDraggedPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const selectedProjectId = useSelectedProjectId();
  const shotMaxFrames = useShotMaxFrames();
  const isPlaying = useAtomValue(isPlayingAtom);
  const currentVideoFrame = useAtomValue(currentVideoFrameAtom);
  const setCurrentVideoFrame = useSetAtom(currentVideoFrameAtom);

  const containerRef = useRef<HTMLInputElement>(null);

  const frameDrivenPosition =
    (currentVideoFrame * MAX_CURSOR_POSITION) / shotMaxFrames || 0;
  const position = isDragging ? draggedPosition : frameDrivenPosition;

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newPosition = Math.max(
        0,
        Math.min(e.clientX - containerRect.left, MAX_CURSOR_POSITION)
      );
      setDraggedPosition(newPosition);

      const newFrame = Math.ceil(
        (newPosition * shotMaxFrames) / MAX_CURSOR_POSITION
      );

      setCurrentVideoFrame(newFrame);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      const finalFrame = Math.ceil(
        (draggedPosition * shotMaxFrames) / MAX_CURSOR_POSITION
      );
      setCurrentVideoFrame(finalFrame);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, draggedPosition, setCurrentVideoFrame, shotMaxFrames]);

  const handleMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    setDraggedPosition(frameDrivenPosition);
    setIsDragging(true);

    trackingWithProjectId.timelineActions.playhead(
      currentVideoFrame,
      selectedProjectId
    );
  };

  return (
    <div ref={containerRef} className="relative z-40 h-0 w-timeline-tools">
      <div
        className={cn(
          "absolute -top-2 bottom-0 h-screen w-0.5",
          isPlaying ? "bg-glyph-error" : "bg-glyph-action-secondary"
        )}
        style={{
          left: position
        }}
        onMouseDown={handleMouseDown}
        data-testid="Playhead cursor line"
      >
        <div
          className="relative h-0 w-0"
          style={{
            cursor: isDragging || isPlaying ? "auto" : "ew-resize"
          }}
        >
          <div
            className={cn(
              "absolute top-0 -left-[5px] h-4 w-cursor",
              isPlaying ? "bg-glyph-error" : "bg-glyph-action-secondary"
            )}
            style={{
              clipPath: "polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)"
            }}
          />
        </div>
      </div>
    </div>
  );
};
