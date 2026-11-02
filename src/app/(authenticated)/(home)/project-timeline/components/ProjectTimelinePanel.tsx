"use client";

import { Icon } from "@components/Icon";
import { type TimelineShotEntry } from "@domains/project/useProjectTimelineData";
import { useAtomValue } from "jotai";
import { useRef } from "react";
import { useResizeObserver } from "usehooks-ts";

import { projectTimelineZoomIndexAtom } from "../atoms";
import {
  ADD_CELL_WIDTH_RATIO,
  TRACK_LEFT_PADDING_PX,
  ZOOM_LEVELS
} from "../constants";
import { getTimelineClipsAreaWidth } from "../utils/getTimelineClipsAreaWidth";
import { getTimelineContentWidth } from "../utils/getTimelineContentWidth";

import { ProjectTimelinePlayButton } from "./ProjectTimelinePlayButton";
import { ProjectTimelinePlayhead } from "./ProjectTimelinePlayhead";
import { ProjectTimelineRuler } from "./ProjectTimelineRuler";
import { ProjectTimelineTrack } from "./ProjectTimelineTrack";

const ACTION_PANEL_WIDTH = 80;
const TRACK_CONTENT_PADDING = 8;
const PANEL_HEIGHT = 220;
const TRACK_ROW_HEIGHT = 80;

interface ProjectTimelinePanelProps {
  shots: TimelineShotEntry[];
  totalDurationFrames: number;
  fps: number;
  pinnedTrackIds: Record<string, string>;
}

export function ProjectTimelinePanel({
  shots,
  totalDurationFrames,
  fps,
  pinnedTrackIds
}: ProjectTimelinePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null!);
  const scrollContainerRef = useRef<HTMLDivElement>(null!);
  const { width: containerWidth = 0 } = useResizeObserver({
    ref: containerRef
  });
  const trackAreaWidth = Math.max(
    0,
    containerWidth - ACTION_PANEL_WIDTH - TRACK_CONTENT_PADDING
  );

  const zoomIndex = useAtomValue(projectTimelineZoomIndexAtom);
  const zoomPercent = ZOOM_LEVELS[zoomIndex];
  const contentWidth = getTimelineContentWidth(trackAreaWidth, zoomPercent);
  const clipsAreaWidth = getTimelineClipsAreaWidth(contentWidth);
  const addCellWidth = contentWidth * ADD_CELL_WIDTH_RATIO;

  return (
    <div
      ref={containerRef}
      className="shrink-0 bg-surface-secondary flex overflow-hidden"
      style={{ height: PANEL_HEIGHT }}
      data-testid="project-timeline-panel"
    >
      <div
        className="shrink-0 flex flex-col"
        style={{ width: ACTION_PANEL_WIDTH }}
      >
        <ProjectTimelinePlayButton totalDurationFrames={totalDurationFrames} />
        <div className="flex flex-col gap-0.5 py-0.5">
          <div
            className="flex items-start p-2 border-r border-l border-glyph-invert-main"
            style={{ height: TRACK_ROW_HEIGHT }}
          />
          <div
            className="flex items-start p-2 border-r border-l border-glyph-invert-main"
            style={{ height: TRACK_ROW_HEIGHT }}
          >
            <Icon
              iconSet="16-filled"
              iconName="video"
              className="text-glyph-warning"
            />
          </div>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 flex flex-col overflow-x-auto overflow-y-hidden relative scrollbar-custom"
        data-testid="project-timeline-scroll-container"
      >
        <div
          className="flex flex-col"
          style={{
            width: contentWidth + TRACK_CONTENT_PADDING,
            minWidth: "100%"
          }}
        >
          <div
            className="bg-element-primary h-9 justify-end overflow-visible pt-1 pb-0.5"
            style={{ paddingLeft: TRACK_LEFT_PADDING_PX }}
          >
            <ProjectTimelineRuler
              totalDurationFrames={totalDurationFrames}
              fps={fps}
              widthPx={clipsAreaWidth}
              visibleWidth={clipsAreaWidth}
            />
          </div>

          <div className="flex flex-col gap-0.5 py-0.5">
            <ProjectTimelineTrack
              shots={shots}
              totalDurationFrames={totalDurationFrames}
              trackType="pinned"
              pinnedTrackIds={pinnedTrackIds}
              contentWidth={contentWidth}
              clipsAreaWidth={clipsAreaWidth}
              addCellWidth={addCellWidth}
            />
            <ProjectTimelineTrack
              shots={shots}
              totalDurationFrames={totalDurationFrames}
              trackType="source"
              pinnedTrackIds={pinnedTrackIds}
              contentWidth={contentWidth}
              clipsAreaWidth={clipsAreaWidth}
              addCellWidth={addCellWidth}
            />
          </div>

          <ProjectTimelinePlayhead
            totalDurationFrames={totalDurationFrames}
            contentWidth={clipsAreaWidth}
            offsetLeft={TRACK_LEFT_PADDING_PX}
            scrollContainerRef={scrollContainerRef}
          />
        </div>
      </div>
    </div>
  );
}
