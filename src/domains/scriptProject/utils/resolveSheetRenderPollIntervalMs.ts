import { ProjectState } from "@schemas/scriptProject";

import { isSheetImageRendering } from "./isSheetImageRendering";

const FRESH_RENDER_POLL_INTERVAL_MS = 3000;
const LONG_RUNNING_RENDER_POLL_INTERVAL_MS = 15_000;
const FRESH_RENDER_MAX_AGE_MS = 300_000;
const BACKEND_STALE_RENDER_GIVE_UP_AGE_MS = 3_600_000;
const POLL_AFTER_BACKEND_GIVE_UP_MS = 300_000;
const MAX_POLLED_RENDER_AGE_MS =
  BACKEND_STALE_RENDER_GIVE_UP_AGE_MS + POLL_AFTER_BACKEND_GIVE_UP_MS;

const readRenderAgeMs = (
  renderStartedAt: string | null | undefined,
  nowMs: number
): number | null => {
  if (!renderStartedAt) return null;
  const createdAtMs = Date.parse(renderStartedAt);
  if (Number.isNaN(createdAtMs)) return null;
  return nowMs - createdAtMs;
};

export const resolveSheetRenderPollIntervalMs = ({
  projectState,
  nowMs
}: {
  projectState: ProjectState | undefined;
  nowMs: number;
}): number | false => {
  const renderingSheetImageStartTimes = (projectState?.keys ?? []).flatMap(
    (group) =>
      group.images
        .filter(isSheetImageRendering)
        .map((image) => image.created_at)
  );
  const generatingSceneStoryboardStartTimes = (projectState?.shots ?? [])
    .filter((scene) => scene.storyboard?.status === "generating")
    .map((scene) => scene.storyboard?.generating_started_at);
  const renderAgesMs = [
    ...renderingSheetImageStartTimes,
    ...generatingSceneStoryboardStartTimes
  ].map((renderStartedAt) => readRenderAgeMs(renderStartedAt, nowMs));
  const pollableRenderAgesMs = renderAgesMs.filter(
    (renderAgeMs) =>
      renderAgeMs === null || renderAgeMs < MAX_POLLED_RENDER_AGE_MS
  );
  if (pollableRenderAgesMs.length === 0) return false;

  const hasFreshRender = pollableRenderAgesMs.some(
    (renderAgeMs) =>
      renderAgeMs !== null && renderAgeMs < FRESH_RENDER_MAX_AGE_MS
  );
  return hasFreshRender
    ? FRESH_RENDER_POLL_INTERVAL_MS
    : LONG_RUNNING_RENDER_POLL_INTERVAL_MS;
};
