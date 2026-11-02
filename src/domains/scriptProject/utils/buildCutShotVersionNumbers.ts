import { CutShotVersion } from "@schemas/scriptProject";

export const buildCutShotVersionNumbers = (
  versionsNewestFirst: Pick<CutShotVersion, "asset_id">[]
): Map<string, number> =>
  new Map(
    versionsNewestFirst.map((version, newestFirstIndex) => [
      version.asset_id,
      versionsNewestFirst.length - newestFirstIndex
    ])
  );
