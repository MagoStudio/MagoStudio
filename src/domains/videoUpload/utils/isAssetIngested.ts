import { VideoAssetResponse } from "../../asset/interface";
import { INGESTED_ASSET_STATUS } from "../constants";

export const isAssetIngested = (
  response: VideoAssetResponse | undefined
): boolean => {
  if (!response || !("asset" in response)) return false;

  return response.asset?.data?.status === INGESTED_ASSET_STATUS;
};
