import { ImageAssetResponse } from "./api/interface";
import { useGetImageAssets } from "./data/useGetImageAssets";

export const useImageAssetNames = ({ assetIds }: { assetIds: string[] }) => {
  const selectAll = (data: (ImageAssetResponse | undefined)[]) => {
    return data.reduce<{
      [assetId: string]: string;
    }>((acc, curr) => {
      if (curr && curr.asset) {
        acc[curr.asset.id] = curr.asset.name;
      }
      return acc;
    }, {});
  };
  return useGetImageAssets({
    assetIds,
    selectAll
  });
};
