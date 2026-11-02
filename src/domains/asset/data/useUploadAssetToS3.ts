import { uploadAssetToS3 } from "@domains/asset/api/putAssetOnS3";
import { useMutation } from "@tanstack/react-query";

export const useUploadAssetToS3 = (options?: { onSuccess?: () => void }) => {
  return useMutation({
    mutationFn: uploadAssetToS3,
    onSuccess: options?.onSuccess
  });
};
