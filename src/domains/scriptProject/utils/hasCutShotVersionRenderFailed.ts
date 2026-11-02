import { CutShotVersion } from "@schemas/scriptProject";

import { FAILED_RENDER_STATUSES } from "./summariseShotRenderState";

export const hasCutShotVersionRenderFailed = (
  version: CutShotVersion
): boolean =>
  !version.ready && FAILED_RENDER_STATUSES.has(version.status.toLowerCase());
