import { getTimelineOffset } from "@domains/track/utils/frameCoordinates";
import { getTrackClip } from "@domains/track/utils/getTrackClip";
import { getTrackDuration } from "@domains/track/utils/getTrackDuration";
import { Clip } from "@schemas/clip";
import { Layer, LayerType } from "@schemas/layer";
import { Shot } from "@schemas/shot";

import { useProject } from "./useProject";
import { getShotDurationAndFps } from "./utils/getShotDurationAndFps";

const DEFAULT_FPS = 24;

export interface TimelineShotEntry {
  shot: Shot;
  durationFrames: number;
  fps: number;
  cumulativeStartFrame: number;
  renderClip: Clip | undefined;
  renderOffset: number;
  renderDuration: number;
}

function getPinnedRenderLayerForShot(
  shot: Shot,
  pinnedTrackIds: Record<string, string>
): Layer | undefined {
  const pinnedLayerId = pinnedTrackIds[shot.id];

  if (pinnedLayerId) {
    const pinnedLayer = shot.layers.find(
      (l) => l.id === pinnedLayerId && l.type === LayerType.RENDER
    );
    if (getTrackClip(pinnedLayer)) return pinnedLayer;
  }

  return undefined;
}

export function useProjectTimelineData(projectId: string | undefined) {
  const { data: project, isLoading } = useProject(projectId);

  const timelines = project?.timelines ?? [];
  const pinnedTrackIds = project?.settings?.pinnedTrackIds ?? {};

  const sortedShots = [...timelines].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const shots: TimelineShotEntry[] = [];
  let cumulativeStartFrame = 0;
  let projectFps = DEFAULT_FPS;

  for (const shot of sortedShots) {
    const { durationFrames, fps } = getShotDurationAndFps(shot);

    if (durationFrames <= 0) continue;

    if (shots.length === 0) {
      projectFps = fps;
    }

    const renderLayer = getPinnedRenderLayerForShot(shot, pinnedTrackIds);
    const renderClip = getTrackClip(renderLayer);
    const renderOffset = getTimelineOffset(renderLayer);
    const renderDuration = getTrackDuration(renderLayer) ?? 0;

    shots.push({
      shot,
      durationFrames,
      fps,
      cumulativeStartFrame,
      renderClip,
      renderOffset,
      renderDuration
    });

    cumulativeStartFrame += durationFrames;
  }

  const totalDurationFrames = cumulativeStartFrame;

  return {
    shots,
    totalDurationFrames,
    fps: projectFps,
    isLoading,
    pinnedTrackIds
  };
}
