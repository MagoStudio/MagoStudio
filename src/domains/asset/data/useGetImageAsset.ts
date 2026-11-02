import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { queryKeys } from "@/queryKeys";

import { getImageAsset } from "../api/getImageAsset";
import { ImageAssetResponse } from "../api/interface";
import { createUnresolvedAssetRefetchInterval } from "../utils/createUnresolvedAssetRefetchInterval";

import { useAssetDownloadPriority } from "./useAssetDownloadPriority";

const REFETCH_INTERVAL_MS = 2000;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;
const MAX_RETRY_COUNT = 3;

export const useGetImageAsset = ({
  assetId,
  enabled = true
}: {
  assetId?: string;
  enabled?: boolean;
}) => {
  useAssetDownloadPriority(assetId, !!assetId && enabled);
  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: queryKeys.imageAsset.byId(assetId),
    queryFn: async () => {
      if (!assetId) throw new Error("Asset ID is required");
      return getImageAsset(assetId);
    },
    enabled: !!assetId && enabled,
    staleTime: (query) => {
      if (!query.state.data?.urlToUse) {
        return 0;
      }
      return Infinity;
    },
    gcTime: Infinity,
    refetchInterval: createUnresolvedAssetRefetchInterval<ImageAssetResponse>({
      pollIntervalMs: REFETCH_INTERVAL_MS,
      getPlayableUrl: (imageAsset) => imageAsset?.urlToUse
    }),
    retry: (failureCount, error) => {
      if (
        error instanceof AxiosError &&
        error.response?.status &&
        error.response.status >= HTTP_STATUS_INTERNAL_SERVER_ERROR
      ) {
        return false;
      }
      return failureCount < MAX_RETRY_COUNT;
    }
  });

  return { data, isLoading, isFetching, isError, error };
};
