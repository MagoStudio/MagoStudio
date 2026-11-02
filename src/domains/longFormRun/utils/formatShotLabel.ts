import { LONG_FORM_SHOT_LABEL_PREFIX } from "../constants";

const ZERO_PAD_WIDTH = 2;

export const formatShotLabel = (index: number): string =>
  `${LONG_FORM_SHOT_LABEL_PREFIX}_${String(index).padStart(ZERO_PAD_WIDTH, "0")}`;
