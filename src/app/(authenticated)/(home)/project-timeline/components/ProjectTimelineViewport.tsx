"use client";

import { Text } from "@components/Text";
import { type TimelineShotEntry } from "@domains/project/useProjectTimelineData";
import { mapGlobalFrameToShot } from "@domains/project/utils/mapGlobalFrameToShot";
import { useLatestRef } from "@hooks/useLatestRef";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { projectTimelineFrameAtom, projectTimelinePlayingAtom } from "../atoms";
import { resolveFrameAfterPlaybackTick } from "../utils/resolveFrameAfterPlaybackTick";
import { resolveFrameAfterShotEnded } from "../utils/resolveFrameAfterShotEnded";

import { ShotVideo } from "./ShotVideo";

interface ProjectTimelineViewportProps {
  shots: TimelineShotEntry[];
  totalDurationFrames: number;
  fps: number;
  pinnedTrackIds: Record<string, string>;
}

export function ProjectTimelineViewport({
  shots,
  totalDurationFrames,
  fps,
  pinnedTrackIds
}: ProjectTimelineViewportProps) {
  const { t } = useTranslation();
  const [currentFrame, setCurrentFrame] = useAtom(projectTimelineFrameAtom);
  const [isPlaying, setIsPlaying] = useAtom(projectTimelinePlayingAtom);

  const cumulativeStartFrames = shots.map((s) => s.cumulativeStartFrame);
  const shotDurations = shots.map((s) => s.durationFrames);

  const { shotIndex, localFrame } =
    shots.length > 0
      ? mapGlobalFrameToShot(currentFrame, cumulativeStartFrames, shotDurations)
      : { shotIndex: 0, localFrame: 0 };

  const handleTimeUpdate = (
    entry: TimelineShotEntry,
    newLocalFrame: number
  ) => {
    const { nextFrame, shouldPausePlayback } = resolveFrameAfterPlaybackTick({
      shotStartFrame: entry.cumulativeStartFrame,
      shotDurationFrames: entry.durationFrames,
      localFrame: newLocalFrame,
      totalDurationFrames
    });

    setCurrentFrame(nextFrame);
    if (shouldPausePlayback) setIsPlaying(false);
  };
  const handleTimeUpdateRef = useLatestRef(handleTimeUpdate);

  const handleEnded = (entry: TimelineShotEntry) => {
    const { nextFrame, shouldPausePlayback } = resolveFrameAfterShotEnded({
      shotStartFrame: entry.cumulativeStartFrame,
      shotDurationFrames: entry.durationFrames,
      totalDurationFrames
    });

    setCurrentFrame(nextFrame);
    if (shouldPausePlayback) setIsPlaying(false);
  };
  const handleEndedRef = useLatestRef(handleEnded);

  if (shots.length === 0) {
    return (
      <div className="relative flex-1 flex items-center justify-center bg-surface-primary min-h-0">
        <Text component="p" variant="base" color="glyph-secondary">
          {t("projectTimeline.emptyState.label")}
        </Text>
      </div>
    );
  }

  return (
    <div
      className="relative flex-1 bg-black overflow-hidden"
      data-testid="project-timeline-viewport"
    >
      {shots.map((entry, index) => (
        <ShotVideo
          key={entry.shot.id}
          entry={entry}
          pinnedTrackIds={pinnedTrackIds}
          isActive={index === shotIndex}
          isPlaying={isPlaying}
          localFrame={index === shotIndex ? localFrame : 0}
          fps={fps}
          onTimeUpdateRef={handleTimeUpdateRef}
          onEndedRef={handleEndedRef}
        />
      ))}
    </div>
  );
}
