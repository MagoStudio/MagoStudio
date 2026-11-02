import { SceneShotDraft } from "./buildEmptySceneShotDraft";
import { hasSceneShotDraftContent } from "./hasSceneShotDraftContent";
import { parseSceneShotDraftSeconds } from "./parseSceneShotDraftSeconds";
import { roundSceneShotSeconds } from "./roundSceneShotSeconds";

export const sumSceneShotDurationSeconds = (
  shots: SceneShotDraft[]
): number | undefined => {
  const shotDurationsSeconds = shots
    .filter(hasSceneShotDraftContent)
    .map((shot) => parseSceneShotDraftSeconds(shot.durationSeconds));
  const isEveryShotTimed =
    shotDurationsSeconds.length > 0 &&
    shotDurationsSeconds.every((seconds) => seconds !== undefined);
  if (!isEveryShotTimed) return undefined;
  const totalSeconds = shotDurationsSeconds.reduce<number>(
    (sum, seconds) => sum + (seconds ?? 0),
    0
  );
  return roundSceneShotSeconds(totalSeconds);
};
