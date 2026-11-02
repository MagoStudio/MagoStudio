import { CutShotVersion } from "@schemas/scriptProject";

export const sortCutShotVersionsNewestFirst = (
  versions: CutShotVersion[],
  layerCreatedAtMsByLayerId: ReadonlyMap<string, number>
): CutShotVersion[] => {
  const versionsWithCreationTime = versions.map((version, apiIndex) => ({
    version,
    apiIndex,
    createdAtMs: version.created_at
      ? Date.parse(version.created_at)
      : layerCreatedAtMsByLayerId.get(version.layer_id)
  }));
  return versionsWithCreationTime
    .sort((first, second) => {
      const firstHasCreationTime = first.createdAtMs !== undefined;
      const secondHasCreationTime = second.createdAtMs !== undefined;
      if (firstHasCreationTime !== secondHasCreationTime)
        return firstHasCreationTime ? 1 : -1;
      const creationTimeDifference =
        (second.createdAtMs ?? 0) - (first.createdAtMs ?? 0);
      return creationTimeDifference || second.apiIndex - first.apiIndex;
    })
    .map(({ version }) => version);
};
