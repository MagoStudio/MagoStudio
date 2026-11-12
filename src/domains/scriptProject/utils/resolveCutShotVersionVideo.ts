import { CutShot, CutShotVersion } from "@schemas/scriptProject";

import { isCutShotVersionHiddenUntilDubLands } from "./isCutShotVersionHiddenUntilDubLands";
import { resolveCutShotVideo } from "./resolveCutShotVideo";

export type CutShotVersionVideo = {
  videoUrl: string | null;
  videoAssetId: string | null;
  posterUrl: string | null;
};

export const resolveCutShotVersionVideo = (
  shot: CutShot,
  version: CutShotVersion
): CutShotVersionVideo => {
  if (isCutShotVersionHiddenUntilDubLands(shot, version)) {
    return { videoUrl: null, videoAssetId: null, posterUrl: null };
  }
  if (version.mixed_url && version.mixed_asset_id) {
    return {
      videoUrl: version.mixed_url,
      videoAssetId: version.mixed_asset_id,
      posterUrl: version.poster_url
    };
  }
  const versionOwnRender = {
    videoUrl: version.url,
    videoAssetId: version.asset_id,
    posterUrl: version.poster_url
  };
  const isVersionPlayedByCut = version.asset_id === shot.asset_id;
  if (!isVersionPlayedByCut) return versionOwnRender;
  const { videoUrl: cutVideoUrl, videoAssetId: cutVideoAssetId } =
    resolveCutShotVideo(shot);
  const isCutPlayingDubbedScene = cutVideoAssetId !== version.asset_id;
  if (!cutVideoAssetId || !isCutPlayingDubbedScene) return versionOwnRender;
  return {
    videoUrl: cutVideoUrl,
    videoAssetId: cutVideoAssetId,
    posterUrl: version.poster_url
  };
};
