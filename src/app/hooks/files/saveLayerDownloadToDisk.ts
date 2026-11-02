import { Layer } from "@schemas/layer";

import { getLocalDesktopApi } from "@/platform/localDesktop";

import { getLayerDownloadSignedUrl, LayerDownloadKind } from "./downloadFiles";

export const saveLayerDownloadToDisk = async ({
  layerId,
  kind,
  suggestedName
}: {
  layerId: Layer["id"];
  kind: LayerDownloadKind;
  suggestedName: string;
}): Promise<boolean> => {
  const signedUrl = await getLayerDownloadSignedUrl({ layerId, kind });
  return getLocalDesktopApi().files.saveCloudStorageObjectAs({
    url: signedUrl,
    suggestedName
  });
};
