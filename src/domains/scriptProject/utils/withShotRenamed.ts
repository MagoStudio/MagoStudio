import { ShotState } from "@schemas/scriptProject";

export const withShotRenamed = (
  shots: ShotState[],
  renamedShotTimelineId: string,
  heading: string
): ShotState[] =>
  shots.map((shot) =>
    shot.timeline_id === renamedShotTimelineId ? { ...shot, heading } : shot
  );
