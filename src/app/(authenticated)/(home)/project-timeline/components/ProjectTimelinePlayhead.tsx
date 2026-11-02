"use client";

import { cn } from "@utils";
import { useAtom, useAtomValue } from "jotai";
import { type RefObject, useRef, useState } from "react";
import { useEventListener } from "usehooks-ts";

import { projectTimelineFrameAtom, projectTimelinePlayingAtom } from "../atoms";

const AUTO_SCROLL_EDGE_THRESHOLD = 40;
const AUTO_SCROLL_SPEED = 10;
const AUTO_SCROLL_INTERVAL_MS = 16;

interface ProjectTimelinePlayheadProps {
  totalDurationFrames: number;
  contentWidth: number;
  offsetLeft?: number;
  scrollContainerRef: RefObject<HTMLDivElement>;
}

export function ProjectTimelinePlayhead({
  totalDurationFrames,
  contentWidth,
  offsetLeft = 0,
  scrollContainerRef
}: ProjectTimelinePlayheadProps) {
  const [currentFrame, setCurrentFrame] = useAtom(projectTimelineFrameAtom);
  const isPlaying = useAtomValue(projectTimelinePlayingAtom);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null!);
  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const position =
    totalDurationFrames > 0
      ? (currentFrame / totalDurationFrames) * contentWidth
      : 0;

  const stopAutoScroll = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };

  const startAutoScroll = (direction: number) => {
    stopAutoScroll();
    scrollIntervalRef.current = setInterval(() => {
      const sc = scrollContainerRef.current;
      if (!sc) return;
      // eslint-disable-next-line react-compiler/react-compiler -- DOM scroll mutation is intentional
      sc.scrollLeft = Math.max(
        0,
        Math.min(
          sc.scrollLeft + direction * AUTO_SCROLL_SPEED,
          sc.scrollWidth - sc.clientWidth
        )
      );
    }, AUTO_SCROLL_INTERVAL_MS);
  };

  useEventListener("mousemove", (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, contentWidth));
    const frame = Math.round((x / contentWidth) * totalDurationFrames);
    setCurrentFrame(Math.max(0, Math.min(frame, totalDurationFrames - 1)));

    const sc = scrollContainerRef.current;
    if (sc) {
      const scRect = sc.getBoundingClientRect();
      const cursorInContainer = e.clientX - scRect.left;

      if (cursorInContainer < AUTO_SCROLL_EDGE_THRESHOLD && sc.scrollLeft > 0) {
        startAutoScroll(-1);
      } else if (
        cursorInContainer > scRect.width - AUTO_SCROLL_EDGE_THRESHOLD &&
        sc.scrollLeft < sc.scrollWidth - sc.clientWidth
      ) {
        startAutoScroll(1);
      } else {
        stopAutoScroll();
      }
    }
  });

  useEventListener("mouseup", () => {
    if (isDragging) {
      setIsDragging(false);
      stopAutoScroll();
    }
  });

  const handleMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    setIsDragging(true);
  };

  if (totalDurationFrames <= 0 || contentWidth <= 0) return null;

  return (
    <div
      ref={containerRef}
      className="absolute top-0 bottom-0 pointer-events-none z-10 mt-6"
      style={{
        left: offsetLeft,
        width: contentWidth,
        height: "calc(100% - 24px)"
      }}
      data-testid="project-timeline-playhead-container"
    >
      <div
        className={cn(
          "absolute top-0 bottom-0 w-0.5 pointer-events-auto",
          isPlaying ? "bg-glyph-error" : "bg-glyph-action-secondary"
        )}
        style={{ left: position }}
        onMouseDown={handleMouseDown}
        data-testid="project-timeline-playhead"
      >
        <div
          className="absolute w-0 h-0"
          style={{ cursor: isDragging || isPlaying ? "auto" : "ew-resize" }}
        >
          <div
            className={cn(
              "absolute top-0 -left-[5px] h-4 w-[12px]",
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
}
