"use client";

import { type TimelineShotEntry } from "@domains/project/useProjectTimelineData";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";
import { resolveActiveTrackForShot } from "@domains/project/utils/resolveActiveTrackForShot";
import { useRouter } from "next/navigation";

import { TRACK_LEFT_PADDING_PX } from "../constants";
import { buildShotRenderVideoUrl } from "../utils/buildShotRenderVideoUrl";

import { PinRenderButton } from "./PinRenderButton";
import { ProjectTimelineClip } from "./ProjectTimelineClip";
import { TimelineAddCell } from "./TimelineAddCell";

const PERCENT = 100;

interface ProjectTimelineTrackProps {
  shots: TimelineShotEntry[];
  totalDurationFrames: number;
  trackType: "source" | "pinned";
  pinnedTrackIds: Record<string, string>;
  contentWidth: number;
  clipsAreaWidth: number;
  addCellWidth: number;
}

export function ProjectTimelineTrack({
  shots,
  totalDurationFrames,
  trackType,
  pinnedTrackIds,
  contentWidth,
  clipsAreaWidth,
  addCellWidth
}: ProjectTimelineTrackProps) {
  const router = useRouter();
  const projectId = useSelectedProjectId();
  const isSourceTrack = trackType === "source";

  const openShotOnRenderVideo = (shotId: string) => {
    if (!projectId) return;
    router.push(buildShotRenderVideoUrl(projectId, shotId));
  };

  return (
    <div
      className="flex items-center bg-element-primary py-0.5 pr-0.5"
      style={{ width: contentWidth, paddingLeft: TRACK_LEFT_PADDING_PX }}
      data-testid={`project-timeline-track-${trackType}`}
    >
      <div
        className="flex items-center shrink-0 gap-0"
        style={{ width: clipsAreaWidth }}
      >
        {shots.map((entry) => {
          if (trackType === "source") {
            const { clip, trackId, isBlank } = resolveActiveTrackForShot(
              entry.shot,
              "source",
              pinnedTrackIds
            );
            const widthPercent =
              totalDurationFrames > 0
                ? (entry.durationFrames / totalDurationFrames) * PERCENT
                : 0;

            return (
              <ProjectTimelineClip
                key={entry.shot.id}
                clipData={clip}
                trackId={trackId}
                shotName={entry.shot.name}
                widthPercent={widthPercent}
                isBlank={isBlank}
                onPress={() => openShotOnRenderVideo(entry.shot.id)}
              />
            );
          }

          const { clip, trackId, isBlank, layerName } =
            resolveActiveTrackForShot(entry.shot, "pinned", pinnedTrackIds);

          const { renderDuration, renderOffset } = entry;
          const hasRender = totalDurationFrames > 0 && renderDuration > 0;

          return (
            <div
              key={entry.shot.id}
              className="shrink-0 flex h-[76px]"
              style={{
                width: `${(entry.durationFrames / totalDurationFrames) * PERCENT}%`
              }}
            >
              {hasRender ? (
                <ProjectTimelineClip
                  clipData={clip}
                  trackId={trackId}
                  shotName={layerName ?? entry.shot.name}
                  widthPercent={
                    (renderDuration / entry.durationFrames) * PERCENT
                  }
                  offsetPercent={
                    renderOffset > 0
                      ? (renderOffset / entry.durationFrames) * PERCENT
                      : 0
                  }
                  isBlank={isBlank}
                  onPress={() => openShotOnRenderVideo(entry.shot.id)}
                />
              ) : (
                <div className="w-full h-full p-0.5">
                  <PinRenderButton
                    onPress={() => openShotOnRenderVideo(entry.shot.id)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {isSourceTrack ? (
        <TimelineAddCell widthPx={addCellWidth} />
      ) : (
        <div className="shrink-0" style={{ width: addCellWidth }} />
      )}
    </div>
  );
}
