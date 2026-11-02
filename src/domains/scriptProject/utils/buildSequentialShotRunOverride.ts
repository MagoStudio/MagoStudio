import { SequentialShotConfig, ShotState } from "@schemas/scriptProject";

type RunSequentialOverride = {
  default?: SequentialShotConfig;
  shots?: Record<string, Partial<SequentialShotConfig>>;
};

export const buildSequentialShotRunOverride = ({
  shots,
  isSequentialSuspendedForRun
}: {
  shots: ShotState[];
  isSequentialSuspendedForRun: boolean;
}): RunSequentialOverride | undefined => {
  if (!isSequentialSuspendedForRun) return undefined;

  const suspendedShots = shots.filter((shot) => shot.sequential?.enabled);
  if (suspendedShots.length === 0) return undefined;

  return {
    shots: Object.fromEntries(
      suspendedShots.map((shot) => [shot.timeline_id, { enabled: false }])
    )
  };
};
