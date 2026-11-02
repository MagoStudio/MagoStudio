import { useInputTrack } from "@domains/track/useInputTrack";

import { useTrackFrameSrc } from "./useTrackFrameSrc";

export const useInputTrackFrameSrc = ({
  frameNumber,
  enabled = true
}: {
  frameNumber: number;
  enabled?: boolean;
}) => {
  const { inputTrack, isLoading } = useInputTrack();

  const {
    trackFrameSrc: inputTrackFrameSrc,
    isLoading: isFrameLoading,
    error
  } = useTrackFrameSrc({
    track: inputTrack ?? undefined,
    frameNumber,
    enabled
  });

  return {
    inputTrackFrameSrc,
    isLoading: isLoading || isFrameLoading,
    error
  };
};
