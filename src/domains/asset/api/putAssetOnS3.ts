import { PERCENTAGE_MULTIPLIER } from "@constants";
import axios from "axios";

export const uploadAssetToS3 = async (params: {
  s3_url: string;
  file: File;
  onUploadProgress?: (progress: number) => void;
  signal?: AbortSignal;
}): Promise<void> => {
  const { s3_url, file, onUploadProgress, signal } = params;

  const response = await axios.put(s3_url, file, {
    headers: {
      "Content-Type": file.type
    },
    signal,
    onUploadProgress: (progressEvent) => {
      if (progressEvent.lengthComputable && progressEvent.total) {
        const progress = Math.round(
          (progressEvent.loaded * PERCENTAGE_MULTIPLIER) / progressEvent.total
        );
        if (onUploadProgress) {
          onUploadProgress(progress);
        }
      } else if (onUploadProgress) {
        onUploadProgress(-1);
      }
    }
  });

  return response.data;
};
