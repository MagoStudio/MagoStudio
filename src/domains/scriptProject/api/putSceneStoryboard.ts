import { SceneStoryboardResponseSchema } from "@schemas/scriptProject";

import { backendApiClient } from "@/lib/backend-api-client";

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
  const response = await backendApiClient.put(buildSceneStoryboardPath(scene), {
    ...(selectedAssetId === undefined
      ? {}
      : { selected_asset_id: selectedAssetId }),
    ...(isUsedInVideoRenders === undefined
      ? {}
      : { enabled: isUsedInVideoRenders })
  });
  return SceneStoryboardResponseSchema.parse(response.data).storyboard;
};
