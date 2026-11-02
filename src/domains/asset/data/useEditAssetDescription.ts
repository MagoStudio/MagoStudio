import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import {
  EditAssetDescriptionRequest,
  putAssetDescription
} from "../api/putAssetDescription";

export const useEditAssetDescription = (options?: {
  onError?: (error: unknown) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: EditAssetDescriptionRequest) =>
      putAssetDescription(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projectState.all
      });
    },
    onError: options?.onError
  });
};
