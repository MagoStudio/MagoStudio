import { CutShot, CutShotVersion } from "@schemas/scriptProject";

import { isCutShotVersionHiddenUntilDubLands } from "./isCutShotVersionHiddenUntilDubLands";
import { isCutShotVersionRendering } from "./isCutShotVersionRendering";

export const isCutShotVersionShownAsRendering = (
  shot: Pick<CutShot, "versions">,
  version: CutShotVersion
): boolean =>
  isCutShotVersionRendering(version) ||
  isCutShotVersionHiddenUntilDubLands(shot, version);
