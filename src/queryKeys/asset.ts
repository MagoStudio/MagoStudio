export const videoAsset = {
  all: ["videoAsset"] as const,
  byId: (assetId: string | undefined) => [...videoAsset.all, assetId] as const
};

export const videoHasAudioTrack = {
  all: ["videoHasAudioTrack"] as const,
  bySrc: (videoSrc: string) => [...videoHasAudioTrack.all, videoSrc] as const
};

export const videoDurationSeconds = {
  all: ["videoDurationSeconds"] as const,
  byAssetId: (assetId: string) =>
    [...videoDurationSeconds.all, assetId] as const
};

export const imageAsset = {
  byId: (assetId: string | undefined) => ["imageAsset", assetId] as const
};

export const assetPrompt = {
  byId: (assetId: string | undefined) => ["assetPrompt", assetId] as const
};

export const imageAssetBatch = {
  forIds: (assetIds: string[]) => ["imageAssetBatch", ...assetIds] as const
};

export const assetLibraryItems = {
  all: ["asset-library-items-infinite"] as const
};

export const assetPromptGeneratedInCloud = {
  byId: (assetId: string | undefined) =>
    ["assetPromptGeneratedInCloud", assetId] as const
};
