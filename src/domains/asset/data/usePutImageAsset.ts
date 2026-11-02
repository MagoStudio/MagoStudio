import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { putImageAsset } from "../api/putImageAsset";

export const usePutImageAsset = ({ assetId }: { assetId: string }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (changes: { rate: number }) => putImageAsset(assetId, changes),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.imageAsset.byId(assetId)
      });
    }
  });
};
