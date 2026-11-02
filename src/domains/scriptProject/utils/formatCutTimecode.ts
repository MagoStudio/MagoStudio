import { SHOT_FPS } from "./snapShotFrames";

const SECONDS_PER_MINUTE = 60;
const SECONDS_PAD_LENGTH = 2;

export const formatCutTimecode = (frames: number): string => {
  const totalSeconds = Math.max(0, Math.floor(frames / SHOT_FPS));
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  return `${minutes}:${String(seconds).padStart(SECONDS_PAD_LENGTH, "0")}`;
};
