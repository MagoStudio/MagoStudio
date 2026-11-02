const FAILED_PLAN_STATUSES = new Set([
  "FAILED",
  "PAUSED",
  "CANCELLED",
  "ERROR"
]);

/** A finished run that did not deliver. Distinguished from `isPlanRunFinished`, which is true for
 * a successful run too — the tool advances the user on success only. */
export const isPlanRunFailed = (status: string | null | undefined): boolean =>
  !!status && FAILED_PLAN_STATUSES.has(status);
