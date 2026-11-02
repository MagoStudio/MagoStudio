import {
  SequentialShotConfig,
  ShotGenerateResult,
  ShotGenerateResultSchema
} from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";

import { SCRIPT_PROJECT_RENDER_MODE } from "../constants";

export type GenerateProjectShotsRequest = {
  projectId: string;
  isDryRun: boolean;
  outputSize?: [number, number];
  videoSettings?: Record<string, unknown>;
  /** Restrict the run to these shots. Omit for every stale shot. */
  sequenceIds?: number[];
  /** The same filter, by timeline id — the only way to target one shot of an atomic cast,
   * where every beat of a scene shares that scene's sequence id. */
  timelineIds?: string[];
  /** Overrides for this run only. Precedence, lowest first: `default`, the shot's persisted
   * preference, then this run's entry for that shot. */
  sequential?: {
    default?: SequentialShotConfig;
    shots?: Record<string, Partial<SequentialShotConfig>>;
  };
};

export const postGenerateProjectShots = async ({
  projectId,
  isDryRun,
  outputSize,
  videoSettings,
  sequenceIds,
  timelineIds,
  sequential
}: GenerateProjectShotsRequest): Promise<ShotGenerateResult> => {
  const response = await backendApiClient.post(
    `/projects/${projectId}/shots/generate`,
    {
      ...(outputSize ? { output_size: outputSize } : {}),
      video_settings: {
        ...videoSettings,
        render_mode: SCRIPT_PROJECT_RENDER_MODE
      },
      ...(sequenceIds ? { sequence_ids: sequenceIds } : {}),
      ...(timelineIds ? { timeline_ids: timelineIds } : {}),
      ...(sequential ? { sequential } : {}),
      dry_run: isDryRun
    }
  );
  return ShotGenerateResultSchema.parse(response.data);
};
