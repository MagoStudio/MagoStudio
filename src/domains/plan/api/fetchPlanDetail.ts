import { Plan } from "@schemas/plan";

import { backendApiClient } from "@/lib/backend-api-client";

export interface FailedShot {
  timeline_id: string;
  timeline_name?: string;
  has_video: boolean;
  img_evaluated: boolean;
  img_passed: boolean;
  img_attempts?: number;
  img_final_score: number | null;
  img_weakest_dim: string | null;
  img_issues: string[];
  vid_evaluated: boolean;
  vid_passed: boolean;
  vid_attempts?: number;
  vid_final_score: number | null;
  vid_weakest_dim: string | null;
  vid_issues: string[];
}

// A shot flagged "needs attention". `reasons` are stable codes the FE maps to
// labels (img_all_failed | vid_never_passed | vid_not_evaluated |
// borderline_pass | max_retries_used | not_evaluated). `media_axis` says which
// media was scored.
interface AttentionEntry {
  timeline_id: string;
  timeline_name?: string;
  reasons: string[];
  media_axis: "img+vid" | "vid" | "img" | "none";
  img_score?: number;
  vid_score?: number;
}

interface AgentPlanSummary {
  // Plan-wide quality totals (present once the plan is terminal). `is_final` is
  // false for running plans / plans completed before the feature shipped, in
  // which case the totals below are absent.
  is_final?: boolean;
  total_amount_of_runs?: number;
  // Rate denominator: shots gated on >=1 axis (excludes skip_metrics +
  // provided-frame). Pair this with total_amount_of_quality_passed_runs /
  // quality_success_rate — never total_amount_of_runs (see BE integration doc).
  total_amount_of_evaluated_runs?: number;
  total_amount_of_quality_passed_runs?: number;
  quality_success_rate?: number;
  img_passed?: number;
  img_failed?: number;
  img_not_evaluated?: number;
  vid_passed?: number;
  vid_failed?: number;
  vid_not_evaluated?: number;
  average_img_score?: number | null;
  average_vid_score?: number | null;
  attention?: AttentionEntry[];
  failed_shots?: FailedShot[];
}

// GET /agent/plans/<id> embeds the plan's persisted quality-summary
// blob as `summary` — the same full shape the standalone /summary endpoint
// returns, `null`/absent until the plan is terminal — so consumers of plan
// detail don't need a second request for it.
export type PlanDetail = Plan & { summary?: AgentPlanSummary | null };

export const fetchPlanDetail = async (planId: string): Promise<PlanDetail> => {
  const response = await backendApiClient.get<PlanDetail>(
    `/agent/plans/${planId}`
  );
  return response.data;
};
