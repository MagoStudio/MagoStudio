import { Layer } from "@schemas/layer";

export const isTrackMirroredFromCloud = (track: Layer): boolean =>
  "cloud_mirrored" in track && track.cloud_mirrored === true;
