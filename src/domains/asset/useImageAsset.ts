import { useGetImageAsset } from "./data/useGetImageAsset";

export const useImageAsset = ({
  assetId,
  enabled = true
}: {
  assetId?: string;
  enabled?: boolean;
}) => {
  return useGetImageAsset({ assetId, enabled });
};
