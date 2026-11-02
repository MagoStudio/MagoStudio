import { CutShot } from "@schemas/scriptProject";

export const FAILED_RENDER_STATUSES = new Set(["error", "cancelled"]);

export const hasShotRenderFailed = (cutShot: CutShot | undefined): boolean => {
  const versions = cutShot?.versions ?? [];
  if (versions.length === 0) return false;

  const hasUsableVersion = versions.some((version) => version.ready);
  if (hasUsableVersion) return false;

  return versions.some((version) =>
    FAILED_RENDER_STATUSES.has(version.status.toLowerCase())
  );
};

export const countShotsWithFailedRenders = (cutShots: CutShot[]): number =>
  cutShots.filter((cutShot) => hasShotRenderFailed(cutShot)).length;
