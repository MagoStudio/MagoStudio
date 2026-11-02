import { useImageAssets } from "@domains/asset/useImageAssets";

import { getBulkRendersRunSecureResultUrl } from "./getBulkRendersRunSecureResultUrl";

type ResolvedImageAsset = ReturnType<typeof useImageAssets>["data"][number];

export const buildBulkRendersRunImageResultUrlByAssetId = (
  resolvedImageAssets: ResolvedImageAsset[]
): Map<string, string> => {
  const urlByAssetId = new Map<string, string>();

  for (const imageAsset of resolvedImageAssets) {
    const secureUrl = getBulkRendersRunSecureResultUrl(imageAsset.urlToUse);
    if (secureUrl) {
      urlByAssetId.set(imageAsset.asset.id, secureUrl);
    }
  }

  return urlByAssetId;
};
