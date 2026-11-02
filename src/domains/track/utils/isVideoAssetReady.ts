import { Asset } from "@schemas/asset";

export const isVideoAssetReady = (
  asset: Pick<Asset, "data" | "filepath"> | undefined
): boolean => {
  if (!asset) return false;
  const status = asset.data?.status;
  return status === "ingested" || (!status && !!asset.filepath);
};
