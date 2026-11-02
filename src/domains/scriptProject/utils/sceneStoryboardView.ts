export const MAX_SCENE_STORYBOARD_SHOT_COUNT = 15;

export type SceneStoryboardView = {
  imageUrl: string | undefined;
  isRendering: boolean;
  hasNoUsableVersion: boolean;
  failedRenderClipId: string | undefined;
  hasLastAttemptFailed: boolean;
  isStale: boolean;
  isUsedInVideoRenders: boolean;
  canSwitchVideoUseBackOn: boolean;
  canListVersions: boolean;
  versionCount: number;
  maxShotCountToDraw: number | undefined;
};
