import { Project } from "@schemas/project";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi, isLocalApp } from "@/platform/localDesktop";

import { buildLocalScriptRenderStats } from "../utils/localScriptRenderStats";

export interface RenderStats {
  name: string;
  cost: number;
  success: boolean;
  number_of_frames: number;
  resolution: string;
  fps: number;
  control_type: string;
  model: string;
  seed: number;
  created_at: string;
  finished_at: string;
  render_started_at: string;
  queue_wait_time: number;
  queue_wait_time_in_minutes: string;
  render_time_in_minutes: string;
  render_time_in_seconds: number;
  render_time_per_frame: number;
  video_duration_in_seconds: number;
}

interface ProjectStatsTotal {
  total_amount_of_renders: number;
  total_amount_of_successful_renders: number;
  success_rate: number;
  average_cost_per_frame: string;
  average_cost_per_second: string;
  average_render_time_per_frame: string;
  earliest_render_date: string;
  latest_render_date: string;
  models_used: string[];
  most_used_model: string;
  total_cost: number;
  total_frames_rendered: number;
  total_queue_wait_time: string;
  total_queue_wait_time_in_minutes: string;
  total_render_time_in_seconds: number;
  total_successful_render_time_in_seconds: number;
  total_time_rendered: string;
}

export interface ProjectStatsResponse {
  total: ProjectStatsTotal;
  [key: string]: RenderStats | ProjectStatsTotal;
}

export const fetchProjectStats = async (
  projectId: Project["id"] | undefined,
  origin?: Project["origin"]
): Promise<ProjectStatsResponse | undefined> => {
  if (!projectId) {
    return undefined;
  }

  if (isLocalApp && origin !== "cloud") {
    const desktop = getLocalDesktopApi();
    const [projectStats, snapshot] = await Promise.all([
      desktop.projects
        .stats(projectId)
        .then((value) => value as unknown as ProjectStatsResponse),
      desktop.scriptProjects?.get(projectId) ?? Promise.resolve(null)
    ]);
    return {
      ...projectStats,
      ...buildLocalScriptRenderStats(snapshot)
    };
  }

  const response = await backendApiClient.get<ProjectStatsResponse>(
    `/projects/stats/${projectId}`
  );

  return response.data;
};
