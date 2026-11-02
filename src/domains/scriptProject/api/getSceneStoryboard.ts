import { SceneStoryboardResponseSchema } from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";

import { buildSceneStoryboardPath } from "./sceneStoryboardPath";

export const getSceneStoryboard = async (request: {
  projectId: string;
  sceneTimelineId: string;
}) => {
  const response = await backendApiClient.get(
    buildSceneStoryboardPath(request)
  );
  return SceneStoryboardResponseSchema.parse(response.data).storyboard;
};
