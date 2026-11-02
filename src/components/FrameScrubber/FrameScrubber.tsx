import { CircularProgress } from "@components/CircularProgress";
import { useContainFitDimensions } from "@domains/sam/useContainFitDimensions";
import { useInputTrackFrameSrc } from "@domains/track/useInputTrackFrameSrc";
import { cn } from "@utils";
import React, { useRef, useState } from "react";
import { useMove } from "react-aria";
import { useHotkeys } from "react-hotkeys-hook";

import { FrameControls } from "./FrameControls";

const DEBOUNCE_MS = 150;
const PERCENT = 100;

type Props = {
  currentFrame: number;
  setCurrentFrame: (frame: number) => void;
  minFrame: number;
  maxFrame: number;
  enableGlobalArrowHotkeys?: boolean;
  overlay?: React.ReactNode;
  bottomActions?: React.ReactNode;
  imageSrc?: string;
  className?: string;
};

export const FrameScrubber: React.FC<Props> = ({
  currentFrame,
  setCurrentFrame,
  minFrame,
  maxFrame,
  enableGlobalArrowHotkeys = false,
  overlay,
  bottomActions,
  imageSrc,
  className
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [visualFrame, setVisualFrame] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startFrameRef = useRef(0);

  const frameRange = maxFrame - minFrame;
  const { inputTrackFrameSrc, isLoading: isFrameLoading } =
    useInputTrackFrameSrc({
      frameNumber: currentFrame,
      enabled: !imageSrc
    });
  const displaySrc = imageSrc ?? inputTrackFrameSrc;

  const {
    containerRef: imageBoundsRef,
    fitDimensions,
    handleImgLoad
  } = useContainFitDimensions();

  const frameFromDeltaX = (deltaX: number) => {
    const width = containerRef.current?.getBoundingClientRect().width ?? 1;
    if (frameRange <= 0) return 0;
    const frameDelta = (deltaX / width) * frameRange;
    return Math.round(frameDelta);
  };

  const frameFromPointerX = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || frameRange <= 0) return minFrame;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(minFrame + ratio * frameRange);
  };

  const debouncedSetFrame = (frame: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setCurrentFrame(frame);
    }, DEBOUNCE_MS);
  };

  const { moveProps } = useMove({
    onMoveStart() {
      setIsDragging(true);
      startFrameRef.current = visualFrame ?? currentFrame;
    },
    onMove({ deltaX }) {
      const delta = frameFromDeltaX(deltaX);
      const next = Math.max(
        minFrame,
        Math.min(maxFrame, startFrameRef.current + delta)
      );
      startFrameRef.current = next;
      setVisualFrame(next);
      debouncedSetFrame(next);
    },
    onMoveEnd() {
      const final = startFrameRef.current;
      setVisualFrame(null);
      setIsDragging(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setCurrentFrame(final);
    }
  });

  const handleContainerPointerDown = (
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if ((e.target as HTMLElement).closest("button, input")) return;
    const frame = frameFromPointerX(e.clientX);
    setVisualFrame(frame);
    startFrameRef.current = frame;
    debouncedSetFrame(frame);
    moveProps.onPointerDown?.(e as unknown as React.PointerEvent<HTMLElement>);
  };

  const handleContainerPointerUp = () => {
    if (!isDragging) {
      setVisualFrame(null);
    }
  };

  const handlePrevFrame = () => {
    if (currentFrame > minFrame) {
      setCurrentFrame(currentFrame - 1);
    }
  };

  const handleNextFrame = () => {
    if (currentFrame < maxFrame) {
      setCurrentFrame(currentFrame + 1);
    }
  };

  useHotkeys(
    "arrowleft",
    handlePrevFrame,
    {
      preventDefault: true,
      enableOnFormTags: false,
      enabled: enableGlobalArrowHotkeys
    },
    [enableGlobalArrowHotkeys, handlePrevFrame]
  );

  useHotkeys(
    "arrowright",
    handleNextFrame,
    {
      preventDefault: true,
      enableOnFormTags: false,
      enabled: enableGlobalArrowHotkeys
    },
    [enableGlobalArrowHotkeys, handleNextFrame]
  );

  const playheadFrame = visualFrame ?? currentFrame;

  return (
    <div
      ref={containerRef}
      {...moveProps}
      onPointerDown={handleContainerPointerDown}
      onPointerUp={handleContainerPointerUp}
      data-testid="frame-scrubber"
      className={cn(
        "group relative flex h-50 w-92 items-center justify-center bg-element-primary rounded overflow-hidden",
        isDragging ? "cursor-grabbing" : "cursor-grab",
        className
      )}
    >
      <div
        ref={imageBoundsRef}
        className="absolute inset-0 flex items-center justify-center"
      >
        {isFrameLoading && !displaySrc ? (
          <CircularProgress size="sm" />
        ) : (
          displaySrc && (
            <div
              className="relative"
              style={
                fitDimensions
                  ? {
                      width: fitDimensions.width,
                      height: fitDimensions.height
                    }
                  : undefined
              }
            >
              <img
                src={displaySrc}
                alt=""
                onLoad={handleImgLoad}
                className="block h-full w-full rounded pointer-events-none"
              />
              {overlay}
            </div>
          )
        )}
      </div>

      {frameRange > 0 && (
        <div
          data-testid="frame-scrubber-playhead"
          className="absolute top-0 bottom-0 w-px bg-red-500 pointer-events-none"
          style={{
            left: `clamp(0px, ${((playheadFrame - minFrame) / frameRange) * PERCENT}%, calc(100% - 1px))`
          }}
        />
      )}

      {bottomActions ? (
        <div className="absolute inset-x-1 bottom-1 flex items-center justify-between gap-1">
          <FrameControls
            currentFrame={currentFrame}
            setCurrentFrame={setCurrentFrame}
            onPrev={handlePrevFrame}
            onNext={handleNextFrame}
          />
          {bottomActions}
        </div>
      ) : (
        <div className="absolute bottom-1 flex items-center justify-center">
          <FrameControls
            currentFrame={currentFrame}
            setCurrentFrame={setCurrentFrame}
            onPrev={handlePrevFrame}
            onNext={handleNextFrame}
          />
        </div>
      )}
    </div>
  );
};
