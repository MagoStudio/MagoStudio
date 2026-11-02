export const readCloudLayerOrder = (layer: unknown): number | null => {
  const layerOrder = (layer as { layer_order?: unknown } | null)?.layer_order;
  return typeof layerOrder === "number" && Number.isFinite(layerOrder)
    ? layerOrder
    : null;
};
