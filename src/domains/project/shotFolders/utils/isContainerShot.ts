import { Project } from "@schemas/project";
import { Shot } from "@schemas/shot";

export const isContainerShot = (
  shot: Pick<Shot, "id">,
  project: Pick<Project, "settings"> | undefined
): boolean => {
  const containerShotId = project?.settings?.betaI2vShotId;
  if (!containerShotId) return false;
  return shot.id === containerShotId;
};
