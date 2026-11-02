import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { isAssetPromptGeneratedInCloud } from "../api/isAssetPromptGeneratedInCloud";

export const useIsAssetPromptGeneratedInCloud = ({
  assetId,
  enabled = true
}: {
  assetId: string | undefined;
  enabled?: boolean;
}) => {
  const { data: isPromptGeneratedInCloud = false } = useQuery({
    queryKey: queryKeys.assetPromptGeneratedInCloud.byId(assetId),
    queryFn: () => {
      if (!assetId) throw new Error("Asset ID is required");
      return isAssetPromptGeneratedInCloud(assetId);
    },
    enabled: enabled && !!assetId,
    staleTime: Infinity
  });

  return { isPromptGeneratedInCloud };
};
