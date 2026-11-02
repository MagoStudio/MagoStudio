import { ShotState } from "@schemas/scriptProject";

export const isPreviousListedShotThePredecessor = ({
  previousListedShot,
  predecessorShot
}: {
  previousListedShot: ShotState | undefined;
  predecessorShot: ShotState | undefined;
}): boolean => {
  if (!predecessorShot || !previousListedShot) return false;
  return previousListedShot.timeline_id === predecessorShot.timeline_id;
};
