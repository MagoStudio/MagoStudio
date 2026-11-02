import { FailedShot } from "../api/fetchPlanDetail";

export interface AttentionShotDetail {
  weakestDims: string[];
  issues: string[];
}

const EMPTY_DETAIL: AttentionShotDetail = { weakestDims: [], issues: [] };

// img/vid_weakest_dim can each be populated whenever that axis was scored,
// regardless of whether it passed — so this only surfaces a dim from an axis
// that actually failed, otherwise a passing video's weakest dim can get
// silently attributed to an image failure.
export const buildAttentionShotDetail = (
  failedShot: FailedShot | undefined
): AttentionShotDetail => {
  if (!failedShot) {
    return EMPTY_DETAIL;
  }

  const isImgAxisFailed = failedShot.img_evaluated && !failedShot.img_passed;
  const isVidAxisFailed =
    failedShot.has_video && failedShot.vid_evaluated && !failedShot.vid_passed;

  const weakestDims = [
    isImgAxisFailed ? failedShot.img_weakest_dim : null,
    isVidAxisFailed ? failedShot.vid_weakest_dim : null
  ].filter((dim): dim is string => !!dim);

  const issues = [...failedShot.img_issues, ...failedShot.vid_issues];

  return { weakestDims, issues };
};
