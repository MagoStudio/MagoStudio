import { UpscaleResult, UpscaleResultSchema } from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";

import { SCRIPT_PROJECT_RENDER_MODE } from "../constants";

export type UpscaleProjectShotsRequest = {
  projectId: string;
  isDryRun: boolean;
  videoSettings?: Record<string, unknown>;
  /** Restrict the run to these shots. Omit for every eligible shot. */
  sequenceIds?: number[];
  /** The same filter, by timeline id — the only way to target one beat of an atomic cast,
   * where every beat of a scene shares that scene's sequence id. */
  timelineIds?: string[];
};

export const postUpscaleProjectShots = async ({
  projectId,
  isDryRun,
  videoSettings,
  sequenceIds,
  timelineIds
}: UpscaleProjectShotsRequest): Promise<UpscaleResult> => {
  const response = await backendApiClient.post(
    `/projects/${projectId}/shots/upscale`,
    {
      video_settings: {
        ...videoSettings,
        render_mode: SCRIPT_PROJECT_RENDER_MODE
      },
      ...(sequenceIds ? { sequence_ids: sequenceIds } : {}),
      ...(timelineIds ? { timeline_ids: timelineIds } : {}),
      dry_run: isDryRun
    }
  );
  return UpscaleResultSchema.parse(response.data);
};
