import { useVideoFrame } from "@domains/asset/useVideoFrame";
import { Layer } from "@schemas/layer";

import { getTimelineOffset, toOutputFrame } from "./utils/frameCoordinates";
import { getTrackAssetData } from "./utils/getTrackAssetData";
import { getTrackAssetId } from "./utils/getTrackAssetId";

export const useTrackFrameSrc = ({
  track,
  frameNumber,
  enabled = true
}: {
  track: Layer | undefined;
  frameNumber: number;
  enabled?: boolean;
}) => {
  const assetFrameNumber = toOutputFrame({
    sourceFrame: frameNumber,
    offset: getTimelineOffset(track)
  });

  const {
    data: trackFrameSrc,
    isLoading,
    error
  } = useVideoFrame({
    assetId: getTrackAssetId(track),
    selectedLayerId: track?.id,
    frameNumber: assetFrameNumber,
    fps: getTrackAssetData(track)?.fps,
    enabled
  });

  return { trackFrameSrc, isLoading, error };
};
