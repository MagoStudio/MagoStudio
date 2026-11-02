import { CutShotVersion } from "@schemas/scriptProject";

export const isCutShotVersionNew = (
  version: Pick<
    CutShotVersion,
    "asset_id" | "ready" | "upscale_of" | "timeline_upscale_of"
  >,
  viewedVersionIds: ReadonlySet<string>
): boolean =>
  version.ready &&
  !version.upscale_of &&
  !version.timeline_upscale_of &&
  !viewedVersionIds.has(version.asset_id);
