import {
  SheetGenerateResult,
  SheetGenerateResultSchema
} from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi } from "@/platform/localDesktop";

import {
  canUseCloudSheetModels,
  executeCloudSheetPlan
} from "../cloudSheetRender.local";
import {
  resolveLocalSheetRenderModel,
  SCRIPT_PROJECT_RENDER_MODE
} from "../constants";
import { isLocalScriptProject } from "../projectOrigin";
import { isSheetRenderModel } from "../utils/isSheetRenderModel";

export type GenerateProjectSheetsRequest = {
  projectId: string;
  isDryRun: boolean;
  outputSize?: [number, number];
  settings?: Record<string, unknown>;
  tokens?: string[];
  shouldScoreImages?: boolean;
};

export const postGenerateProjectSheets = async (
  request: GenerateProjectSheetsRequest
): Promise<SheetGenerateResult> => {
  if (await isLocalScriptProject(request.projectId)) {
    // A local project renders on an explicitly supported Comfy workflow, or
    // on a Mago Cloud model while signed in, which this renderer then runs.
    // Build a narrow desktop request so cloud-only scoring can never leak
    // into a local plan, even if a stale renderer sends it.
    const isCloudModel =
      isSheetRenderModel(request.settings?.render_model) &&
      canUseCloudSheetModels();
    const localRequest = {
      projectId: request.projectId,
      isDryRun: request.isDryRun,
      ...(request.outputSize ? { outputSize: request.outputSize } : {}),
      settings: {
        ...request.settings,
        render_model: isCloudModel
          ? request.settings?.render_model
          : resolveLocalSheetRenderModel(request.settings?.render_model)
      },
      ...(request.tokens ? { tokens: request.tokens } : {})
    };
    const result = SheetGenerateResultSchema.parse(
      await getLocalDesktopApi().scriptProjects.generateSheets(localRequest)
    );
    if (isCloudModel && !request.isDryRun && result.plan_id)
      void executeCloudSheetPlan(result.plan_id);
    return result;
  }
  const response = await backendApiClient.post(
    `/projects/${request.projectId}/sheets/generate`,
    {
      ...(request.outputSize ? { output_size: request.outputSize } : {}),
      settings: {
        ...request.settings,
        render_mode: SCRIPT_PROJECT_RENDER_MODE
      },
      ...(request.tokens ? { tokens: request.tokens } : {}),
      ...(request.shouldScoreImages ? { metrics: true } : {}),
      dry_run: request.isDryRun
    }
  );
  return SheetGenerateResultSchema.parse(response.data);
};
