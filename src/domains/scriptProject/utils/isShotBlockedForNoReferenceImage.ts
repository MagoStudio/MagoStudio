import { ShotGenerateResult, ShotState } from "@schemas/scriptProject";

export const isShotBlockedForNoReferenceImage = (
  dryRun: ShotGenerateResult | undefined,
  shot: ShotState
): boolean =>
  (dryRun?.blocked ?? []).some(
    (entry) =>
      entry.timeline_id === shot.timeline_id &&
      entry.reason_code === "no_reference_image"
  );
