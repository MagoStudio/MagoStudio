import { useInputTrack } from "@domains/track/useInputTrack";
import { frameRangeOf } from "@domains/track/utils/frameCoordinates";

export const useIsRangeOutOfBounds = (
  rangeMin: number,
  rangeMax: number
): boolean => {
  const { inputTrack } = useInputTrack();
  const [inputTrackStart, inputTrackEnd] = inputTrack
    ? frameRangeOf(inputTrack)
    : [0, 0];

  return rangeMin < inputTrackStart || rangeMax > inputTrackEnd;
};
