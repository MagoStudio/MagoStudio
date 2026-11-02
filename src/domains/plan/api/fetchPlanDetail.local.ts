import { Plan } from "@schemas/plan";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi } from "@/platform/localDesktop";

import { findPlanReadableFromDesktop } from "./findPlanReadableFromDesktop";

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

interface AttentionEntry {
  timeline_id: string;
  timeline_name?: string;
  reasons: string[];
  media_axis: "img+vid" | "vid" | "img" | "none";
  img_score?: number;
  vid_score?: number;
}

interface AgentPlanSummary {
  is_final?: boolean;
  total_amount_of_runs?: number;
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

export type PlanDetail = Plan & { summary?: AgentPlanSummary | null };

export const fetchPlanDetail = async (planId: string): Promise<PlanDetail> => {
  const desktopPlan = await findPlanReadableFromDesktop(planId);
  if (desktopPlan) return desktopPlan as PlanDetail;

  if (getLocalDesktopApi().account.mode === "cloud") {
    const response = await backendApiClient.get<PlanDetail>(
      `/agent/plans/${planId}`
    );
    return response.data;
  }

  throw new Error("This script version has not been mirrored yet");
};
