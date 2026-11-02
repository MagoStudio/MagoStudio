export const resolveDefaultShotId = ({
  lastViewedShotId,
  shotIdsByMostRecentlyEdited,
  excludedShotIds
}: {
  lastViewedShotId: string | null | undefined;
  shotIdsByMostRecentlyEdited: string[];
  excludedShotIds: string[];
}): string | undefined => {
  const selectableShotIds = shotIdsByMostRecentlyEdited.filter(
    (shotId) => !excludedShotIds.includes(shotId)
  );

  if (lastViewedShotId && selectableShotIds.includes(lastViewedShotId)) {
    return lastViewedShotId;
  }

  return selectableShotIds[0];
};
