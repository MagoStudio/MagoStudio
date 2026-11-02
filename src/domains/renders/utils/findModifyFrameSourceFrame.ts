import { Layer, LayerType } from "@schemas/layer";

/**
 * The frame of the input video a Modify-frame result was generated from.
 *
 * The Modify frame tool records it on the clip as `data.frame` and builds its
 * history name from the same value (`buildImg2ImgRenderName`). Reading it back
 * from the clip keeps a single source of truth: an asset with no Modify-frame
 * clip — an upload — resolves to `undefined`, which is what the design asks for.
 */
export const findModifyFrameSourceFrame = (
  layers: Layer[] | undefined,
  assetId: string | undefined
): number | undefined => {
  if (!assetId) return undefined;

  const modifyFrameClips =
    layers?.find((layer) => layer.type === LayerType.IMG2IMG)?.clips ?? [];

  const matchingClip = modifyFrameClips.find(
    (clip) => clip.asset_id === assetId
  );

  return typeof matchingClip?.data.frame === "number"
    ? matchingClip.data.frame
    : undefined;
};
