import { useGetImageAssets } from "./data/useGetImageAssets";

export const useImageAssets = ({
  assetIds,
  enabled = true
}: {
  assetIds: string[];
  enabled?: boolean;
}) => {
  return useGetImageAssets({
    assetIds,
    enabled,
    selectAll: (data) => data.filter((image) => !!image)
  });
};
