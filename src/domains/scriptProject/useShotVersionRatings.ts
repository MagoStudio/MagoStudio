import { useShotVersionReview } from "./useShotVersionReview";

export type ShotVersionRating = -1 | 0 | 1;
export const useShotVersionRatings = (projectId: string) => {
  const { ratingsByAssetId, setVersionRating } =
    useShotVersionReview(projectId);
  return { ratingsByAssetId, setVersionRating };
};
