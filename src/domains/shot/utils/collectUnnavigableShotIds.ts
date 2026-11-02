import { LayerType } from "@schemas/layer";
import { Project } from "@schemas/project";
import { Shot } from "@schemas/shot";

const holdsRendersButNoImageTrack = (shot: Shot): boolean => {
  const tracks = shot.layers ?? [];
  if (tracks.length === 0) return false;
  return !tracks.some((track) => track.type === LayerType.IMAGE);
};

export const collectUnnavigableShotIds = (
  project: Pick<Project, "timelines" | "settings"> | undefined
): string[] => {
  const shotIdsHoldingRendersOnly = (project?.timelines ?? [])
    .filter(holdsRendersButNoImageTrack)
    .map((shot) => shot.id);

  const registeredContainerShotId = project?.settings?.betaI2vShotId;
  if (
    !registeredContainerShotId ||
    shotIdsHoldingRendersOnly.includes(registeredContainerShotId)
  ) {
    return shotIdsHoldingRendersOnly;
  }

  return [...shotIdsHoldingRendersOnly, registeredContainerShotId];
};
