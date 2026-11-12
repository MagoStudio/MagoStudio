import { CutShotVersion } from "@schemas/scriptProject";

export const isCutShotVersionNew = (
  version: Pick<
    CutShotVersion,
    "asset_id" | "ready" | "awaiting_dub" | "upscale_of" | "timeline_upscale_of"
  >,
  viewedVersionIds: ReadonlySet<string>
): boolean =>
  version.ready &&
  !version.awaiting_dub &&
  !version.upscale_of &&
  !version.timeline_upscale_of &&
  !viewedVersionIds.has(version.asset_id);
