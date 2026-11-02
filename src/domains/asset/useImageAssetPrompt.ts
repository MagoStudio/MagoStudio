import { useGetImageAssetPrompt } from "./data/useGetImageAssetPrompt";

export const useImageAssetPrompt = ({
  assetId,
  enabled = true
}: {
  assetId?: string;
  enabled?: boolean;
}) => {
  return useGetImageAssetPrompt({ assetId, enabled });
};
