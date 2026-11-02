import { ShotState } from "@schemas/scriptProject";

export const withPendingShotHiddenEdits = (
  shots: ShotState[],
  pendingHiddenByTimelineId: Map<string, boolean>
): ShotState[] => {
  if (pendingHiddenByTimelineId.size === 0) return shots;

  return shots.map((shot) => {
    const pendingHidden = pendingHiddenByTimelineId.get(shot.timeline_id);
    const isPendingHiddenDifferent =
      pendingHidden !== undefined && pendingHidden !== shot.hidden;
    return isPendingHiddenDifferent ? { ...shot, hidden: pendingHidden } : shot;
  });
};
