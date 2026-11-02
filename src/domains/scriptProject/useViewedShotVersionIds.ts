import { useShotVersionReview } from "./useShotVersionReview";

export const useViewedShotVersionIds = (projectId: string) => {
  const { viewedVersionIds, markVersionsViewed } =
    useShotVersionReview(projectId);
  return { viewedVersionIds, markVersionsViewed };
};
