import type { imageRenderJobs } from "./schema";

const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const PERCENT = 100;
const COST_DECIMALS = 4;
const MINUTE_DECIMALS = 2;
const SUCCESS_RATE_DECIMALS = 1;

export type ProjectStatsJobRow = Pick<
  typeof imageRenderJobs.$inferSelect,
  | "id"
  | "model"
  | "status"
  | "requestJson"
  | "createdAt"
  | "startedAt"
  | "finishedAt"
>;

interface RenderStats {
  name: string;
  cost: number;
  success: boolean;
  number_of_frames: number;
  resolution: string;
  fps: number;
  control_type: string;
  model: string;
  seed: number;
  created_at: string;
  finished_at: string;
  render_started_at: string;
  queue_wait_time: number;
  queue_wait_time_in_minutes: string;
  render_time_in_minutes: string;
  render_time_in_seconds: number;
  render_time_per_frame: number;
  video_duration_in_seconds: number;
}

interface ProjectStatsTotal {
  total_amount_of_renders: number;
  total_amount_of_successful_renders: number;
  success_rate: number;
  average_cost_per_frame: string;
  average_cost_per_second: string;
  average_render_time_per_frame: string;
  earliest_render_date: string;
  latest_render_date: string;
  models_used: string[];
  most_used_model: string;
  total_cost: number;
  total_frames_rendered: number;
  total_queue_wait_time: string;
  total_queue_wait_time_in_minutes: string;
  total_render_time_in_seconds: number;
  total_successful_render_time_in_seconds: number;
  total_time_rendered: string;
}

export type ProjectStats = { total: ProjectStatsTotal } & Record<
  string,
  RenderStats | ProjectStatsTotal
>;

