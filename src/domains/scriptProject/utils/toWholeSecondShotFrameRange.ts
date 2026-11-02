import { roundHalfToEven } from "./roundHalfToEven";
import { SHOT_FPS } from "./snapShotFrames";

export const toWholeSecondShotFrameRange = (
  frameRange: [number, number]
): [number, number] => {
  const [startFrame, endFrame] = frameRange;
  const wholeSeconds = roundHalfToEven((endFrame - startFrame + 1) / SHOT_FPS);
  return [startFrame, startFrame + wholeSeconds * SHOT_FPS];
};
