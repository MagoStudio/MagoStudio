import { CutExportRefusal } from "@schemas/scriptProject";

export type CutExportRefusalDescription = {
  labelKey: string;
  shotNumbers: number[];
};

/** Which shots to name for a mixed-profile refusal: the smaller group.
 *
 * "Shots 2 and 3 aren't upscaled yet" is actionable; naming all of them is not, and the odd
 * ones out are the ones the user has to do something about. */
const withoutHandAddedShots = (sequenceIds: (number | null)[]): number[] =>
  sequenceIds.filter((sequenceId) => sequenceId !== null);

const pickSmallestProfileGroup = (refusal: CutExportRefusal): number[] => {
  const groups = refusal.profiles
    .map((profile) => withoutHandAddedShots(profile.sequence_ids))
    .filter((sequenceIds) => sequenceIds.length > 0);

  if (groups.length === 0) return withoutHandAddedShots(refusal.sequence_ids);

  return groups.reduce((smallest, group) =>
    group.length < smallest.length ? group : smallest
  );
};

const LABEL_KEY_BY_REASON: Record<string, string> = {
  mixed_video_profile: "script_project.export_refused_mixed_profile.label",
  missing_pinned_video: "script_project.export_refused_missing_pin.label",
  unknown_video_profile: "script_project.export_refused_unknown_profile.label"
};

/** The one refusal worth telling the user about, or null when the cut can be exported.
 *
 * Only the first is described: the fallback runs either way, so this is an explanation rather
 * than a task list, and three stacked toasts explain less than one. */
export const describeCutExportRefusal = (
  refused: CutExportRefusal[] | undefined
): CutExportRefusalDescription | null => {
  const [refusal] = refused ?? [];
  if (!refusal) return null;

  const shotNumbers =
    refusal.reason === "mixed_video_profile"
      ? pickSmallestProfileGroup(refusal)
      : withoutHandAddedShots(refusal.sequence_ids);

  return {
    labelKey:
      LABEL_KEY_BY_REASON[refusal.reason] ??
      "script_project.export_refused_unknown_reason.label",
    shotNumbers: [...shotNumbers].sort((left, right) => left - right)
  };
};
