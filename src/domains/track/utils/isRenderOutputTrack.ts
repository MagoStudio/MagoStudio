import { Layer, LayerType } from "@schemas/layer";

import { isMaskTrack } from "./isMaskTrack";

export const isRenderOutputTrack = (track: Layer | undefined): boolean => {
  if (!track) return false;
  return (
    track.type.toLowerCase() === LayerType.RENDER.toLowerCase() &&
    !isMaskTrack(track)
  );
};
