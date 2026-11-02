import { VideoAssetResponse } from "../../asset/interface";

export const getAssetIngestionError = (
  response: VideoAssetResponse | undefined
): string | undefined => {
  if (!response || !("error_message" in response)) return undefined;

  return response.error_message || undefined;
};
