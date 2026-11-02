import { parseShotHeadingNumber } from "./parseShotHeadingNumber";

type ShotHeading = { heading?: string | null; shot_index: number };

const NO_SUGGESTION = "";
const NUMBER_BEFORE_THE_FIRST_SHOT = "0";

const toNumberParts = (shotNumber: string): number[] =>
  shotNumber.split(".").map(Number);

const sortsBefore = (shotNumber: string, laterShotNumber: string): boolean => {
  const parts = toNumberParts(shotNumber);
  const laterParts = toNumberParts(laterShotNumber);
  const deepestLevel = Math.max(parts.length, laterParts.length);
  for (let level = 0; level < deepestLevel; level++) {
    const part = parts[level] ?? -1;
    const laterPart = laterParts[level] ?? -1;
    if (part !== laterPart) return part < laterPart;
  }
  return false;
};

const listNumberingSeeds = (
  previousShotNumber: string | undefined,
  precedingShotCount: number
): number[][] => {
  if (previousShotNumber === undefined) return [[precedingShotCount]];
  const previousParts = toNumberParts(previousShotNumber);
  if (previousParts.length === 1) return [[...previousParts, 0]];
  return [previousParts, [...previousParts, 0]];
};

export const suggestShotHeading = (
  shots: ShotHeading[],
  insertIndex: number | null
): string => {
  if (shots.length === 0) return "1 ";

  const isBeforeInsertPoint = (shot: ShotHeading) =>
    insertIndex === null || shot.shot_index < insertIndex;
  const shotsInOrder = [...shots].sort(
    (left, right) => left.shot_index - right.shot_index
  );
  const precedingShots = shotsInOrder.filter(isBeforeInsertPoint);
  const followingShotNumber = shotsInOrder
    .filter((shot) => !isBeforeInsertPoint(shot))
    .map((shot) => parseShotHeadingNumber(shot.heading))
    .find((shotNumber) => shotNumber !== undefined);
  const usedShotNumbers = new Set(
    shots.map((shot) => parseShotHeadingNumber(shot.heading))
  );

  const previousShot = precedingShots.at(-1);
  const previousShotNumber = previousShot
    ? parseShotHeadingNumber(previousShot.heading)
    : NUMBER_BEFORE_THE_FIRST_SHOT;

  for (const seed of listNumberingSeeds(
    previousShotNumber,
    precedingShots.length
  )) {
    const parts = [...seed];
    for (;;) {
      parts[parts.length - 1] = (parts.at(-1) ?? 0) + 1;
      const candidate = parts.join(".");
      const keepsShotOrder =
        followingShotNumber === undefined ||
        sortsBefore(candidate, followingShotNumber);
      if (!keepsShotOrder) break;
      if (!usedShotNumbers.has(candidate)) return `${candidate} `;
    }
  }
  return NO_SUGGESTION;
};
