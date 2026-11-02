import { Clip } from "@schemas/clip";
import { Layer } from "@schemas/layer";

export const getTrackClip = (track: Layer | undefined): Clip | undefined =>
  track?.clips[0];
