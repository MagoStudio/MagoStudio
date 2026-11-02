export const img2imgStatus = {
  byClipId: (clipId: string | undefined) => ["img2imgStatus", clipId] as const
};

export const autoPrompt = {
  for: (
    version: string,
    styleReferenceImageId: string | undefined,
    videoAssetId: string | undefined
  ) => ["autoPrompt", version, styleReferenceImageId, videoAssetId] as const
};
