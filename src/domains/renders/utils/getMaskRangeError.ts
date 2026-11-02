import { frameRangeOf } from "@domains/track/utils/frameCoordinates";
import { getTrackClip } from "@domains/track/utils/getTrackClip";
import { Layer } from "@schemas/layer";

type MaskRangeErrorKind = "not_in_range" | "shorter_than_range";

export type MaskRangeErrorResult =
  | {
      kind: MaskRangeErrorKind;
      maskFrames: [number, number];
      rangeFrames: [number, number];
    }
  | undefined;

export const getMaskRangeError = ({
  maskTrack,
  rangeFrames
}: {
  maskTrack: Layer | undefined;
  rangeFrames: [number, number];
}): MaskRangeErrorResult => {
  if (!maskTrack) return undefined;

  const isMaskClipLoaded = !!getTrackClip(maskTrack);
  if (!isMaskClipLoaded) return undefined;

  const [maskStart, maskEnd] = frameRangeOf(maskTrack);
  if (maskEnd < maskStart) return undefined;

  const [rangeStart, rangeEnd] = rangeFrames;
  if (rangeEnd < rangeStart) return undefined;

  const maskFrames: [number, number] = [maskStart, maskEnd];
  const rangeOut: [number, number] = [rangeStart, rangeEnd];

  if (maskEnd < rangeStart || maskStart > rangeEnd) {
    return { kind: "not_in_range", maskFrames, rangeFrames: rangeOut };
  }

  const maskCoversRange = maskStart <= rangeStart && maskEnd >= rangeEnd;
  if (maskCoversRange) return undefined;

  if (maskEnd - maskStart < rangeEnd - rangeStart) {
    return {
      kind: "shorter_than_range",
      maskFrames,
      rangeFrames: rangeOut
    };
  }

  return undefined;
};
