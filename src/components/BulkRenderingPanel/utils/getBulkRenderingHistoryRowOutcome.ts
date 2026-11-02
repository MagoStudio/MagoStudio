import { BulkRendersRunStatus } from "@schemas/bulkRendersRun";

export interface BulkRenderingHistoryRowOutcome {
  labelKey: string;
  tone: "glyph-error" | "glyph-secondary";
}

export function getBulkRenderingHistoryRowOutcome(
  status: BulkRendersRunStatus
): BulkRenderingHistoryRowOutcome | undefined {
  if (status === "CANCELLED") {
    return { labelKey: "status.cancelled.label", tone: "glyph-secondary" };
  }
  if (status === "FAILED") {
    return { labelKey: "status.failed.label", tone: "glyph-error" };
  }
  return undefined;
}
