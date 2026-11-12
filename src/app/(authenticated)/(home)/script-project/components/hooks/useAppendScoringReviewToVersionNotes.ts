/* oxlint-disable custom-react/no-use-effect -- legitimate external sync: a version's scoring result lands from the metrics query, not from a user event, and its issues and suggestion are written once into the review notes kept in localStorage */
import { useRenderMetrics } from "@domains/scriptProject/useRenderMetrics";
import { isLocalApp } from "@platform/localDesktop";
import { isCloudRenderAvailable } from "@platform/renderTarget";
import { useEffect } from "react";

export const useAppendScoringReviewToVersionNotes = ({
  assetId,
  hasRenderFinished,
  appendScoringReview
}: {
  assetId: string;
  hasRenderFinished: boolean;
  appendScoringReview: (
    assetId: string,
    issues: string[],
    nextPrompt: string | null
  ) => void;
}) => {
  const { data: metrics } = useRenderMetrics(
    assetId,
    "video",
    hasRenderFinished && (isLocalApp || isCloudRenderAvailable())
  );
  const scoringIssues = metrics?.issues;
  const suggestedNextPrompt = metrics?.nextPrompt ?? null;

  /* oxlint-disable react-you-might-not-need-an-effect/no-event-handler, react-you-might-not-need-an-effect/no-pass-data-to-parent -- the scoring result arrives from a query, not from a user event the dialog could own, and the callback writes to localStorage rather than lifting state to a parent */
  useEffect(() => {
    if (!scoringIssues?.length) return;
    appendScoringReview(assetId, scoringIssues, suggestedNextPrompt);
  }, [assetId, scoringIssues, suggestedNextPrompt, appendScoringReview]);
  /* oxlint-enable react-you-might-not-need-an-effect/no-event-handler, react-you-might-not-need-an-effect/no-pass-data-to-parent */
};
