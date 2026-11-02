import { SceneStoryboardResponseSchema } from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi } from "@/platform/localDesktop";

import { isLocalScriptProject } from "../projectOrigin";

import { buildSceneStoryboardPath } from "./sceneStoryboardPath";

export type UpdateSceneStoryboardRequest = {
  projectId: string;
  sceneTimelineId: string;
  selectedAssetId?: string | null;
  isUsedInVideoRenders?: boolean;
};
export const putSceneStoryboard = async ({
  selectedAssetId,
  isUsedInVideoRenders,
  ...scene
}: UpdateSceneStoryboardRequest) => {
  const fields = {
    ...(selectedAssetId === undefined
      ? {}
      : { selected_asset_id: selectedAssetId }),
    ...(isUsedInVideoRenders === undefined
      ? {}
      : { enabled: isUsedInVideoRenders })
  };
  const data = (await isLocalScriptProject(scene.projectId))
    ? await getLocalDesktopApi().scriptProjects.update({
        projectId: scene.projectId,
        operation: "storyboard-update",
        payload: { timelineId: scene.sceneTimelineId, ...fields }
      })
    : (await backendApiClient.put(buildSceneStoryboardPath(scene), fields))
        .data;
  return SceneStoryboardResponseSchema.parse(data).storyboard;
};
