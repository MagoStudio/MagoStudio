import { SceneStoryboardResponseSchema } from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi } from "@/platform/localDesktop";

import { isLocalScriptProject } from "../projectOrigin";

import { buildSceneStoryboardPath } from "./sceneStoryboardPath";

export const getSceneStoryboard = async (request: {
  projectId: string;
  sceneTimelineId: string;
}) => {
  const data = (await isLocalScriptProject(request.projectId))
    ? await getLocalDesktopApi().scriptProjects.update({
        projectId: request.projectId,
        operation: "storyboard",
        payload: { timelineId: request.sceneTimelineId }
      })
    : (await backendApiClient.get(buildSceneStoryboardPath(request))).data;
  return SceneStoryboardResponseSchema.parse(data).storyboard;
};
