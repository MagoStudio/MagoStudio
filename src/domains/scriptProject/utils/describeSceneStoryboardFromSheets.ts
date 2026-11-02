import { ShotStoryboard } from "./findShotStoryboard";
import { SceneStoryboardView } from "./sceneStoryboardView";

export const describeSceneStoryboardFromSheets = ({
  shotStoryboard,
  isStoryboardTaggedOnScene
}: {
  shotStoryboard: ShotStoryboard;
  isStoryboardTaggedOnScene: boolean;
}): SceneStoryboardView => {
  const hasNoUsableVersion =
    shotStoryboard.hasLatestStoryboardRenderFailed &&
    !shotStoryboard.latestFinishedStoryboardImageUrl;
  return {
    imageUrl: shotStoryboard.latestFinishedStoryboardImageUrl,
    isRendering: shotStoryboard.isStoryboardRendering,
    hasNoUsableVersion,
    failedRenderClipId: shotStoryboard.hasLatestStoryboardRenderFailed
      ? shotStoryboard.latestStoryboardImage?.clip_id
      : undefined,
    hasLastAttemptFailed:
      shotStoryboard.hasLatestStoryboardRenderFailed && !hasNoUsableVersion,
    isStale: false,
    isUsedInVideoRenders: isStoryboardTaggedOnScene,
    canSwitchVideoUseBackOn: false,
    canListVersions: false,
    versionCount: shotStoryboard.latestStoryboardImage ? 1 : 0,
    maxShotCountToDraw: undefined
  };
};
