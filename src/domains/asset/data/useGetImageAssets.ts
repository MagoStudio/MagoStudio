import { useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { getImageAsset } from "../api/getImageAsset";
import { ImageAssetResponse } from "../api/interface";
import { resolveSettledAssetResults } from "../utils/resolveSettledAssetResults";

type UseGetImageAssetsParams<TSelected> = {
  assetIds: string[];
  enabled?: boolean;
  selectAll?: (data: (ImageAssetResponse | undefined)[]) => TSelected;
};

export const useGetImageAssets = <
  TSelected = (ImageAssetResponse | undefined)[]
>({
  assetIds,
  enabled = true,
  selectAll
}: UseGetImageAssetsParams<TSelected>) => {
  const queryClient = useQueryClient();
  const validAssetIds = assetIds.filter((id) => !!id);
  const uncachedIds = validAssetIds.filter(
    (id) => !queryClient.getQueryData(queryKeys.imageAsset.byId(id))
  );
  const sortedUncachedIds = [...uncachedIds].sort();
  const batchQuery = useQuery({
    queryKey: queryKeys.imageAssetBatch.forIds(sortedUncachedIds),
    queryFn: async () => {
      const settled = await Promise.allSettled(
        uncachedIds.map((id) => getImageAsset(id))
      );

      const results = resolveSettledAssetResults(settled);

      uncachedIds.forEach((id, index) => {
        if (results[index]) {
          queryClient.setQueryData(
            queryKeys.imageAsset.byId(id),
            results[index]
          );
        }
      });

      return results;
    },
    enabled: enabled && uncachedIds.length > 0,
    staleTime: Infinity,
    gcTime: Infinity
  });
  const allData = (() => {
    void batchQuery.data;
    return validAssetIds.map((id) =>
      queryClient.getQueryData<ImageAssetResponse>(
        queryKeys.imageAsset.byId(id)
      )
    );
  })();
  const transformedData = selectAll
    ? selectAll(allData)
    : (allData as TSelected);
  return {
    data: transformedData,
    isLoading: batchQuery.isLoading,
    error: batchQuery.error ? true : false
  };
};
