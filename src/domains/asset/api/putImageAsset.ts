import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi, isLocalApp } from "@/platform/localDesktop";

import { ImageAssetResponse } from "./interface";

const putCloudImageAsset = async (
  assetId: string,
  changes: { rate: number }
): Promise<ImageAssetResponse> => {
  const response = await backendApiClient.put<ImageAssetResponse>(
    `/assets/${assetId}`,
    {
      ...changes
    }
  );
  return response.data;
};

export const putImageAsset = async (
  assetId: string,
  changes: { rate: number }
): Promise<ImageAssetResponse> => {
  if (!isLocalApp) return putCloudImageAsset(assetId, changes);

  const desktop = getLocalDesktopApi();
  const localAsset = await desktop.assets.get(assetId);
  const isOwnedByCloud = !localAsset || localAsset.data.cloudMirror === true;
  if (isOwnedByCloud) {
    const cloudAsset = await putCloudImageAsset(assetId, changes);
    if (localAsset)
      await desktop.assets.update({ assetId, rate: changes.rate });
    return cloudAsset;
  }

  const asset = await desktop.assets.update({ assetId, rate: changes.rate });
  if (!asset) throw new Error("Local image asset not found");
  const thumbnail = asset.data.thumbnail_filepath;
  return {
    s3_url: asset.filepath,
    urlToUse:
      typeof thumbnail === "string" && thumbnail ? thumbnail : asset.filepath,
    asset: asset as ImageAssetResponse["asset"]
  };
};
