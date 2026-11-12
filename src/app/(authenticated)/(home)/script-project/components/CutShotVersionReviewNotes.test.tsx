import { RenderMetrics } from "@domains/scriptProject/utils/renderMetricsTypes";
import { t } from "@tests/utils/i18n";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { CutShotVersionReviewNotes } from "./CutShotVersionReviewNotes";

const scoredMetrics: RenderMetrics = {
  status: "COMPLETED",
  evalMode: "video",
  score: 5.5,
  hasEvaluatorPassed: false,
  scoreByAxis: {},
  issues: ["Mara's coat changes colour", "The door opens twice"],
  nextPrompt: "Keep the coat grey and open the door once.",
  evaluationError: null
};

const mocks = vi.hoisted(() => ({
  metrics: undefined as RenderMetrics | undefined
}));

vi.mock("@domains/scriptProject/useRenderMetrics", () => ({
  useRenderMetrics: () => ({ data: mocks.metrics })
}));

const renderNotes = (appendScoringReview = vi.fn()) =>
  renderWithProviders(
    <CutShotVersionReviewNotes
      assetId="version-2"
      hasRenderFinished
      comments={{ good: "", bad: "", todo: "" }}
      onChangeComment={vi.fn()}
      appendScoringReview={appendScoringReview}
    />
  );

describe("CutShotVersionReviewNotes", () => {
  it("shows the problems and next-changes notes, not a what-works note", () => {
    mocks.metrics = undefined;
    const screen = renderNotes();

    expect(
      screen.getByText(t("script_project.version_review_bad.label"))
    ).toBeVisible();
    expect(
      screen.getByText(t("script_project.version_review_todo.label"))
    ).toBeVisible();
    expect(screen.getAllByRole("textbox")).toHaveLength(2);
  });

  it("writes the scoring issues and suggestion into the notes once scored", () => {
    mocks.metrics = scoredMetrics;
    const appendScoringReview = vi.fn();
    renderNotes(appendScoringReview);

    expect(appendScoringReview).toHaveBeenCalledWith(
      "version-2",
      scoredMetrics.issues,
      scoredMetrics.nextPrompt
    );
  });

  it("writes nothing while the version has no scoring issues", () => {
    mocks.metrics = { ...scoredMetrics, issues: [] };
    const appendScoringReview = vi.fn();
    renderNotes(appendScoringReview);

    expect(appendScoringReview).not.toHaveBeenCalled();
  });
});
