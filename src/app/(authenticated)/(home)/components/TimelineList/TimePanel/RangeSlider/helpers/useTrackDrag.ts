import { useState, useRef } from "react";
const TRACK_DRAG_SENSIBILITY = 5;
const BASE_FRAME_COUNT_FOR_SENSITIVITY = 100;

interface UseTrackDragProps {
  trackRange: [number, number];
  shotMaxFrames: number;
  onRangeChange: (range: [number, number]) => void;
  onFrameChange: (frame: number) => void;
}

export const useTrackDrag = ({
  trackRange,
  shotMaxFrames,
  onRangeChange,
  onFrameChange
}: UseTrackDragProps) => {
  const [isTrackDragOn, setIsTrackDragOn] = useState(false);
  const [startingTrackRangeOnDrag, setStartingTrackRangeOnDrag] = useState<
    [number, number]
  >([0, 0]);
  const lastMouseXRef = useRef<number>(0);
  const handleTrackDragStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    lastMouseXRef.current = e.clientX;
    setStartingTrackRangeOnDrag(trackRange);
    setIsTrackDragOn(true);
  };
  const handleTrackDragEnd = () => {
    setIsTrackDragOn(false);
  };
  const handleTrackDragMove = (event: React.PointerEvent) => {
    if (!isTrackDragOn) return;
    event.stopPropagation();

    const [startMin, startMax] = startingTrackRangeOnDrag;
    const rangeLength = startMax - startMin;
    const deltaX = lastMouseXRef.current - event.clientX;

    const scaleFactor = Math.max(
      1,
      shotMaxFrames / BASE_FRAME_COUNT_FOR_SENSITIVITY
    );
    const adjustedSensitivity = TRACK_DRAG_SENSIBILITY / scaleFactor;
    const frameMove = deltaX / adjustedSensitivity;

    let newMin = Math.round(startMin - frameMove);
    let newMax = Math.round(startMax - frameMove);

    if (newMin <= 0) {
      newMin = 0;
      newMax = rangeLength;
    } else if (newMax >= shotMaxFrames) {
      newMax = shotMaxFrames;
      newMin = shotMaxFrames - rangeLength;
    }

    newMin = Math.max(0, newMin);
    newMax = Math.min(shotMaxFrames, newMax);

    onFrameChange(newMin);
    onRangeChange([newMin, newMax]);
  };
  return {
    isTrackDragOn,
    setIsTrackDragOn,
    handleTrackDragStart,
    handleTrackDragEnd,
    handleTrackDragMove
  };
};
