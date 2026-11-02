/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import { useEffect, useRef, useState } from "react";

const DEFAULT_SLIDER_POSITION = 50;
const MIN_POSITION = 0;
const MAX_POSITION = 100;

type UseSliderPositionOptions = {
  initialPosition?: number;
  containerRef: React.RefObject<HTMLElement | null>;
};

type UseSliderPositionReturn = {
  sliderPosition: number;
  handleSliderMouseDown: (e: React.MouseEvent) => void;
};

export const useSliderPosition = ({
  initialPosition = DEFAULT_SLIDER_POSITION,
  containerRef
}: UseSliderPositionOptions): UseSliderPositionReturn => {
  const [sliderPosition, setSliderPosition] = useState(initialPosition);

  const listenersRef = useRef<{
    move: (e: MouseEvent) => void;
    up: () => void;
  } | null>(null);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const newPosition = ((e.clientX - rect.left) / rect.width) * MAX_POSITION;
      setSliderPosition(
        Math.max(MIN_POSITION, Math.min(MAX_POSITION, newPosition))
      );
    };
    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
    listenersRef.current = { move, up };
    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      listenersRef.current = null;
    };
  }, [containerRef]);

  const handleSliderMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const listeners = listenersRef.current;
    if (!listeners) return;
    document.addEventListener("mousemove", listeners.move);
    document.addEventListener("mouseup", listeners.up);
  };

  return {
    sliderPosition,
    handleSliderMouseDown
  };
};
