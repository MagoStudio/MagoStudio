import { ShotImageAssignment } from "./matchShotImagesToFilenames";

export const getShotImageAssignmentStatusLabelKey = (
  status: ShotImageAssignment["status"]
): string => {
  if (status === "matched") return "plan.shot_images.status_matched.label";
  if (status === "needs_review")
    return "plan.shot_images.status_needs_review.label";
  return "plan.shot_images.status_unmatched.label";
};

export const getShotImageAssignmentStatusColor = (
  status: ShotImageAssignment["status"]
) => {
  if (status === "matched") return "glyph-success" as const;
  if (status === "needs_review") return "glyph-warning" as const;
  return "glyph-tertiary" as const;
};
