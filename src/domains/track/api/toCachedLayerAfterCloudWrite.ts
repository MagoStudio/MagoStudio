import { syncCloudProjectMetadata } from "@domains/scriptProject/syncCloudScriptProjects";
import { Layer } from "@schemas/layer";

import { isLocalApp } from "@/platform/localDesktop";

import { readMirroredLayer } from "./readMirroredLayer";

export const toCachedLayerAfterCloudWrite = async (
  cloudLayer: Layer,
  projectId: string | undefined
): Promise<Layer> => {
  if (!projectId) return cloudLayer;
  await syncCloudProjectMetadata(projectId);
  if (!isLocalApp) return cloudLayer;
  return (await readMirroredLayer(projectId, cloudLayer.id)) ?? cloudLayer;
};
