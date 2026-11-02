import { Layer } from "@schemas/layer";

import { getTrackDuration } from "../getTrackDuration";

import { getTimelineOffset } from "./getTimelineOffset";

export const frameRangeOf = (track: Layer): [number, number] => {
  const startFrame = getTimelineOffset(track);
  const duration = getTrackDuration(track) ?? 0;

  return [startFrame, startFrame + duration];
};
