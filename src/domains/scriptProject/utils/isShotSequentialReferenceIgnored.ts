import { ShotGenerateResult, ShotState } from "@schemas/scriptProject";

export const isShotSequentialReferenceIgnored = (
  dryRun: ShotGenerateResult | undefined,
  shot: ShotState
): boolean =>
  (dryRun?.sequential_ignored ?? []).some(
    (entry) => entry.timeline_id === shot.timeline_id
  );
