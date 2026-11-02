import { parseShotHeadingNumber } from "./parseShotHeadingNumber";

export const fillMissingShotName = (
  heading: string,
  defaultShotName: string
): string => {
  const trimmedHeading = heading.trim();
  const shotNumber = parseShotHeadingNumber(trimmedHeading);
  const isHeadingOnlyAShotNumber = trimmedHeading === shotNumber;
  if (trimmedHeading.length > 0 && !isHeadingOnlyAShotNumber) {
    return trimmedHeading;
  }
  return shotNumber ? `${shotNumber} ${defaultShotName}` : defaultShotName;
};
