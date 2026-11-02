interface MaybeAsset {
  id?: unknown;
}

interface MaybeClip {
  asset?: MaybeAsset;
  asset_id?: unknown;
}

interface MaybeLayer {
  id?: unknown;
  clips?: MaybeClip[];
}

interface MaybeResponse {
  timeline?: { layers?: MaybeLayer[] };
}

const readClipAssetId = (clip: MaybeClip | undefined): string | null => {
  const nestedAssetId = clip?.asset?.id;
  if (typeof nestedAssetId === "string" && nestedAssetId) return nestedAssetId;
  const isClipAssetOmittedFromResponse = clip?.asset === undefined;
  if (!isClipAssetOmittedFromResponse) return null;
  if (typeof clip?.asset_id === "string" && clip.asset_id) return clip.asset_id;
  return null;
};

export const findUploadedAssetId = (response: unknown): string | null => {
  const timeline = (response as MaybeResponse)?.timeline;
  const layers = Array.isArray(timeline?.layers) ? timeline.layers : [];
  for (const layer of layers) {
    const clips = Array.isArray(layer?.clips) ? layer.clips : [];
    for (const clip of clips) {
      const clipAssetId = readClipAssetId(clip);
      if (clipAssetId) return clipAssetId;
    }
  }
  return null;
};

/**
 * The layer the uploaded asset landed on. A render needs it as its input source,
 * and it is only available in this response.
 */
export const findUploadedLayerId = (
  response: unknown,
  cloudAssetId: string
): string | null => {
  const timeline = (response as MaybeResponse)?.timeline;
  const layers = Array.isArray(timeline?.layers) ? timeline.layers : [];
  for (const layer of layers) {
    const clips = Array.isArray(layer?.clips) ? layer.clips : [];
    const holdsAsset = clips.some(
      (clip) =>
        clip?.asset?.id === cloudAssetId || clip?.asset_id === cloudAssetId
    );
    if (holdsAsset && typeof layer.id === "string" && layer.id) return layer.id;
  }
  return null;
};
