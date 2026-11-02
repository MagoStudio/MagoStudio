type PinnedTrackIdByShotId = Record<string, string>;

export const mergePinnedTrackIds = ({
  base,
  mine,
  theirs
}: {
  base: PinnedTrackIdByShotId;
  mine: PinnedTrackIdByShotId;
  theirs: PinnedTrackIdByShotId;
}): PinnedTrackIdByShotId => {
  const shotIdsChangedInMine = new Set(
    [...Object.keys(base), ...Object.keys(mine)].filter(
      (shotId) => base[shotId] !== mine[shotId]
    )
  );
  return {
    ...Object.fromEntries(
      Object.entries(theirs).filter(
        ([shotId]) => !shotIdsChangedInMine.has(shotId)
      )
    ),
    ...Object.fromEntries(
      Object.entries(mine).filter(([shotId]) =>
        shotIdsChangedInMine.has(shotId)
      )
    )
  };
};
