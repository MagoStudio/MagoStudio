import { SceneStoryboardSummary } from "@schemas/scriptProject";

import {
  MAX_SCENE_STORYBOARD_SHOT_COUNT,
  SceneStoryboardView
} from "./sceneStoryboardView";

export const describeSceneStoryboardFromBackend = (
  summary: SceneStoryboardSummary
): SceneStoryboardView => ({
  imageUrl: summary.image_url ?? undefined,
  isRendering: summary.status === "generating",
  hasNoUsableVersion: summary.status === "failed",
  failedRenderClipId: undefined,
  hasLastAttemptFailed:
    summary.last_attempt_failed &&
    summary.status === "ready" &&
    summary.enabled,
  isStale: summary.status === "stale",
  isUsedInVideoRenders: summary.enabled,
  canSwitchVideoUseBackOn: true,
  canListVersions: true,
  versionCount: summary.version_count,
  maxShotCountToDraw: MAX_SCENE_STORYBOARD_SHOT_COUNT
});
