import { SceneStoryboardSubmittedSchema } from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";

import { buildSceneStoryboardPath } from "./sceneStoryboardPath";

export type GenerateSceneStoryboardRequest = {
  projectId: string;
  sceneTimelineId: string;
  renderModel?: string;
};

export const postSceneStoryboardGenerate = async (
  request: GenerateSceneStoryboardRequest
) => {
  const response = await backendApiClient.post(
    `${buildSceneStoryboardPath(request)}/generate`
  );
  return SceneStoryboardSubmittedSchema.parse(response.data);
};
