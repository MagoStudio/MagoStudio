import { toRangeLength } from "./frameDurationLimits";

export const getOneSecondRange = ({
  start,
  fps,
  shotMaxFrames
}: {
  start: number;
  fps: number;
  shotMaxFrames: number;
}): [number, number] => {
  const oneSecondRangeLength = toRangeLength(Math.round(fps));
  const end = Math.min(start + oneSecondRangeLength, shotMaxFrames);
  const clampedStart = Math.max(0, end - oneSecondRangeLength);
  return [clampedStart, end];
};
