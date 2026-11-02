export type FrameRangePreset = "full" | "oneSecond";

const rangesMatch = (a: [number, number], b: [number, number]) =>
  a[0] === b[0] && a[1] === b[1];

export const getActiveFrameRangePreset = ({
  range,
  fullClipRange,
  oneSecondRange
}: {
  range: [number, number];
  fullClipRange: [number, number];
  oneSecondRange: [number, number];
}): FrameRangePreset | null => {
  if (rangesMatch(range, fullClipRange)) return "full";
  if (rangesMatch(range, oneSecondRange)) return "oneSecond";
  return null;
};
