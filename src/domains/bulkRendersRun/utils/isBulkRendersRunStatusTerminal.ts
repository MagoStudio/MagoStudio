import { BulkRendersRunStatus } from "@schemas/bulkRendersRun";

const TERMINAL_STATUSES = new Set<BulkRendersRunStatus>([
  "COMPLETED",
  "FAILED",
  "CANCELLED"
]);

export const isBulkRendersRunStatusTerminal = (
  status: BulkRendersRunStatus
): boolean => TERMINAL_STATUSES.has(status);
