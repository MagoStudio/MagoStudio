import { BulkRendersRunStatus } from "@schemas/bulkRendersRun";

const FAILED_STATUSES = new Set<BulkRendersRunStatus>(["FAILED", "CANCELLED"]);

/** A run the user should see as failed. Cancelled counts: it did not deliver its renders, and
 * showing it as pending forever is the outcome this replaces. */
export const isBulkRendersRunStatusFailed = (
  status: BulkRendersRunStatus | undefined
): boolean => (status === undefined ? false : FAILED_STATUSES.has(status));
