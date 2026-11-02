import { Layer, LayerType } from "@schemas/layer";

const MAGO_V2_ENGINE = "magov2";

export const isEligibleRenderTrack = (track: Layer): boolean => {
  if (track.type !== LayerType.RENDER) return false;
  return track.data.renderEngine === MAGO_V2_ENGINE && track.clips.length > 0;
};

export const filterEligibleLayers = (layers: Layer[]): Layer[] =>
  layers.filter(
    (layer) => layer.type !== LayerType.RENDER || isEligibleRenderTrack(layer)
  );
