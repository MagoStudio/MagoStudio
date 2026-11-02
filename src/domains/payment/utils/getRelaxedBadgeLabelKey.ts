import { RelaxedModeType } from "@schemas/balance";

export const getRelaxedBadgeLabelKey = (
  relaxedModeType: RelaxedModeType | null | undefined
): "titles.relaxed_mode.label" | null =>
  relaxedModeType === RelaxedModeType.RELAXED
    ? "titles.relaxed_mode.label"
    : null;
