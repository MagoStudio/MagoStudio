import { CutShot } from "@schemas/scriptProject";

export type CutShotVideo = {
  videoUrl: string | null;
  videoAssetId: string | null;
  posterUrl: string | null;
};

export const resolveCutShotVideo = (shot: CutShot): CutShotVideo => {
  if (shot.isSceneHiddenUntilDubLands) {
    return { videoUrl: null, videoAssetId: null, posterUrl: null };
  }
  const dubbedSceneAssetId = shot.mixed_asset_id;
  if (!dubbedSceneAssetId || !shot.url) {
    return {
      videoUrl: shot.url,
      videoAssetId: shot.asset_id,
      posterUrl: shot.poster_url
    };
  }
  return {
    videoUrl: shot.url,
    videoAssetId: dubbedSceneAssetId,
    posterUrl: shot.poster_url
  };
};
