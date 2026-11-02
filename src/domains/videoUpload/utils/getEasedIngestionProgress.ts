import {
  EASE_OUT_CUBIC_POWER,
  INGESTION_TARGET_PROGRESS,
  PROGRESS_ANIMATION_DURATION,
  UPLOAD_PROGRESS_PART_IN_TOTAL_LOADING
} from "../constants";

export const getEasedIngestionProgress = (elapsedMs: number): number => {
  const normalizedTime = Math.min(
    1,
    Math.max(0, elapsedMs) / PROGRESS_ANIMATION_DURATION
  );
  const easedFraction = 1 - Math.pow(1 - normalizedTime, EASE_OUT_CUBIC_POWER);
  const progressRange =
    INGESTION_TARGET_PROGRESS - UPLOAD_PROGRESS_PART_IN_TOTAL_LOADING;

  return UPLOAD_PROGRESS_PART_IN_TOTAL_LOADING + progressRange * easedFraction;
};
