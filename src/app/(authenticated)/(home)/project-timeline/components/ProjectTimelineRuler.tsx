"use client";

import { cn } from "@utils";
import { useSetAtom } from "jotai";

import {
  generateRulerTicks,
  getRulerUnitMode
} from "../../components/TimelineList/TimePanel/Ruler/rulerTicks";
import { projectTimelineFrameAtom, projectTimelinePlayingAtom } from "../atoms";

const RULER_HEIGHT = 36;

interface ProjectTimelineRulerProps {
  totalDurationFrames: number;
  fps: number;
  widthPx: number;
  visibleWidth: number;
}

export function ProjectTimelineRuler({
  totalDurationFrames,
  fps,
  widthPx,
  visibleWidth
}: ProjectTimelineRulerProps) {
  const setCurrentFrame = useSetAtom(projectTimelineFrameAtom);
  const setIsPlaying = useSetAtom(projectTimelinePlayingAtom);

  const rulerWidth = Math.max(widthPx, visibleWidth);
  const virtualDurationFrames =
    rulerWidth > widthPx
      ? totalDurationFrames * (rulerWidth / widthPx)
      : totalDurationFrames;
  const mode = getRulerUnitMode({ durationFrames: totalDurationFrames, fps });
  const ticks = generateRulerTicks({
    durationFrames: virtualDurationFrames,
    fps,
    widthPx: rulerWidth,
    mode
  });

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setIsPlaying(false);
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const framePerPixel = virtualDurationFrames / rulerWidth;
    const clickedFrame = Math.round(clickX * framePerPixel);
    const frame = Math.max(0, Math.min(clickedFrame, totalDurationFrames - 1));
    setCurrentFrame(frame);
  };

  if (totalDurationFrames <= 0 || widthPx <= 0) return null;

  return (
    <div
      className="relative text-glyph-tertiary cursor-pointer overflow-visible"
      style={{ height: RULER_HEIGHT, width: rulerWidth }}
      onClick={handleClick}
      data-testid="project-timeline-ruler"
    >
      <div className="absolute inset-0">
        {ticks.map((tick, index) => {
          const isMajor = tick.kind === "major";

          return (
            <div
              key={index}
              className="absolute bottom-0.5 flex flex-col items-center -translate-x-1/2"
              style={{ left: tick.x }}
            >
              {isMajor && tick.label && (
                <span className="text-[11px] leading-[1.3] tracking-[-0.11px] whitespace-nowrap text-glyph-tertiary">
                  {tick.label}
                </span>
              )}
              <div
                className={cn(
                  "w-px bg-glyph-tertiary",
                  isMajor ? "h-4" : "h-3 opacity-60"
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
