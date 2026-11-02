import { UpscaleResult, UpscaleResultSchema } from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";

import { SCRIPT_PROJECT_RENDER_MODE } from "../constants";
import { isLocalScriptProject } from "../projectOrigin";

export type UpscaleProjectShotsRequest = {
  projectId: string;
  isDryRun: boolean;
  videoSettings?: Record<string, unknown>;
  sequenceIds?: number[];
  timelineIds?: string[];
};

export const postUpscaleProjectShots = async (
  request: UpscaleProjectShotsRequest
): Promise<UpscaleResult> => {
  if (await isLocalScriptProject(request.projectId)) {
    return UpscaleResultSchema.parse({
      would_run: [],
      would_run_keys: [],
      would_run_timeline_ids: [],
      skipped: [],
      blocked: [],
      plan_id: null
    });
  }
  const response = await backendApiClient.post(
    `/projects/${request.projectId}/shots/upscale`,
    {
      video_settings: {
        ...request.videoSettings,
        render_mode: SCRIPT_PROJECT_RENDER_MODE
      },
      ...(request.sequenceIds ? { sequence_ids: request.sequenceIds } : {}),
      ...(request.timelineIds ? { timeline_ids: request.timelineIds } : {}),
      dry_run: request.isDryRun
    }
  );
  return UpscaleResultSchema.parse(response.data);
};
