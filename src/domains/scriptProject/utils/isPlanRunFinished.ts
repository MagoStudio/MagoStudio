const FINISHED_PLAN_STATUSES = new Set([
  "COMPLETED",
  "FAILED",
  "PAUSED",
  "CANCELLED",
  "ERROR"
]);

export const isPlanRunFinished = (status: string | null | undefined): boolean =>
  !!status && FINISHED_PLAN_STATUSES.has(status);
