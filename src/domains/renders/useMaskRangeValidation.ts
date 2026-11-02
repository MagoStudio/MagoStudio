import { useFilteredAndSortedTracks } from "@domains/track/useFilteredAndSortedTracks";
import { VideoEngine, VideoSettings } from "@models/video/types";

import {
  getMaskRangeError,
  type MaskRangeErrorResult
} from "./utils/getMaskRangeError";
import { getMaskTrack } from "./utils/getMaskTrack";

export type { MaskRangeErrorResult } from "./utils/getMaskRangeError";

interface UseMaskRangeValidationParams {
  selectedModelName: VideoEngine | string;
  renderSettingsValues: VideoSettings;
  rangeFrames: [number, number];
}

export const useMaskRangeValidation = ({
  selectedModelName,
  renderSettingsValues,
  rangeFrames
}: UseMaskRangeValidationParams): MaskRangeErrorResult => {
  const { data } = useFilteredAndSortedTracks();

  if (selectedModelName !== VideoEngine.V5_1_0) return undefined;

  const maskTrack = getMaskTrack(renderSettingsValues, data.tracks);
  if (!maskTrack) return undefined;

  return getMaskRangeError({ maskTrack, rangeFrames });
};
