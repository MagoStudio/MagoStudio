import { CutShotVersion } from "@schemas/scriptProject";

import { hasCutShotVersionRenderFailed } from "./hasCutShotVersionRenderFailed";

export const isCutShotVersionAwaitingDub = (version: CutShotVersion): boolean =>
  !!version.awaiting_dub && !hasCutShotVersionRenderFailed(version);
