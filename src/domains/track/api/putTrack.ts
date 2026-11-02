import { isTrackOwnedByCloud } from "@domains/track/utils/isTrackOwnedByCloud";
import { Layer } from "@schemas/layer";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi, isLocalApp } from "@/platform/localDesktop";

import { RatingType } from "../interface";

import { toCachedLayerAfterCloudWrite } from "./toCachedLayerAfterCloudWrite";

export const putTrack = async ({
  layerId,
  layerName,
  layerData,
  rating,
  projectId
}: {
  layerId: string;
  layerName: string;
  layerData: Object;
  rating?: RatingType;
  projectId?: string;
}): Promise<Layer> => {
  const isTrackStoredLocally =
    isLocalApp && !(await isTrackOwnedByCloud({ projectId, trackId: layerId }));
  if (isTrackStoredLocally) {
    return (await getLocalDesktopApi().tracks.update({
      trackId: layerId,
      name: layerName,
      data: layerData as Record<string, unknown>,
      rating
    })) as Layer;
  }
  const response = await backendApiClient.put(`/layers/${layerId}`, {
    name: layerName,
    data: layerData,
    rating
  });
  return toCachedLayerAfterCloudWrite(response.data, projectId);
};
