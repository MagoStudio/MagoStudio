export const sortShotIdsByShotName = (
  shotIds: string[],
  shotNameById: Map<string, string>
): string[] =>
  [...shotIds].sort((firstShotId, secondShotId) => {
    const firstShotName = shotNameById.get(firstShotId) ?? firstShotId;
    const secondShotName = shotNameById.get(secondShotId) ?? secondShotId;
    return firstShotName.localeCompare(secondShotName);
  });
