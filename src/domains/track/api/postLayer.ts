import { isCloudProject } from "@domains/shot/utils/isCloudProject";
import { Layer, LayerType } from "@schemas/layer";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi, isLocalApp } from "@/platform/localDesktop";

import { toCachedLayerAfterCloudWrite } from "./toCachedLayerAfterCloudWrite";

export interface PostTrackParams {
  shotId: string;
  trackName: string;
  trackType: LayerType;
  data: Object;
  parentTrackOrder: number;
  isOutputOfLocalProviderRender?: boolean;
}

export const postTrack = async (
  {
    shotId,
    trackName,
    trackType,
    data,
    parentTrackOrder,
    isOutputOfLocalProviderRender = false
  }: PostTrackParams,
  projectId?: string
): Promise<Layer> => {
  const isTrackStoredLocally =
    isLocalApp &&
    (isOutputOfLocalProviderRender || !(await isCloudProject(projectId)));
  if (isTrackStoredLocally) {
    return (await getLocalDesktopApi().tracks.create({
      shotId,
      name: trackName,
      type: trackType,
      data: data as Record<string, unknown>,
      parentTrackOrder
    })) as Layer;
  }
  const response = await backendApiClient.post(`/layers`, {
    timeline_id: shotId,
    type: trackType,
    name: trackName,
    data: data,
    parent_layer_order: parentTrackOrder
  });
  return toCachedLayerAfterCloudWrite(response.data, projectId);
};
