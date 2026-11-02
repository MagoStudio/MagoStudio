import { Layer, LayerType } from "@schemas/layer";

export const buildImg2ImgRenderName = (
  layers: Layer[] | undefined,
  frame: number
): string => {
  const img2imgLayerClips =
    layers?.find((layer) => layer.type === LayerType.IMG2IMG)?.clips ?? [];
  const iteration =
    img2imgLayerClips.filter((clip) => clip.data.frame === frame).length + 1;
  return `${frame}_${iteration}`;
};
