import {
  SequentialShotConfig,
  ShotGenerateResult,
  ShotGenerateResultSchema
} from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi } from "@/platform/localDesktop";

import { resolveMiniMaxH3StepLoraSteps } from "../../../../desktop/shared/minimaxH3StepLoras";
import {
  DEFAULT_LOCAL_H3_MODEL,
  DEFAULT_LOCAL_H3_TEXT_ENCODER,
  LOCAL_H3_MODEL_OPTIONS,
  LOCAL_H3_TEXT_ENCODER_OPTIONS,
  LocalH3Model,
  LocalH3Steps,
  LocalH3TextEncoder,
  SCRIPT_PROJECT_RENDER_MODE
} from "../constants";
import { isLocalScriptProject } from "../projectOrigin";

export type GenerateProjectShotsRequest = {
  projectId: string;
  isDryRun: boolean;
  outputSize?: [number, number];
  videoSettings?: Record<string, unknown>;
  sequenceIds?: number[];
  timelineIds?: string[];
  sequential?: {
    default?: SequentialShotConfig;
    shots?: Record<string, Partial<SequentialShotConfig>>;
  };
};

export const postGenerateProjectShots = async (
  request: GenerateProjectShotsRequest
): Promise<ShotGenerateResult> => {
  if (await isLocalScriptProject(request.projectId)) {
    const localH3Steps: LocalH3Steps = resolveMiniMaxH3StepLoraSteps(
      request.videoSettings?.local_h3_steps
    );
    const useLegacyH3Workflow =
      request.videoSettings?.local_h3_legacy_workflow === true;
    const requestedTextEncoder = request.videoSettings?.local_h3_text_encoder;
    const localH3TextEncoder: LocalH3TextEncoder =
      LOCAL_H3_TEXT_ENCODER_OPTIONS.includes(
        requestedTextEncoder as LocalH3TextEncoder
      )
        ? (requestedTextEncoder as LocalH3TextEncoder)
        : DEFAULT_LOCAL_H3_TEXT_ENCODER;
    const requestedModel = request.videoSettings?.local_h3_model;
    const localH3Model: LocalH3Model = LOCAL_H3_MODEL_OPTIONS.includes(
      requestedModel as LocalH3Model
    )
      ? (requestedModel as LocalH3Model)
      : DEFAULT_LOCAL_H3_MODEL;
    return ShotGenerateResultSchema.parse(
      await getLocalDesktopApi().scriptProjects.generateShots({
        ...request,
        videoSettings: {
          ...request.videoSettings,
          local_h3_steps: localH3Steps,
          local_h3_legacy_workflow: useLegacyH3Workflow,
          local_h3_text_encoder: localH3TextEncoder,
          local_h3_model: localH3Model
        }
      })
    );
  }
  const response = await backendApiClient.post(
    `/projects/${request.projectId}/shots/generate`,
    {
      ...(request.outputSize ? { output_size: request.outputSize } : {}),
      video_settings: {
        ...request.videoSettings,
        render_mode: SCRIPT_PROJECT_RENDER_MODE
      },
      ...(request.sequenceIds ? { sequence_ids: request.sequenceIds } : {}),
      ...(request.timelineIds ? { timeline_ids: request.timelineIds } : {}),
      ...(request.sequential ? { sequential: request.sequential } : {}),
      dry_run: request.isDryRun
    }
  );
  return ShotGenerateResultSchema.parse(response.data);
};
