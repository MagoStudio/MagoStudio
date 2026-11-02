/**
 * Reads img2img render progress from `GET /assets/img2img/status/{clipId}`.
 *
 * Unlike video, img2img has no project-wide queue: the endpoint is keyed by
 * the cloud *clip* id and answers for exactly one render. Shape verified
 * against the same endpoint the cloud web app polls
 * (useGetImg2ImgRenderStatus.ts).
 */

export interface Img2ImgStatusResponse {
  status: string;
  outputUrl: string | null;
  progressPercent: number | null;
  failureReason: string | null;
}

/** The local job status a render status maps to. */
export type CloudJobStatus =
  | "INQUEUE"
  | "INPROGRESS"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED";

const FINISHED_STATUSES = new Set(["SUCCESS"]);
const FAILED_STATUSES = new Set(["FAILED", "TIMEOUT", "ERROR", "NOT_FOUND"]);
const CANCELLED_STATUSES = new Set(["CANCELLED", "CANCELED"]);
const PERCENT_PER_PROGRESS_FRACTION = 100;

const toProgressPercent = (progressFraction: unknown): number | null => {
  if (typeof progressFraction !== "number") return null;
  if (!Number.isFinite(progressFraction)) return null;
  const progressPercent = Math.round(
    progressFraction * PERCENT_PER_PROGRESS_FRACTION
  );
  return Math.min(PERCENT_PER_PROGRESS_FRACTION, Math.max(0, progressPercent));
};
const RUNNING_STATUSES = new Set(["STARTED", "RUNNING", "UPLOADING"]);
const QUEUED_STATUSES = new Set(["NOT-STARTED", "QUEUED", "CREATED"]);

const toFailureReason = (record: Record<string, unknown>): string | null => {
  const nestedData =
    record.data && typeof record.data === "object"
      ? (record.data as Record<string, unknown>)
      : {};
  const failureReason = record.error_message ?? nestedData.error_message;
  return typeof failureReason === "string" && failureReason.trim()
    ? failureReason.trim()
    : null;
};

export const parseImg2ImgStatus = (
  response: unknown
): Img2ImgStatusResponse => {
  const record = (response ?? {}) as Record<string, unknown>;
  const status = record.render_status;
  const outputUrl = record.output_url;
  return {
    status: typeof status === "string" ? status.trim() : "",
    outputUrl: typeof outputUrl === "string" && outputUrl ? outputUrl : null,
    progressPercent: toProgressPercent(record.progress),
    failureReason: toFailureReason(record)
  };
};

/**
 * Anything unrecognised counts as still queued rather than finished, so a new
 * server-side status can never make a job look done before its output exists.
 */
export const toImg2ImgJobStatus = (status: string): CloudJobStatus => {
  const normalized = status.toUpperCase();
  if (FINISHED_STATUSES.has(normalized)) return "SUCCESS";
  if (FAILED_STATUSES.has(normalized)) return "FAILED";
  if (CANCELLED_STATUSES.has(normalized)) return "CANCELLED";
  if (RUNNING_STATUSES.has(normalized)) return "INPROGRESS";
  if (QUEUED_STATUSES.has(normalized)) return "INQUEUE";
  return "INQUEUE";
};
