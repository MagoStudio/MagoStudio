import { CutShot } from "@schemas/scriptProject";

export const isCutShotShownAsRendering = ({
  shot,
  isShotRendering
}: {
  shot: CutShot;
  isShotRendering: boolean;
}): boolean => isShotRendering || !!shot.isSceneHiddenUntilDubLands;
