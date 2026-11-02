import { useFilteredAndSortedTracks } from "@/domains/track/useFilteredAndSortedTracks";

import { getTrackAsset } from "./utils/getTrackAsset";
import { isVideoAssetReady } from "./utils/isVideoAssetReady";

export const useGetVideoTrackReadiness = () => {
  const {
    data: { videoTrack }
  } = useFilteredAndSortedTracks();

  const isVideoAvailable =
    !!videoTrack && isVideoAssetReady(getTrackAsset(videoTrack));

  /** The shot has a source video on record, even if its file is still being
   * downloaded from the cloud. Only a shot with none is empty. */
  const hasVideoAsset = !!videoTrack && !!getTrackAsset(videoTrack);

  return {
    isVideoAvailable,
    hasVideoAsset
  };
};
