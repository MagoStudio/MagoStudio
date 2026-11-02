import { CutShot } from "@schemas/scriptProject";

import { parseShotHeadingNumber } from "./parseShotHeadingNumber";

const SHOT_INDEX_PAD_LENGTH = 2;
const MAX_LABEL_LENGTH = 60;

const toFileSafe = (value: string): string =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9.]+/g, "_")
    .replace(/\.{2,}/g, ".")
    .slice(0, MAX_LABEL_LENGTH)
    .replace(/^[._]+|[._]+$/g, "");

export const buildCutDownloadName = (cutShot: CutShot): string => {
  const label =
    toFileSafe(cutShot.heading ?? "") ||
    toFileSafe(cutShot.version_name ?? "") ||
    `shot_${cutShot.sequence_id}`;

  const isShotNumberedInHeading =
    parseShotHeadingNumber(cutShot.heading) !== undefined;
  if (isShotNumberedInHeading) return `${label}.mp4`;

  const order = String(cutShot.shot_index + 1).padStart(
    SHOT_INDEX_PAD_LENGTH,
    "0"
  );
  return `${order}_${label}.mp4`;
};
