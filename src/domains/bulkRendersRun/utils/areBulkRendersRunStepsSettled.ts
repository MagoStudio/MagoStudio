import { BulkRendersRunStep } from "@schemas/bulkRendersRun";

const UNSETTLED_STEP_STATUSES = new Set(["PENDING", "RUNNING"]);

/** Whether a run's steps can still change.
 *
 * Steps that have not loaded yet are not settled — an empty list means "nothing read", not
 * "nothing left to do", and treating it as settled would stop a poll before it ever started. */
export const areBulkRendersRunStepsSettled = (
  steps: BulkRendersRunStep[] | undefined
): boolean =>
  !!steps &&
  steps.length > 0 &&
  steps.every((step) => !UNSETTLED_STEP_STATUSES.has(step.status));
