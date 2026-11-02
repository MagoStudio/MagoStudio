import {
  UPLOAD_PROGRESS_COMPLETE,
  UPLOAD_PROGRESS_PART_IN_TOTAL_LOADING
} from "../constants";

export const getTransferProgress = (transferPercent: number): number => {
  const clampedPercent = Math.min(
    UPLOAD_PROGRESS_COMPLETE,
    Math.max(0, transferPercent)
  );

  return Math.round(
    (clampedPercent / UPLOAD_PROGRESS_COMPLETE) *
      UPLOAD_PROGRESS_PART_IN_TOTAL_LOADING
  );
};
