import { CutShotVersion } from "@schemas/scriptProject";

import { hasCutShotVersionRenderFailed } from "./hasCutShotVersionRenderFailed";

export const isCutShotVersionRendering = (version: CutShotVersion): boolean =>
  !version.ready && !hasCutShotVersionRenderFailed(version);
