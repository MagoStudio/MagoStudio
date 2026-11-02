import { MINIMUM_SCENE_SHOT_DURATION_SECONDS } from "../constants";

import { formatSceneShotSeconds } from "./formatSceneShotSeconds";
import { parseSceneShotDraftSeconds } from "./parseSceneShotDraftSeconds";

export const applyMinimumSceneShotDuration = (
  durationSeconds: string
): string => {
  const seconds = parseSceneShotDraftSeconds(durationSeconds);
  const isBelowMinimum =
    seconds === undefined || seconds < MINIMUM_SCENE_SHOT_DURATION_SECONDS;
  return isBelowMinimum
    ? formatSceneShotSeconds(MINIMUM_SCENE_SHOT_DURATION_SECONDS)
    : durationSeconds;
};
