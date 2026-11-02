import { getTrackAssetId } from "@domains/track/utils/getTrackAssetId";
import { Layer } from "@schemas/layer";

import { getLocalDesktopApi } from "@/platform/localDesktop";

export const saveTrackVideoToDisk = async ({
  track,
  fileName
}: {
  track: Layer;
  fileName: string;
}): Promise<void> => {
  const assetId = getTrackAssetId(track);
  if (!assetId) {
    throw new Error("This track has no rendered video to save");
  }
  await getLocalDesktopApi().files.saveAssetAs({
    assetId,
    suggestedName: fileName
  });
};
