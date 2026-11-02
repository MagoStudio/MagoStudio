import { useGetVideoAssetPrompt } from "./data/useGetVideoAssetPrompt";

export const useVideoAssetPrompt = ({
  assetId,
  enabled = true
}: {
  assetId?: string;
  enabled?: boolean;
}) => {
  return useGetVideoAssetPrompt({ assetId, enabled });
};
