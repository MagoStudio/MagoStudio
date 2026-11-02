import type { RenderStats } from "../api/fetchProjectStats";

const SECONDS_PER_MINUTE = 60;

type SnapshotLike = {
  planDetails?: Record<string, Record<string, unknown>> | null;
};

const records = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          !!item && typeof item === "object" && !Array.isArray(item)
      )
    : [];

const record = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const timestamp = (value: unknown): number | null => {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/** Recovers Comfy wall-clock video time from durable script-project plan steps. */
export const buildLocalScriptRenderStats = (
  snapshot: SnapshotLike | null | undefined
): Record<string, RenderStats> => {
  const elapsedByAsset = new Map<
    string,
    { seconds: number; startedAt: string; finishedAt: string; model: string }
  >();
  for (const plan of Object.values(snapshot?.planDetails ?? {})) {
    for (const step of records(plan.steps)) {
      if (
        step.status !== "COMPLETED" ||
        (step.tool_name !== "poll_video_render" &&
          step.tool_name !== "timeline_upscale")
      ) {
        continue;
      }
      const result = record(step.result);
      if (result?.resumed_from_existing === true) continue;
      const assetId =
        typeof result?.render_asset_id === "string"
          ? result.render_asset_id
          : typeof result?.asset_id === "string"
            ? result.asset_id
            : null;
      const started = timestamp(step.started_at);
      const finished = timestamp(step.finished_at);
      if (!assetId || started === null || finished === null) continue;
      const seconds = Math.max(0, (finished - started) / 1000);
      if (seconds <= (elapsedByAsset.get(assetId)?.seconds ?? 0)) continue;
      elapsedByAsset.set(assetId, {
        seconds,
        startedAt: String(step.started_at),
        finishedAt: String(step.finished_at),
        model:
          step.tool_name === "timeline_upscale"
            ? "ltx-2.3-spatial-upscaler-x2"
            : "minimax-h3-local"
      });
    }
  }

  return Object.fromEntries(
    [...elapsedByAsset].map(([assetId, timing]) => [
      `local-script-${assetId}`,
      {
        name: assetId,
        cost: 0,
        success: true,
        number_of_frames: 0,
        resolution: "",
        fps: 0,
        control_type: "",
        model: timing.model,
        seed: 0,
        created_at: timing.startedAt,
        finished_at: timing.finishedAt,
        render_started_at: timing.startedAt,
        queue_wait_time: 0,
        queue_wait_time_in_minutes: "0",
        render_time_in_minutes: String(timing.seconds / SECONDS_PER_MINUTE),
        render_time_in_seconds: timing.seconds,
        render_time_per_frame: 0,
        video_duration_in_seconds: 0
      } satisfies RenderStats
    ])
  );
};
