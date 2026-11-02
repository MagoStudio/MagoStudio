export const findCloudRenderAssetId = (layer: unknown): string | null => {
  const clips = (layer as { clips?: { asset?: { id?: unknown } }[] })?.clips;
  if (!Array.isArray(clips)) return null;
  for (const clip of [...clips].reverse()) {
    const id = clip?.asset?.id;
    if (typeof id === "string" && id) return id;
  }
  return null;
};
