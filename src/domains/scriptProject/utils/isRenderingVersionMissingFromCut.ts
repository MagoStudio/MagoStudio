import { CutShot } from "@schemas/scriptProject";

import { isCutShotVersionShownAsRendering } from "./isCutShotVersionShownAsRendering";

export const isRenderingVersionMissingFromCut = ({
  isSceneRendering,
  cutShot
}: {
  isSceneRendering: boolean;
  cutShot: CutShot | undefined;
}): boolean => {
  if (!isSceneRendering || !cutShot || cutShot.versions.length === 0)
    return false;
  return !cutShot.versions.some((version) =>
    isCutShotVersionShownAsRendering(cutShot, version)
  );
};
