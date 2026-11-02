import { describe, expect, it } from "vitest";

import { FailedShot } from "../api/fetchPlanDetail";

import { buildAttentionShotDetail } from "./buildAttentionShotDetail";

function failedShot(overrides: Partial<FailedShot> = {}): FailedShot {
  return {
    timeline_id: "shot-1",
    has_video: false,
    img_evaluated: false,
    img_passed: true,
    img_final_score: null,
    img_weakest_dim: null,
    img_issues: [],
    vid_evaluated: false,
    vid_passed: true,
    vid_final_score: null,
    vid_weakest_dim: null,
    vid_issues: [],
    ...overrides
  };
}

describe("buildAttentionShotDetail", () => {
  it("returns empty detail when no failed shot is found", () => {
    expect(buildAttentionShotDetail(undefined)).toEqual({
      weakestDims: [],
      issues: []
    });
  });

  it("surfaces the img weakest dim when the img axis failed", () => {
    const detail = buildAttentionShotDetail(
      failedShot({
        img_evaluated: true,
        img_passed: false,
        img_weakest_dim: "identity"
      })
    );
    expect(detail.weakestDims).toEqual(["identity"]);
  });

  it("does not surface a passing video's weakest dim for an img-only failure", () => {
    // Regression case: img failed with no specific dim pinpointed, but the
    // (passing) video axis still has its own weakest_dim recorded. The video's
    // dim must not be misattributed to the img failure.
    const detail = buildAttentionShotDetail(
      failedShot({
        has_video: true,
        img_evaluated: true,
        img_passed: false,
        img_weakest_dim: null,
        vid_evaluated: true,
        vid_passed: true,
        vid_weakest_dim: "vid_lighting"
      })
    );
    expect(detail.weakestDims).toEqual([]);
  });

  it("surfaces the vid weakest dim only when the shot has video and the vid axis failed", () => {
    const detail = buildAttentionShotDetail(
      failedShot({
        has_video: true,
        vid_evaluated: true,
        vid_passed: false,
        vid_weakest_dim: "vid_temporal_identity"
      })
    );
    expect(detail.weakestDims).toEqual(["vid_temporal_identity"]);
  });

  it("surfaces both axes' weakest dims when both failed", () => {
    const detail = buildAttentionShotDetail(
      failedShot({
        has_video: true,
        img_evaluated: true,
        img_passed: false,
        img_weakest_dim: "identity",
        vid_evaluated: true,
        vid_passed: false,
        vid_weakest_dim: "vid_temporal_identity"
      })
    );
    expect(detail.weakestDims).toEqual(["identity", "vid_temporal_identity"]);
  });

  it("merges img and vid issues", () => {
    const detail = buildAttentionShotDetail(
      failedShot({
        img_issues: ["face identity not preserved"],
        vid_issues: ["motion too jittery"]
      })
    );
    expect(detail.issues).toEqual([
      "face identity not preserved",
      "motion too jittery"
    ]);
  });
});