const parseRequest = (requestJson: string): Record<string, unknown> => {
  try {
    const parsed = JSON.parse(requestJson) as unknown;
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
};

const asFiniteNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const frameCountOf = (request: Record<string, unknown>): number => {
  const range = request.frameRange;
  if (
    Array.isArray(range) &&
    range.length === 2 &&
    typeof range[0] === "number" &&
    typeof range[1] === "number"
  ) {
    return Math.max(1, range[1] - range[0] + 1);
  }
  return 1;
};

const resolutionOf = (settings: Record<string, unknown>): string => {
  const width = asFiniteNumber(settings.width);
  const height = asFiniteNumber(settings.height);
  if (width && height) return `${width}x${height}`;
  return typeof settings.resolution === "string" ? settings.resolution : "";
};

const elapsedSeconds = (from: Date | null, to: Date | null): number =>
  from && to
    ? Math.max(0, (to.getTime() - from.getTime()) / MILLISECONDS_PER_SECOND)
    : 0;

const formatMinutes = (seconds: number): string =>
  (seconds / SECONDS_PER_MINUTE).toFixed(MINUTE_DECIMALS);

const formatDurationLabel = (seconds: number): string => {
  const whole = Math.round(seconds);
  const minutes = Math.floor(whole / SECONDS_PER_MINUTE);
  return `${minutes}m ${whole - minutes * SECONDS_PER_MINUTE}s`;
};

const formatCost = (value: number): string => value.toFixed(COST_DECIMALS);

const isoOrEmpty = (value: Date | null): string =>
  value ? value.toISOString() : "";

const mostUsed = (models: string[]): string => {
  const counts = new Map<string, number>();
  for (const model of models) {
    counts.set(model, (counts.get(model) ?? 0) + 1);
  }
  let winner = "";
  let best = 0;
  for (const [model, count] of counts) {
    if (count > best) {
      winner = model;
      best = count;
    }
  }
  return winner;
};

const toRenderStats = (job: ProjectStatsJobRow): RenderStats => {
  const request = parseRequest(job.requestJson);
  const settings =
    request.settings && typeof request.settings === "object"
      ? (request.settings as Record<string, unknown>)
      : {};
  const frames = frameCountOf(request);
  const fps = asFiniteNumber(request.fps) ?? 0;
  const renderTimeInSeconds = elapsedSeconds(job.startedAt, job.finishedAt);

  return {
    name: typeof request.name === "string" ? request.name : job.id,
    cost: asFiniteNumber(request.estimatedCostUsd) ?? 0,
    success: job.status === "FINISHED",
    number_of_frames: frames,
    resolution: resolutionOf(settings),
    fps,
    control_type: "",
    model: job.model,
    seed: asFiniteNumber(settings.seed) ?? 0,
    created_at: job.createdAt.toISOString(),
    finished_at: isoOrEmpty(job.finishedAt),
    render_started_at: isoOrEmpty(job.startedAt),
    queue_wait_time: elapsedSeconds(job.createdAt, job.startedAt),
    queue_wait_time_in_minutes: formatMinutes(
      elapsedSeconds(job.createdAt, job.startedAt)
    ),
    render_time_in_minutes: formatMinutes(renderTimeInSeconds),
    render_time_in_seconds: renderTimeInSeconds,
    render_time_per_frame: renderTimeInSeconds / frames,
    video_duration_in_seconds: fps > 0 ? frames / fps : 0
  };
};

/**
 * Local stand-in for the cloud's /projects/stats/:id. Costs are the fal.ai USD
 * estimates recorded at submit time, not Mago credits.
 */
export const buildProjectStats = (jobs: ProjectStatsJobRow[]): ProjectStats => {
  const renders = jobs.map(toRenderStats);
  const successful = renders.filter((render) => render.success);
  const totalCost = renders.reduce((sum, render) => sum + render.cost, 0);
  const totalFrames = renders.reduce(
    (sum, render) => sum + render.number_of_frames,
    0
  );
  const totalRenderSeconds = renders.reduce(
    (sum, render) => sum + render.render_time_in_seconds,
    0
  );
  const successfulRenderSeconds = successful.reduce(
    (sum, render) => sum + render.render_time_in_seconds,
    0
  );
  const totalQueueSeconds = renders.reduce(
    (sum, render) => sum + render.queue_wait_time,
    0
  );
  const totalVideoSeconds = renders.reduce(
    (sum, render) => sum + render.video_duration_in_seconds,
    0
  );
  const createdTimes = renders.map((render) =>
    new Date(render.created_at).getTime()
  );

  const total: ProjectStatsTotal = {
    total_amount_of_renders: renders.length,
    total_amount_of_successful_renders: successful.length,
    success_rate: renders.length
      ? Number(
          ((successful.length / renders.length) * PERCENT).toFixed(
            SUCCESS_RATE_DECIMALS
          )
        )
      : 0,
    average_cost_per_frame: formatCost(
      totalFrames ? totalCost / totalFrames : 0
    ),
    average_cost_per_second: formatCost(
      totalVideoSeconds ? totalCost / totalVideoSeconds : 0
    ),
    average_render_time_per_frame: formatMinutes(
      totalFrames ? totalRenderSeconds / totalFrames : 0
    ),
    earliest_render_date: createdTimes.length
      ? new Date(Math.min(...createdTimes)).toISOString()
      : "",
    latest_render_date: createdTimes.length
      ? new Date(Math.max(...createdTimes)).toISOString()
      : "",
    models_used: [...new Set(renders.map((render) => render.model))],
    most_used_model: mostUsed(renders.map((render) => render.model)),
    total_cost: totalCost,
    total_frames_rendered: totalFrames,
    total_queue_wait_time: formatDurationLabel(totalQueueSeconds),
    total_queue_wait_time_in_minutes: formatMinutes(totalQueueSeconds),
    total_render_time_in_seconds: totalRenderSeconds,
    total_successful_render_time_in_seconds: successfulRenderSeconds,
    total_time_rendered: formatDurationLabel(totalRenderSeconds)
  };

  return jobs.reduce<ProjectStats>(
    (accumulator, job, index) => {
      accumulator[job.id] = renders[index]!;
      return accumulator;
    },
    { total }
  );
};
