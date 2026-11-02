import { SceneStoryboardSubmittedSchema } from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi } from "@/platform/localDesktop";

import {
  canUseCloudSheetModels,
  executeCloudSheetPlan
} from "../cloudSheetRender.local";
import { isLocalScriptProject } from "../projectOrigin";
import { installedLocalImageModels } from "../utils/installedLocalImageModels";
import { isSheetRenderModel } from "../utils/isSheetRenderModel";
import { resolveImageRenderModel } from "../utils/resolveImageRenderModel";

import { buildSceneStoryboardPath } from "./sceneStoryboardPath";

export type GenerateSceneStoryboardRequest = {
  projectId: string;
  sceneTimelineId: string;
  renderModel?: string;
};
export const postSceneStoryboardGenerate = async (
  request: GenerateSceneStoryboardRequest
) => {
  if (!(await isLocalScriptProject(request.projectId)))
    return SceneStoryboardSubmittedSchema.parse(
      (
        await backendApiClient.post(
          `${buildSceneStoryboardPath(request)}/generate`
        )
      ).data
    );
  const project = await getLocalDesktopApi().projects.get(request.projectId);
  if (isSheetRenderModel(request.renderModel) && !canUseCloudSheetModels())
    throw new Error("Sign in to Mago Cloud to use this image model");
  const setup =
    !request.renderModel &&
    !canUseCloudSheetModels() &&
    getLocalDesktopApi().comfy?.scriptSetupStatus
      ? await getLocalDesktopApi().comfy.scriptSetupStatus()
      : undefined;
  const renderModel = resolveImageRenderModel({
    savedModel:
      request.renderModel ??
      (project?.settings as Record<string, unknown> | undefined)
        ?.storyboard_render_model,
    isLocalProject: true,
    isCloudAvailable: canUseCloudSheetModels(),
    installedLocalModels: installedLocalImageModels(setup)
  });
  const result = await getLocalDesktopApi().scriptProjects.update({
    projectId: request.projectId,
    operation: "storyboard-generate",
    payload: { timelineId: request.sceneTimelineId, renderModel }
  });
  if (isSheetRenderModel(renderModel) && typeof result.plan_id === "string")
    void executeCloudSheetPlan(result.plan_id);
  return SceneStoryboardSubmittedSchema.parse(result);
};
