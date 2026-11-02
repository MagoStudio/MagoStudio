import { isCloudMirroredAssetCachedLocally } from "@domains/asset/utils/isCloudMirroredAssetCachedLocally";
import { isTrackOwnedByCloud } from "@domains/track/utils/isTrackOwnedByCloud";
import { Layer } from "@schemas/layer";

import { getLocalDesktopApi, isLocalApp } from "@/platform/localDesktop";

import { downloadLayerVideo } from "./downloadFiles";

const readLibraryVideo = async (filepath: string): Promise<Blob> => {
  const response = await fetch(filepath);
  if (!response.ok) throw new Error("Local video file could not be read");
  return response.blob();
};

const readMirroredCloudVideo = async ({
  trackId,
  assetId
}: {
  trackId: Layer["id"];
  assetId: string | undefined;
}): Promise<Blob> => {
  const mirroredAsset = assetId
    ? await getLocalDesktopApi().assets.get(assetId)
    : null;
  if (mirroredAsset && isCloudMirroredAssetCachedLocally(mirroredAsset)) {
    return readLibraryVideo(mirroredAsset.filepath);
  }
  return downloadLayerVideo({ layerId: trackId });
};

export const downloadTrackVideoForProject = async ({
  projectId,
  trackId,
  assetId
}: {
  projectId: string | null | undefined;
  trackId: Layer["id"];
  assetId: string | undefined;
}): Promise<Blob> => {
  if (!isLocalApp) return downloadLayerVideo({ layerId: trackId });
  const isTrackStoredInCloud = await isTrackOwnedByCloud({
    projectId: projectId ?? undefined,
    trackId
  });
  if (isTrackStoredInCloud) return readMirroredCloudVideo({ trackId, assetId });

  if (!assetId) throw new Error("This track has no rendered video");
  const asset = await getLocalDesktopApi().assets.get(assetId);
  if (!asset) throw new Error("Local video asset not found");
  return readLibraryVideo(asset.filepath);
};
