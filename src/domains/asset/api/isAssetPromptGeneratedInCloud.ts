import { isCloudAccountActive } from "@/platform/cloudAccount";

import { isAssetCaptionedInCloud } from "../utils/isAssetCaptionedInCloud";

export const isAssetPromptGeneratedInCloud = async (
  assetId: string
): Promise<boolean> => {
  const hasDesktopBridge = typeof window !== "undefined" && !!window.mago;
  if (!hasDesktopBridge) return true;

  const localAsset = await window.mago.assets.get(assetId);
  return isAssetCaptionedInCloud({
    localAsset,
    isCloudAccountActive: isCloudAccountActive()
  });
};
